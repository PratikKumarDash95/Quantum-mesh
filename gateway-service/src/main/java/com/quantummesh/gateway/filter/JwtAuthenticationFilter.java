package com.quantummesh.gateway.filter;

import com.quantummesh.gateway.security.CachedClaims;
import com.quantummesh.gateway.security.JwtValidationCache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    private static final Set<String> OPEN_PATHS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/validate",
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/validate",
            "/actuator/health",
            "/actuator/prometheus"
    );

    private final JwtValidationCache jwtCache;

    public JwtAuthenticationFilter(JwtValidationCache jwtCache) {
        super(Config.class);
        this.jwtCache = jwtCache;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();

            if (OPEN_PATHS.stream().anyMatch(path::startsWith)) {
                return chain.filter(exchange);
            }

            List<String> authHeaders = request.getHeaders().get(HttpHeaders.AUTHORIZATION);
            if (authHeaders == null || authHeaders.isEmpty()) {
                return unauthorized(exchange, "Missing Authorization header");
            }

            String header = authHeaders.get(0);
            if (!header.startsWith("Bearer ")) {
                return unauthorized(exchange, "Invalid Authorization scheme");
            }

            String token = header.substring(7);

            return jwtCache.getClaims(token)
                    .flatMap(claims -> {
                        ServerHttpRequest mutated = request.mutate()
                                .header("X-User-Name", claims.subject() == null ? "" : claims.subject())
                                .header("X-User-Roles", claims.roles() == null ? "" : claims.roles())
                                .build();
                        return chain.filter(exchange.mutate().request(mutated).build());
                    })
                    .switchIfEmpty(Mono.defer(() -> unauthorized(exchange, "Invalid or expired token")))
                    .onErrorResume(ex -> {
                        log.warn("JWT validation failed: {}", ex.getMessage());
                        return unauthorized(exchange, "Token parse error");
                    });
        };
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String reason) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add("X-QuantumMesh-Auth-Error", reason);
        return exchange.getResponse().setComplete();
    }

    public static class Config {
        // intentionally empty
    }
}
