-- V3 — gateway request audit log

CREATE TABLE request_logs (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_prefix      VARCHAR(16),
    method              VARCHAR(8)   NOT NULL,
    path                VARCHAR(512) NOT NULL,
    downstream_service  VARCHAR(64)  NOT NULL,
    status_code         INTEGER      NOT NULL,
    latency_ms          BIGINT       NOT NULL,
    cost_micros         BIGINT       NOT NULL DEFAULT 0,
    timestamp           TIMESTAMP    NOT NULL
);
CREATE INDEX idx_request_log_user_ts     ON request_logs(user_id, timestamp DESC);
CREATE INDEX idx_request_log_user_svc_ts ON request_logs(user_id, downstream_service, timestamp);
