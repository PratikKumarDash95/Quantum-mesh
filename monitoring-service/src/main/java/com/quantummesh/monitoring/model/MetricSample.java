package com.quantummesh.monitoring.model;

import java.time.Instant;

public record MetricSample(
        String service,
        String instanceId,
        double cpuPercent,
        double memoryPercent,
        double latencyMillis,
        long requestsPerSecond,
        double errorRatePercent,
        Instant timestamp
) {}
