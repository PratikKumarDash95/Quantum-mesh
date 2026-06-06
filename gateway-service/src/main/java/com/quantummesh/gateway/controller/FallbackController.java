package com.quantummesh.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/monitoring")
    public ResponseEntity<Map<String, Object>> monitoring() {
        return fallback("monitoring-service");
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> analytics() {
        return fallback("analytics-service");
    }

    @GetMapping("/notifications")
    public ResponseEntity<Map<String, Object>> notifications() {
        return fallback("notification-service");
    }

    @GetMapping("/ai")
    public ResponseEntity<Map<String, Object>> ai() {
        return fallback("ai-engine");
    }

    private ResponseEntity<Map<String, Object>> fallback(String service) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "service", service,
                "status", "fallback",
                "message", "Downstream service is temporarily unavailable. Please retry shortly.",
                "timestamp", Instant.now().toString()
        ));
    }
}
