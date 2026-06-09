package com.quantummesh.notification.model;

import java.time.Instant;

public record Alert(
        String id,
        String service,
        String severity,
        String message,
        Instant timestamp
) {}
