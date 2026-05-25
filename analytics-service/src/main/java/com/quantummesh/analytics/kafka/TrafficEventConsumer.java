package com.quantummesh.analytics.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantummesh.analytics.model.TrafficEvent;
import com.quantummesh.analytics.service.AnalyticsStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrafficEventConsumer {

    private final AnalyticsStore store;
    private final ObjectMapper mapper;

    @KafkaListener(
            topics = "${quantummesh.kafka.topic.traffic:quantummesh.traffic}",
            groupId = "${spring.kafka.consumer.group-id:analytics-service}"
    )
    public void onEvent(String payload) {
        try {
            TrafficEvent event = mapper.readValue(payload, TrafficEvent.class);
            store.record(event);
        } catch (Exception ex) {
            log.warn("Failed to parse traffic event: {}", ex.getMessage());
        }
    }
}
