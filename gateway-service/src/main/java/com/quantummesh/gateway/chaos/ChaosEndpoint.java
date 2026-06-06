package com.quantummesh.gateway.chaos;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.endpoint.annotation.DeleteOperation;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.boot.actuate.endpoint.annotation.Selector;
import org.springframework.boot.actuate.endpoint.annotation.WriteOperation;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Actuator endpoint backing chaos engineering. Bound to {@code /actuator/chaos}.
 *
 *   GET    /actuator/chaos          → list active rules
 *   POST   /actuator/chaos          → upsert rule (id, pathPrefix, type, probability, delayMillis, errorStatus)
 *   DELETE /actuator/chaos/{id}     → remove rule
 *
 * Exposure is gated through the standard actuator security model: only expose
 * this endpoint on internal management ports in production.
 */
@Component
@Endpoint(id = "chaos")
@RequiredArgsConstructor
public class ChaosEndpoint {

    private final ChaosRegistry registry;

    @ReadOperation
    public Map<String, Object> list() {
        List<ChaosRule> snapshot = registry.snapshot();
        return Map.of("rules", snapshot, "active", snapshot.size());
    }

    @WriteOperation
    public Map<String, Object> upsert(
            String id,
            String pathPrefix,
            String type,
            Double probability,
            Long delayMillis,
            Integer errorStatus
    ) {
        if (id == null || pathPrefix == null || type == null) {
            return Map.of("status", "invalid", "error", "id, pathPrefix, type are required");
        }
        ChaosRule rule = new ChaosRule(
                id,
                pathPrefix,
                ChaosRule.Type.valueOf(type.toUpperCase()),
                probability == null ? 1.0 : probability,
                delayMillis == null ? 0L : delayMillis,
                errorStatus == null ? 500 : errorStatus
        );
        registry.add(rule);
        return Map.of("status", "upserted", "rule", rule);
    }

    @DeleteOperation
    public Map<String, Object> remove(@Selector String id) {
        boolean removed = registry.remove(id);
        return Map.of("status", removed ? "removed" : "missing", "id", id);
    }
}
