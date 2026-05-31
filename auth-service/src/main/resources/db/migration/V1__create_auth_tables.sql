-- V1 — initial auth schema
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(64)  NOT NULL,
    email       VARCHAR(128) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP,
    CONSTRAINT  uq_users_username UNIQUE (username),
    CONSTRAINT  uq_users_email    UNIQUE (email)
);

CREATE TABLE user_roles (
    user_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    VARCHAR(32) NOT NULL
);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
