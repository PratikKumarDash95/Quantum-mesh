package com.quantummesh.gateway.ratelimit;

/**
 * Per-client subscription tier. Drives bucket capacity, refill rate, and the
 * sliding-window ceiling. Resolved from the JWT roles claim at the gateway —
 * unauthenticated traffic gets {@link #FREE}.
 */
public enum Tier {
    FREE(30, 10, 600, 60_000),
    PREMIUM(200, 100, 6_000, 60_000),
    ADMIN(1_000, 500, 30_000, 60_000);

    private final int bucketCapacity;
    private final int refillPerSecond;
    private final int windowMax;
    private final long windowMillis;

    Tier(int bucketCapacity, int refillPerSecond, int windowMax, long windowMillis) {
        this.bucketCapacity = bucketCapacity;
        this.refillPerSecond = refillPerSecond;
        this.windowMax = windowMax;
        this.windowMillis = windowMillis;
    }

    public int bucketCapacity() {
        return bucketCapacity;
    }

    public int refillPerSecond() {
        return refillPerSecond;
    }

    public int windowMax() {
        return windowMax;
    }

    public long windowMillis() {
        return windowMillis;
    }

    public static Tier fromRolesHeader(String roles) {
        if (roles == null || roles.isBlank()) return FREE;
        String upper = roles.toUpperCase();
        if (upper.contains("ROLE_ADMIN")) return ADMIN;
        if (upper.contains("ROLE_PREMIUM")) return PREMIUM;
        return FREE;
    }
}
