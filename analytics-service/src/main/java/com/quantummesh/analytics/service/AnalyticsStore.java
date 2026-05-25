package com.quantummesh.analytics.service;

import com.quantummesh.analytics.model.TrafficEvent;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.LongAdder;

@Service
public class AnalyticsStore {

    private final ConcurrentMap<String, LongAdder> requestCounts = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, LongAdder> errorCounts = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, LongAdder> latencySum = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, LongAdder> latencyCount = new ConcurrentHashMap<>();

    public void record(TrafficEvent event) {
        String key = event.service();
        requestCounts.computeIfAbsent(key, k -> new LongAdder()).increment();
        if (event.statusCode() >= 500) {
            errorCounts.computeIfAbsent(key, k -> new LongAdder()).increment();
        }
        latencySum.computeIfAbsent(key, k -> new LongAdder()).add(event.latencyMillis());
        latencyCount.computeIfAbsent(key, k -> new LongAdder()).increment();
    }

    public Map<String, Object> summary() {
        Map<String, Object> result = new LinkedHashMap<>();
        Set<String> services = new HashSet<>(requestCounts.keySet());
        for (String svc : services) {
            long requests = requestCounts.getOrDefault(svc, new LongAdder()).sum();
            long errors = errorCounts.getOrDefault(svc, new LongAdder()).sum();
            long latencyTotal = latencySum.getOrDefault(svc, new LongAdder()).sum();
            long latencyN = latencyCount.getOrDefault(svc, new LongAdder()).sum();
            double avgLatency = latencyN == 0 ? 0.0 : (double) latencyTotal / latencyN;
            double errorRate = requests == 0 ? 0.0 : (100.0 * errors / requests);
            result.put(svc, Map.of(
                    "requests", requests,
                    "errors", errors,
                    "errorRatePercent", round(errorRate),
                    "avgLatencyMillis", round(avgLatency)
            ));
        }
        return result;
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
