package com.quantummesh.gateway.chaos;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Optional;

/**
 * Reactive global filter that, when a {@link ChaosRule} matches the request
 * path, injects a delay, an error response, or aborts the call outright. Runs
 * after auth + rate limiting (negative order = earlier in the chain; we sit
 * just before the routing filter).
 *
 * Gated by {@code quantummesh.chaos.enabled} so production builds ship inert.
 */
@Slf4j
@Component
public class ChaosFilter implements GlobalFilter, Ordered {

    private final ChaosRegistry registry;
    private final boolean enabled;

    public ChaosFilter(
            ChaosRegistry registry,
            @Value("${quantummesh.chaos.enabled:false}") boolean enabled
    ) {
        this.registry = registry;
        this.enabled = enabled;
        if (enabled) {
            log.warn("Chaos engineering is ENABLED on this gateway. Rules at POST /actuator/chaos.");
        }
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!enabled) {
            return chain.filter(exchange);
        }
        String path = exchange.getRequest().getURI().getPath();
        Optional<ChaosRule> match = registry.matchFor(path);
        if (match.isEmpty()) {
            return chain.filter(exchange);
        }
        ChaosRule rule = match.get();
        exchange.getResponse().getHeaders().add("X-Chaos-Injected", rule.getType().name());

        return switch (rule.getType()) {
            case DELAY -> Mono.delay(Duration.ofMillis(rule.getDelayMillis()))
                    .then(chain.filter(exchange));
            case ERROR -> {
                exchange.getResponse().setStatusCode(
                        HttpStatus.valueOf(rule.getErrorStatus() == 0 ? 500 : rule.getErrorStatus())
                );
                yield exchange.getResponse().setComplete();
            }
            case ABORT -> {
                exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
                yield exchange.getResponse().setComplete();
            }
        };
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
