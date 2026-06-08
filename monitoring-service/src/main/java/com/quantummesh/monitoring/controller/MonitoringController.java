package com.quantummesh.monitoring.controller;

import com.quantummesh.monitoring.model.MetricSample;
import com.quantummesh.monitoring.service.MetricsStore;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/monitoring")
@RequiredArgsConstructor
public class MonitoringController {

    private final MetricsStore store;

    @GetMapping("/services")
    public Set<String> services() {
        return store.services();
    }

    @GetMapping("/latest")
    public Map<String, MetricSample> latest() {
        return store.latestPerService();
    }

    @GetMapping("/metrics/{service}")
    public List<MetricSample> metrics(
            @PathVariable String service,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return store.recent(service, Math.min(limit, 500));
    }

    @GetMapping("/health-snapshot")
    public Map<String, Object> snapshot() {
        return store.healthSnapshot();
    }

    @PostMapping("/ingest")
    public MetricSample ingest(@RequestBody MetricSample sample) {
        store.record(sample);
        return sample;
    }
}
