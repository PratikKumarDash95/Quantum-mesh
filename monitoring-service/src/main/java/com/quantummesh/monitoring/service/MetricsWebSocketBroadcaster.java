package com.quantummesh.monitoring.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantummesh.monitoring.model.MetricSample;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class MetricsWebSocketBroadcaster {

    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @PostConstruct
    void init() {
        log.info("Metrics WebSocket broadcaster initialized");
    }

    public void register(WebSocketSession session) {
        sessions.add(session);
    }

    public void unregister(WebSocketSession session) {
        sessions.remove(session);
    }

    public void broadcast(MetricSample sample) {
        if (sessions.isEmpty()) return;
        try {
            String payload = objectMapper.writeValueAsString(sample);
            TextMessage message = new TextMessage(payload);
            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    try {
                        s.sendMessage(message);
                    } catch (Exception ex) {
                        log.debug("WebSocket send failed: {}", ex.getMessage());
                        sessions.remove(s);
                    }
                } else {
                    sessions.remove(s);
                }
            }
        } catch (Exception ex) {
            log.warn("Broadcast failure: {}", ex.getMessage());
        }
    }
}
