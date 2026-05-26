package com.quantummesh.auth.controller;

import com.quantummesh.auth.dto.RequestLogIngestRequest;
import com.quantummesh.auth.dto.RequestLogView;
import com.quantummesh.auth.dto.UsageSummaryResponse;
import com.quantummesh.auth.entity.User;
import com.quantummesh.auth.repository.UserRepository;
import com.quantummesh.auth.service.RequestLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequiredArgsConstructor
public class RequestLogController {

    private final RequestLogService requestLogService;
    private final UserRepository userRepository;

    @PostMapping("/api/v1/internal/request-logs")
    public ResponseEntity<Map<String, String>> ingest(
            @RequestHeader(value = "X-Internal-Caller", required = false) String caller,
            @RequestBody RequestLogIngestRequest body
    ) {
        if (caller == null || !caller.equalsIgnoreCase("gateway")) {
            throw new ResponseStatusException(FORBIDDEN, "Not an internal caller");
        }
        requestLogService.ingest(body);
        return ResponseEntity.ok(Map.of("status", "logged"));
    }

    @GetMapping("/api/v1/usage/me")
    public ResponseEntity<UsageSummaryResponse> mySummary(
            @RequestHeader("X-User-Name") String username
    ) {
        return ResponseEntity.ok(requestLogService.summarizeForUser(loadUser(username)));
    }

    @GetMapping("/api/v1/usage/me/logs")
    public ResponseEntity<List<RequestLogView>> myLogs(
            @RequestHeader("X-User-Name") String username,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String service
    ) {
        return ResponseEntity.ok(
                requestLogService.listForUser(loadUser(username), limit, status, service)
        );
    }

    private User loadUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Unknown principal"));
    }
}
