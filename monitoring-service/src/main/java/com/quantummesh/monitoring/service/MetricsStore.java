package com.quantummesh.monitoring.service;

import com.quantummesh.monitoring.model.MetricSample;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.ConcurrentMap;

/**
 * Per-service ring buffer of recent metric samples.
 *
 * Backed by a bounded ConcurrentLinkedDeque keyed by serviceId, capped at
 * MAX_SAMPLES per service. Older samples are evicted FIFO.
 */
@Service
public class MetricsStore {

    private static final int MAX_SAMPLES = 500;

    private final ConcurrentMap<String, ConcurrentLinkedDeque<MetricSample>> samples = new ConcurrentHashMap<>();

    public void record(MetricSample sample) {
        ConcurrentLinkedDeque<MetricSample> deque = samples.computeIfAbsent(
                sample.service(), k -> new ConcurrentLinkedDeque<>());
        deque.add(sample);
        while (deque.size() > MAX_SAMPLES) {
            deque.pollFirst();
        }
    }

    public List<MetricSample> recent(String service, int limit) {
        ConcurrentLinkedDeque<MetricSample> deque = samples.get(service);
        if (deque == null) return List.of();
        List<MetricSample> all = new ArrayList<>(deque);
        int from = Math.max(0, all.size() - limit);
        return all.subList(from, all.size());
    }

    public Map<String, MetricSample> latestPerService() {
        Map<String, MetricSample> result = new HashMap<>();
        samples.forEach((svc, deque) -> {
            MetricSample last = deque.peekLast();
            if (last != null) result.put(svc, last);
        });
        return result;
    }

    public Set<String> services() {
        return samples.keySet();
    }

    public Map<String, Object> healthSnapshot() {
        Map<String, Object> snap = new LinkedHashMap<>();
        Map<String, MetricSample> latest = latestPerService();
        snap.put("timestamp", Instant.now().toString());
        snap.put("services", latest.size());
        snap.put("latest", latest);
        return snap;
    }
}
