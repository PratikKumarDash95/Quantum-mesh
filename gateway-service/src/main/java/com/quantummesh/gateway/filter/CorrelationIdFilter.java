package com.quantummesh.gateway.filter;

import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Generates or propagates an X-Correlation-ID header for every request and
 * places it on the MDC so logback can emit it on structured logs.
 *
 * Runs before authentication so even rejected requests carry a correlation id.
 */
@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {

    public static final String HEADER = "X-Correlation-ID";
    public static final String MDC_KEY = "correlationId";

    @Override
    public Mono<Void> filter(
            org.springframework.web.server.ServerWebExchange exchange,
            org.springframework.cloud.gateway.filter.GatewayFilterChain chain
    ) {
        ServerHttpRequest request = exchange.getRequest();
        String existing = request.getHeaders().getFirst(HEADER);
        String correlationId = (existing == null || existing.isBlank())
                ? UUID.randomUUID().toString()
                : existing;

        ServerHttpRequest mutated = request.mutate().header(HEADER, correlationId).build();
        exchange.getResponse().getHeaders().add(HEADER, correlationId);

        MDC.put(MDC_KEY, correlationId);
        return chain.filter(exchange.mutate().request(mutated).build())
                .doFinally(s -> MDC.remove(MDC_KEY));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
