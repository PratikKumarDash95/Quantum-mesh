package com.quantummesh.monitoring.service;

import com.quantummesh.monitoring.model.MetricSample;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Synthetic metric generator. In production this would consume from
 * Prometheus/Actuator endpoints across the mesh, but for local dev it
 * produces realistic-looking traffic so the dashboard has data immediately.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MetricsScheduler {

    private static final List<String> SERVICES = List.of(
            "auth-service",
            "gateway-service",
            "monitoring-service",
            "analytics-service",
            "notification-service",
            "ai-engine"
    );

    private final MetricsStore store;
    private final MetricsWebSocketBroadcaster broadcaster;

    @Scheduled(fixedRate = 2000)
    public void emit() {
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        for (String svc : SERVICES) {
            MetricSample sample = new MetricSample(
                    svc,
                    svc + "-1",
                    20 + rnd.nextDouble() * 60,
                    30 + rnd.nextDouble() * 50,
                    20 + rnd.nextDouble() * 200,
                    50 + rnd.nextLong(500),
                    rnd.nextDouble() * 5,
                    Instant.now()
            );
            store.record(sample);
            broadcaster.broadcast(sample);
        }
    }
}
