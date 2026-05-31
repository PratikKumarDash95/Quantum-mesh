package com.quantummesh.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMillis;
    private final String issuer;

    public JwtService(
            @Value("${quantummesh.jwt.secret:change-me-please-use-a-long-random-secret-key-32bytes-min}") String secret,
            @Value("${quantummesh.jwt.expiration-ms:3600000}") long expirationMillis,
            @Value("${quantummesh.jwt.issuer:quantummesh-auth}") String issuer
    ) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMillis = expirationMillis;
        this.issuer = issuer;
    }

    public String generateToken(String username, Set<String> roles) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMillis);
        return Jwts.builder()
                .issuer(issuer)
                .subject(username)
                .issuedAt(now)
                .expiration(expiry)
                .claims(Map.of("roles", roles))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public long getExpirationMillis() {
        return expirationMillis;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public boolean isTokenValid(String token, String username) {
        try {
            String extracted = extractUsername(token);
            return extracted.equals(username) && extractExpiration(token).after(new Date());
        } catch (Exception ex) {
            return false;
        }
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return resolver.apply(claims);
    }
}
