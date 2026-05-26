package com.quantummesh.auth.dto;

public record RequestLogIngestRequest(
        String username,
        String apiKeyPrefix,
        String method,
        String path,
        String downstreamService,
        Integer statusCode,
        Long latencyMs,
        String tier
) {}
