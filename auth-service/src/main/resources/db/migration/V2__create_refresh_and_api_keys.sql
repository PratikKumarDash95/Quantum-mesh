-- V2 — refresh tokens & API keys

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token_hash  VARCHAR(128) NOT NULL,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP    NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL,
    CONSTRAINT  uq_refresh_token_hash UNIQUE (token_hash)
);
CREATE INDEX idx_refresh_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_user       ON refresh_tokens(user_id);

CREATE TABLE api_keys (
    id           BIGSERIAL PRIMARY KEY,
    key_hash     VARCHAR(128) NOT NULL,
    key_prefix   VARCHAR(16)  NOT NULL,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(80)  NOT NULL,
    tier         VARCHAR(16)  NOT NULL,
    expires_at   TIMESTAMP,
    last_used_at TIMESTAMP,
    revoked      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL,
    CONSTRAINT   uq_api_key_hash UNIQUE (key_hash)
);
CREATE INDEX idx_api_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_key_user ON api_keys(user_id);
