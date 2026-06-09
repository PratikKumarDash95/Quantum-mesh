package com.quantummesh.notification.service;

import com.quantummesh.notification.model.Alert;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;

@Slf4j
@Service
public class AlertService {

    private static final int MAX = 500;
    private final ConcurrentLinkedDeque<Alert> alerts = new ConcurrentLinkedDeque<>();

    public Alert raise(String service, String severity, String message) {
        Alert alert = new Alert(
                UUID.randomUUID().toString(),
                service,
                severity,
                message,
                Instant.now()
        );
        alerts.add(alert);
        while (alerts.size() > MAX) alerts.pollFirst();
        log.info("Alert raised [{}] {}: {}", severity, service, message);
        return alert;
    }

    public List<Alert> recent(int limit) {
        List<Alert> all = new ArrayList<>(alerts);
        int from = Math.max(0, all.size() - limit);
        List<Alert> tail = new ArrayList<>(all.subList(from, all.size()));
        Collections.reverse(tail);
        return tail;
    }
}
