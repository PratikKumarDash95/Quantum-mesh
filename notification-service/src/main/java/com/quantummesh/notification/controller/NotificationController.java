package com.quantummesh.notification.controller;

import com.quantummesh.notification.model.Alert;
import com.quantummesh.notification.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final AlertService alertService;

    @GetMapping("/alerts")
    public List<Alert> alerts(@RequestParam(defaultValue = "50") int limit) {
        return alertService.recent(Math.min(limit, 500));
    }

    @PostMapping("/alerts")
    public Alert create(@RequestBody Map<String, String> body) {
        return alertService.raise(
                body.getOrDefault("service", "unknown"),
                body.getOrDefault("severity", "INFO"),
                body.getOrDefault("message", "")
        );
    }
}
