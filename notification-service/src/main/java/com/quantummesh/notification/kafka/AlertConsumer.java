package com.quantummesh.notification.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantummesh.notification.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AlertConsumer {

    private final AlertService alertService;
    private final ObjectMapper mapper;

    @KafkaListener(
            topics = "${quantummesh.kafka.topic.alerts:quantummesh.alerts}",
            groupId = "${spring.kafka.consumer.group-id:notification-service}"
    )
    public void onAlert(String payload) {
        try {
            JsonNode node = mapper.readTree(payload);
            alertService.raise(
                    node.path("service").asText("unknown"),
                    node.path("severity").asText("INFO"),
                    node.path("message").asText("")
            );
        } catch (Exception ex) {
            log.warn("Failed to parse alert payload: {}", ex.getMessage());
        }
    }
}
