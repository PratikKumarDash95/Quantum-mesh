package com.quantummesh.analytics.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantummesh.analytics.model.TrafficEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrafficEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper mapper;

    @Value("${quantummesh.kafka.topic.traffic:quantummesh.traffic}")
    private String topic;

    public void publish(TrafficEvent event) {
        try {
            kafkaTemplate.send(topic, event.service(), mapper.writeValueAsString(event));
        } catch (Exception ex) {
            log.warn("Failed to publish traffic event: {}", ex.getMessage());
        }
    }
}
