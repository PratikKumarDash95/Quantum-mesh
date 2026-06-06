package com.quantummesh.gateway.filter;

import com.quantummesh.gateway.ratelimit.RateLimiterRegistry;
import com.quantummesh.gateway.ratelimit.Tier;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.net.InetSocketAddress;

@Component
public class RateLimitFilter extends AbstractGatewayFilterFactory<RateLimitFilter.Config> {

    private final ObjectProvider<RateLimiterRegistry> registryProvider;

    public RateLimitFilter(ObjectProvider<RateLimiterRegistry> registryProvider) {
        super(Config.class);
        this.registryProvider = registryProvider;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            RateLimiterRegistry registry = registryProvider.getObject();
            ServerHttpRequest request = exchange.getRequest();
            String key = resolveKey(request);
            Tier tier = Tier.fromRolesHeader(request.getHeaders().getFirst("X-User-Roles"));

            RateLimiterRegistry.Decision decision = registry.tryConsume(key, tier);

            exchange.getResponse().getHeaders().add("X-QuantumMesh-RateLimit-Tier", tier.name());
            exchange.getResponse().getHeaders().add(
                    "X-QuantumMesh-RateLimit-Burst-Remaining",
                    String.valueOf(decision.burstRemaining())
            );
            exchange.getResponse().getHeaders().add(
                    "X-QuantumMesh-RateLimit-Window",
                    decision.windowUsed() + "/" + tier.windowMax()
            );

            if (!decision.allowed()) {
                exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                exchange.getResponse().getHeaders().add("X-QuantumMesh-RateLimit", "exceeded");
                exchange.getResponse().getHeaders().add(
                        "X-QuantumMesh-RateLimit-Reason", decision.rejectReason()
                );
                long retryAfter = "burst".equals(decision.rejectReason())
                        ? 1L
                        : Math.max(1L, tier.windowMillis() / 1000L);
                exchange.getResponse().getHeaders().add("Retry-After", String.valueOf(retryAfter));
                return exchange.getResponse().setComplete();
            }
            return chain.filter(exchange);
        };
    }

    private String resolveKey(ServerHttpRequest request) {
        String user = request.getHeaders().getFirst("X-User-Name");
        if (user != null && !user.isBlank()) {
            return "user:" + user;
        }
        String apiKey = request.getHeaders().getFirst("X-API-Key");
        if (apiKey != null && !apiKey.isBlank()) {
            return "apikey:" + apiKey;
        }
        InetSocketAddress addr = request.getRemoteAddress();
        return "ip:" + (addr == null ? "unknown" : addr.getAddress().getHostAddress());
    }

    public static class Config {
        // intentionally empty
    }
}
