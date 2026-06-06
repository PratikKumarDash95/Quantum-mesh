package com.quantummesh.gateway.ratelimit;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Two-stage tiered rate limiter: a per-key token bucket caps short-term burst
 * at the tier's refill rate, and a per-key sliding-window log enforces the
 * longer-term ceiling (e.g. requests per minute). A request must pass both
 * stages to be allowed.
 */
public class RateLimiterRegistry {

    private final ConcurrentMap<String, TokenBucket> buckets = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, SlidingWindowLog> windows = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Tier> assignedTier = new ConcurrentHashMap<>();

    public Decision tryConsume(String key, Tier tier) {
        Tier previous = assignedTier.put(key, tier);
        if (previous != null && previous != tier) {
            buckets.remove(key);
            windows.remove(key);
        }

        TokenBucket bucket = buckets.computeIfAbsent(key,
                k -> new TokenBucket(tier.bucketCapacity(), tier.refillPerSecond()));
        SlidingWindowLog window = windows.computeIfAbsent(key,
                k -> new SlidingWindowLog(tier.windowMax(), tier.windowMillis()));

        if (!bucket.tryConsume(1)) {
            return new Decision(false, "burst", bucket.availableTokens(), window.currentCount(), tier);
        }
        if (!window.tryAcquire()) {
            return new Decision(false, "window", bucket.availableTokens(), window.currentCount(), tier);
        }
        return new Decision(true, null, bucket.availableTokens(), window.currentCount(), tier);
    }

    public record Decision(
            boolean allowed,
            String rejectReason,
            long burstRemaining,
            int windowUsed,
            Tier tier
    ) {}
}
