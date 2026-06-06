package com.quantummesh.gateway.chaos;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * One chaos rule. Matched by path-prefix. {@link #probability} is between 0.0
 * and 1.0; a request that matches both prefix and dice roll has the effect
 * applied.
 */
@Data
@AllArgsConstructor
public class ChaosRule {
    private String id;
    private String pathPrefix;
    private Type type;
    private double probability;
    private long delayMillis;
    private int errorStatus;

    public enum Type { DELAY, ERROR, ABORT }
}
