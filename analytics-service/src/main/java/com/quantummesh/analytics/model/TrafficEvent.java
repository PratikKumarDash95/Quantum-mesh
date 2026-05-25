package com.quantummesh.analytics.model;

import java.time.Instant;

public record TrafficEvent(
        String service,
        String path,
        String method,
        int statusCode,
        long latencyMillis,
        String clientIp,
        Instant timestamp
) {}
