package com.quantummesh.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "request_logs", indexes = {
        @Index(name = "idx_request_log_user_ts", columnList = "user_id, timestamp DESC"),
        @Index(name = "idx_request_log_user_svc_ts", columnList = "user_id, downstream_service, timestamp")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "api_key_prefix", length = 16)
    private String apiKeyPrefix;

    @Column(name = "method", nullable = false, length = 8)
    private String method;

    @Column(name = "path", nullable = false, length = 512)
    private String path;

    @Column(name = "downstream_service", nullable = false, length = 64)
    private String downstreamService;

    @Column(name = "status_code", nullable = false)
    private int statusCode;

    @Column(name = "latency_ms", nullable = false)
    private long latencyMs;

    @Column(name = "cost_micros", nullable = false)
    private long costMicros;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @PrePersist
    public void prePersist() {
        if (timestamp == null) timestamp = Instant.now();
    }
}
