package com.quantummesh.auth.service;

import com.quantummesh.auth.dto.ApiKeyCreatedResponse;
import com.quantummesh.auth.dto.ApiKeyView;
import com.quantummesh.auth.entity.ApiKey;
import com.quantummesh.auth.entity.User;
import com.quantummesh.auth.repository.ApiKeyRepository;
import com.quantummesh.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private static final Set<String> ALLOWED_TIERS = Set.of("FREE", "PREMIUM", "ADMIN");
    private static final String KEY_PREFIX_LITERAL = "qm_";

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Transactional
    public ApiKeyCreatedResponse create(User owner, String name, String tier, Integer ttlDays) {
        String normalizedTier = tier == null ? "FREE" : tier.toUpperCase();
        if (!ALLOWED_TIERS.contains(normalizedTier)) {
            throw new ResponseStatusException(FORBIDDEN, "Unsupported tier: " + tier);
        }
        if (!"FREE".equals(normalizedTier) && !owner.getRoles().contains("ROLE_ADMIN")) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can mint non-FREE keys");
        }

        String plaintext = KEY_PREFIX_LITERAL + RefreshTokenService.randomToken();
        String hash = RefreshTokenService.sha256(plaintext);
        String prefix = plaintext.substring(0, Math.min(12, plaintext.length()));
        Instant expiresAt = ttlDays == null ? null : Instant.now().plus(ttlDays, ChronoUnit.DAYS);

        ApiKey saved = apiKeyRepository.save(ApiKey.builder()
                .keyHash(hash)
                .keyPrefix(prefix)
                .userId(owner.getId())
                .name(name)
                .tier(normalizedTier)
                .expiresAt(expiresAt)
                .revoked(false)
                .build());

        return new ApiKeyCreatedResponse(toView(saved), plaintext);
    }

    @Transactional(readOnly = true)
    public List<ApiKeyView> list(User owner) {
        return apiKeyRepository.findAllByUserIdOrderByCreatedAtDesc(owner.getId())
                .stream().map(this::toView).toList();
    }

    @Transactional
    public void revoke(User owner, Long id) {
        ApiKey key = apiKeyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Key not found"));
        if (!key.getUserId().equals(owner.getId()) && !owner.getRoles().contains("ROLE_ADMIN")) {
            throw new ResponseStatusException(FORBIDDEN, "Not your key");
        }
        key.setRevoked(true);
        apiKeyRepository.save(key);
    }

    /**
     * Exchange a plaintext API key for a short-lived access JWT. Tier is encoded
     * into the JWT roles claim so the gateway can resolve the rate-limit tier.
     */
    @Transactional
    public String exchange(String plaintextKey) {
        ApiKey key = apiKeyRepository.findByKeyHash(RefreshTokenService.sha256(plaintextKey))
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid API key"));
        if (key.isRevoked()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Revoked API key");
        }
        if (key.getExpiresAt() != null && key.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(UNAUTHORIZED, "API key expired");
        }
        User user = userRepository.findById(key.getUserId())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Owner missing"));

        key.setLastUsedAt(Instant.now());
        apiKeyRepository.save(key);

        Set<String> roles = new java.util.HashSet<>(user.getRoles());
        roles.add("ROLE_" + key.getTier());
        return jwtService.generateToken(user.getUsername(), roles);
    }

    private ApiKeyView toView(ApiKey k) {
        return new ApiKeyView(
                k.getId(),
                k.getName(),
                k.getKeyPrefix(),
                k.getTier(),
                k.getExpiresAt(),
                k.getLastUsedAt(),
                k.isRevoked(),
                k.getCreatedAt()
        );
    }
}
