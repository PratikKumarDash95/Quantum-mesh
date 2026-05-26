package com.quantummesh.auth.dto;

import java.time.Instant;

public record ApiKeyView(
        Long id,
        String name,
        String prefix,
        String tier,
        Instant expiresAt,
        Instant lastUsedAt,
        boolean revoked,
        Instant createdAt
) {}
