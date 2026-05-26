package com.quantummesh.auth.controller;

import com.quantummesh.auth.dto.AuthResponse;
import com.quantummesh.auth.dto.LoginRequest;
import com.quantummesh.auth.dto.RefreshTokenRequest;
import com.quantummesh.auth.dto.RegisterRequest;
import com.quantummesh.auth.service.AuthService;
import com.quantummesh.auth.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestHeader(value = "X-User-Name", required = false) String username) {
        if (username != null && !username.isBlank()) {
            authService.logout(username);
        }
        return ResponseEntity.ok(Map.of("status", "logged-out"));
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "token missing"));
        }
        try {
            String username = jwtService.extractUsername(token);
            boolean valid = jwtService.isTokenValid(token, username);
            return ResponseEntity.ok(Map.of(
                    "valid", valid,
                    "username", username
            ));
        } catch (Exception ex) {
            return ResponseEntity.ok(Map.of("valid", false, "error", ex.getMessage()));
        }
    }
}
