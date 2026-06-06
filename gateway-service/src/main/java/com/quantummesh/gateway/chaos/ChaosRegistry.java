package com.quantummesh.gateway.chaos;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class ChaosRegistry {

    private final CopyOnWriteArrayList<ChaosRule> rules = new CopyOnWriteArrayList<>();

    public List<ChaosRule> snapshot() {
        return List.copyOf(rules);
    }

    public ChaosRule add(ChaosRule rule) {
        rules.removeIf(r -> r.getId().equals(rule.getId()));
        rules.add(rule);
        return rule;
    }

    public boolean remove(String id) {
        return rules.removeIf(r -> r.getId().equals(id));
    }

    public void clear() {
        rules.clear();
    }

    /** Returns the rule (and a freshly rolled trigger decision) that matches the given path, if any. */
    public Optional<ChaosRule> matchFor(String path) {
        for (ChaosRule rule : rules) {
            if (path.startsWith(rule.getPathPrefix())
                    && ThreadLocalRandom.current().nextDouble() < rule.getProbability()) {
                return Optional.of(rule);
            }
        }
        return Optional.empty();
    }
}
