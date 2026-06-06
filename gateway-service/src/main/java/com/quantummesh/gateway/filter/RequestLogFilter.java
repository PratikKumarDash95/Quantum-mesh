package com.quantummesh.gateway.filter;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URI;

/**
 * Captures every request that exits the gateway and forwards a structured log
 * entry to auth-service ({@code POST /api/v1/internal/request-logs}). Runs at
 * the lowest precedence so we observe the final status code and total latency.
 *
 * <p>Fire-and-forget — backend slowness must never backpressure user traffic.
 */
@Slf4j
@Component
public class RequestLogFilter implements GlobalFilter, Ordered {

    private static final String START_TIME_ATTR = "qm.requestLog.startNanos";

    private final WebClient authClient;

    public RequestLogFilter(@Qualifier("authServiceWebClient") WebClient authClient) {
        this.authClient = authClient;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/actuator")
                || path.startsWith("/fallback")
                || path.startsWith("/api/v1/internal/")) {
            return chain.filter(exchange);
        }

        long start = System.nanoTime();
        exchange.getAttributes().put(START_TIME_ATTR, start);

        return chain.filter(exchange).doFinally(signal -> publish(exchange, start));
    }

    private void publish(ServerWebExchange exchange, long start) {
        try {
            ServerHttpRequest req = exchange.getRequest();
            ServerHttpResponse res = exchange.getResponse();
            long latencyMs = (System.nanoTime() - start) / 1_000_000L;

            String username = req.getHeaders().getFirst("X-User-Name");
            String roles = req.getHeaders().getFirst("X-User-Roles");
            String apiKeyPrefix = req.getHeaders().getFirst("X-Api-Key-Prefix");

            if (username == null || username.isBlank()) {
                return;
            }

            Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
            String downstream = resolveDownstream(route, req.getURI().getPath());
            int statusCode = res.getStatusCode() == null ? 0 : res.getStatusCode().value();

            Payload payload = new Payload(
                    username,
                    apiKeyPrefix,
                    req.getMethod() == null ? "GET" : req.getMethod().name(),
                    req.getURI().getPath(),
                    downstream,
                    statusCode,
                    latencyMs,
                    roles
            );

            authClient.post()
                    .uri("/api/v1/internal/request-logs")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Internal-Caller", "gateway")
                    .bodyValue(payload)
                    .retrieve()
                    .toBodilessEntity()
                    .subscribeOn(Schedulers.boundedElastic())
                    .subscribe(
                            ok -> {},
                            err -> log.debug("request-log ingest failed: {}", err.toString())
                    );
        } catch (Exception ex) {
            log.debug("request-log filter error: {}", ex.toString());
        }
    }

    private String resolveDownstream(Route route, String path) {
        if (route != null) {
            URI uri = route.getUri();
            if (uri != null) {
                String host = uri.getHost();
                if (host != null && !host.isBlank()) {
                    return host;
                }
                String scheme = uri.getScheme();
                if (scheme != null) {
                    return scheme;
                }
            }
            if (route.getId() != null) return route.getId();
        }
        if (path.startsWith("/api/v1/auth")) return "auth-service";
        if (path.startsWith("/api/v1/monitoring")) return "monitoring-service";
        if (path.startsWith("/api/v1/analytics")) return "analytics-service";
        if (path.startsWith("/api/v1/notifications")) return "notification-service";
        if (path.startsWith("/api/v1/ai")) return "ai-engine";
        return "unknown";
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Payload(
            String username,
            String apiKeyPrefix,
            String method,
            String path,
            String downstreamService,
            Integer statusCode,
            Long latencyMs,
            String tier
    ) {}
}
