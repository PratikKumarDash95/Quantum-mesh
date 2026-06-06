package com.quantummesh.gateway.security;

/**
 * Lightweight projection of the JWT claims that downstream filters actually
 * read. Cached in Redis so repeated requests with the same token can skip the
 * full parse + signature-verification round-trip.
 */
public record CachedClaims(String subject, String roles, long expirationMillis) {

    public boolean isExpired(long nowMillis) {
        return expirationMillis > 0 && expirationMillis < nowMillis;
    }
}
