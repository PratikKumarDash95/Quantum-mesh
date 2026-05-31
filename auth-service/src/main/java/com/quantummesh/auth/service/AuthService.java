package com.quantummesh.auth.service;

import com.quantummesh.auth.dto.AuthResponse;
import com.quantummesh.auth.dto.LoginRequest;
import com.quantummesh.auth.dto.RegisterRequest;
import com.quantummesh.auth.entity.User;
import com.quantummesh.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(CONFLICT, "Email already registered");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .roles(Set.of("ROLE_USER"))
                .enabled(true)
                .build();
        userRepository.save(user);

        return issueToken(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
        }
        if (!user.isEnabled()) {
            throw new ResponseStatusException(UNAUTHORIZED, "User disabled");
        }
        return issueToken(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        User user = refreshTokenService.consume(refreshToken);
        return issueToken(user);
    }

    @Transactional
    public void logout(String username) {
        userRepository.findByUsername(username)
                .ifPresent(u -> refreshTokenService.revokeAllForUser(u.getId()));
    }

    private AuthResponse issueToken(User user) {
        String access = jwtService.generateToken(user.getUsername(), user.getRoles());
        RefreshTokenService.Issued refresh = refreshTokenService.issueFor(user);
        return new AuthResponse(
                access,
                refresh.plaintext(),
                "Bearer",
                jwtService.getExpirationMillis() / 1000,
                user.getUsername(),
                user.getRoles()
        );
    }
}
