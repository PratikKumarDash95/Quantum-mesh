package com.quantummesh.auth.dto;

import java.time.Instant;

public record RequestLogView(
        Long id,
        String method,
        String path,
        String downstreamService,
        String apiKeyPrefix,
        int statusCode,
        long latencyMs,
        long costMicros,
        Instant timestamp
) {}
