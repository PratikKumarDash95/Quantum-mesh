package com.quantummesh.auth.controller;

import com.quantummesh.auth.dto.ApiKeyCreateRequest;
import com.quantummesh.auth.dto.ApiKeyCreatedResponse;
import com.quantummesh.auth.dto.ApiKeyView;
import com.quantummesh.auth.entity.User;
import com.quantummesh.auth.repository.UserRepository;
import com.quantummesh.auth.service.ApiKeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService apiKeyService;
    private final UserRepository userRepository;

    @PostMapping("/api/v1/auth/api-keys")
    public ResponseEntity<ApiKeyCreatedResponse> create(
            @RequestHeader("X-User-Name") String username,
            @Valid @RequestBody ApiKeyCreateRequest request
    ) {
        return ResponseEntity.ok(
                apiKeyService.create(loadUser(username), request.name(), request.tier(), request.ttlDays())
        );
    }

    @GetMapping("/api/v1/auth/api-keys")
    public ResponseEntity<List<ApiKeyView>> list(@RequestHeader("X-User-Name") String username) {
        return ResponseEntity.ok(apiKeyService.list(loadUser(username)));
    }

    @DeleteMapping("/api/v1/auth/api-keys/{id}")
    public ResponseEntity<Map<String, Object>> revoke(
            @RequestHeader("X-User-Name") String username,
            @PathVariable Long id
    ) {
        apiKeyService.revoke(loadUser(username), id);
        return ResponseEntity.ok(Map.of("status", "revoked", "id", id));
    }

    /** Public — clients exchange a plaintext API key for a short-lived JWT. */
    @PostMapping("/api/v1/auth/exchange")
    public ResponseEntity<Map<String, Object>> exchange(@RequestBody Map<String, String> body) {
        String key = body.get("apiKey");
        if (key == null || key.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Missing apiKey");
        }
        String jwt = apiKeyService.exchange(key);
        return ResponseEntity.ok(Map.of("accessToken", jwt, "tokenType", "Bearer"));
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Unknown principal"));
    }
}
