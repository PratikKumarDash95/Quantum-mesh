package com.quantummesh.auth.service;

import com.quantummesh.auth.entity.RefreshToken;
import com.quantummesh.auth.entity.User;
import com.quantummesh.auth.repository.RefreshTokenRepository;
import com.quantummesh.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom RNG = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Value("${quantummesh.jwt.refresh-ttl-days:7}")
    private int ttlDays;

    public record Issued(String plaintext, RefreshToken stored) {}

    @Transactional
    public Issued issueFor(User user) {
        String plaintext = randomToken();
        RefreshToken stored = RefreshToken.builder()
                .tokenHash(sha256(plaintext))
                .userId(user.getId())
                .expiresAt(Instant.now().plus(ttlDays, ChronoUnit.DAYS))
                .revoked(false)
                .build();
        refreshTokenRepository.save(stored);
        return new Issued(plaintext, stored);
    }

    /** Single-use: marks the supplied refresh token revoked and returns the matching user. */
    @Transactional
    public User consume(String plaintext) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(sha256(plaintext))
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Unknown refresh token"));
        if (stored.isRevoked()) {
            // Reuse of a revoked token: revoke everything for that user as a precaution.
            refreshTokenRepository.revokeAllForUser(stored.getUserId());
            throw new ResponseStatusException(UNAUTHORIZED, "Refresh token reused");
        }
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Refresh token expired");
        }
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User no longer exists"));
    }

    @Transactional
    public void revokeAllForUser(Long userId) {
        refreshTokenRepository.revokeAllForUser(userId);
    }

    static String randomToken() {
        byte[] buf = new byte[48];
        RNG.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }
}
