package com.quantummesh.analytics.controller;

import com.quantummesh.analytics.kafka.TrafficEventProducer;
import com.quantummesh.analytics.model.TrafficEvent;
import com.quantummesh.analytics.service.AnalyticsStore;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsStore store;
    private final TrafficEventProducer producer;

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return store.summary();
    }

    @PostMapping("/events")
    public Map<String, String> ingest(@RequestBody TrafficEvent event) {
        producer.publish(event);
        store.record(event);
        return Map.of("status", "accepted");
    }
}
