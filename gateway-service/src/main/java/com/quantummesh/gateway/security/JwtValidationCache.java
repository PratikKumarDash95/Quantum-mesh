package com.quantummesh.gateway.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Date;
import java.util.HexFormat;

/**
 * Cache-aside Redis wrapper around {@link JwtValidator}. Cache key is a
 * SHA-256 of the token (so the token itself never lands in Redis). TTL is
 * capped at the smaller of the token's remaining lifetime and a configured
 * upper bound. If Redis is unreachable for any reason, the cache silently
 * falls back to direct validation — auth must keep working even when the
 * cache is down.
 */
@Slf4j
@Component
public class JwtValidationCache {

    private static final String KEY_PREFIX = "jwt:";

    private final JwtValidator validator;
    private final ReactiveRedisTemplate<String, String> redis;
    private final ObjectMapper mapper;
    private final boolean enabled;
    private final long maxTtlSeconds;

    public JwtValidationCache(
            JwtValidator validator,
            ReactiveRedisTemplate<String, String> redis,
            ObjectMapper mapper,
            @Value("${quantummesh.cache.jwt.enabled:true}") boolean enabled,
            @Value("${quantummesh.cache.jwt.ttl-seconds:300}") long maxTtlSeconds
    ) {
        this.validator = validator;
        this.redis = redis;
        this.mapper = mapper;
        this.enabled = enabled;
        this.maxTtlSeconds = maxTtlSeconds;
    }

    public Mono<CachedClaims> getClaims(String token) {
        if (!enabled) {
            return Mono.fromCallable(() -> projectAndValidate(token));
        }
        String key = KEY_PREFIX + sha256(token);
        return redis.opsForValue().get(key)
                .flatMap(json -> deserialize(json)
                        .map(Mono::just)
                        .orElseGet(() -> parseAndCache(key, token)))
                .switchIfEmpty(parseAndCache(key, token))
                .onErrorResume(ex -> {
                    log.warn("JWT cache fallback (parse direct): {}", ex.toString());
                    return Mono.fromCallable(() -> projectAndValidate(token));
                })
                .filter(c -> !c.isExpired(System.currentTimeMillis()));
    }

    private Mono<CachedClaims> parseAndCache(String key, String token) {
        return Mono.fromCallable(() -> projectAndValidate(token))
                .flatMap(claims -> {
                    String json;
                    try {
                        json = mapper.writeValueAsString(claims);
                    } catch (JsonProcessingException e) {
                        return Mono.just(claims);
                    }
                    long ttl = computeTtlSeconds(claims.expirationMillis());
                    if (ttl <= 0) {
                        return Mono.just(claims);
                    }
                    return redis.opsForValue()
                            .set(key, json, Duration.ofSeconds(ttl))
                            .onErrorResume(ex -> {
                                log.debug("JWT cache write failed: {}", ex.toString());
                                return Mono.just(false);
                            })
                            .thenReturn(claims);
                });
    }

    private CachedClaims projectAndValidate(String token) {
        Claims claims = validator.parse(token);
        Date exp = claims.getExpiration();
        long expMillis = exp == null ? 0 : exp.getTime();
        if (expMillis > 0 && expMillis <= System.currentTimeMillis()) {
            throw new IllegalArgumentException("Token expired");
        }
        String subject = claims.getSubject();
        Object roles = claims.get("roles");
        return new CachedClaims(subject, String.valueOf(roles), expMillis);
    }

    private java.util.Optional<CachedClaims> deserialize(String json) {
        try {
            return java.util.Optional.of(mapper.readValue(json, CachedClaims.class));
        } catch (Exception e) {
            log.debug("JWT cache deserialize failed, will re-parse: {}", e.toString());
            return java.util.Optional.empty();
        }
    }

    private long computeTtlSeconds(long expirationMillis) {
        if (expirationMillis <= 0) {
            return maxTtlSeconds;
        }
        long remaining = (expirationMillis - System.currentTimeMillis()) / 1000;
        return Math.min(Math.max(remaining, 0), maxTtlSeconds);
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
