package com.quantummesh.gateway.ratelimit;

import lombok.Getter;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Token bucket implementation backing the rate limiter.
 *
 * Thread-safe via CAS on a single long that packs (lastRefillNanos | tokens),
 * but here we keep it simple with synchronization since contention per-key is low.
 */
public class TokenBucket {

    @Getter
    private final long capacity;

    @Getter
    private final double refillTokensPerNano;

    private final AtomicLong tokensTimes1000 = new AtomicLong();
    private final AtomicLong lastRefillNanos = new AtomicLong();

    public TokenBucket(long capacity, long refillTokensPerSecond) {
        this.capacity = capacity;
        this.refillTokensPerNano = refillTokensPerSecond / 1_000_000_000.0;
        this.tokensTimes1000.set(capacity * 1000L);
        this.lastRefillNanos.set(System.nanoTime());
    }

    public synchronized boolean tryConsume(int permits) {
        refill();
        long needed = permits * 1000L;
        long current = tokensTimes1000.get();
        if (current >= needed) {
            tokensTimes1000.set(current - needed);
            return true;
        }
        return false;
    }

    public synchronized long availableTokens() {
        refill();
        return tokensTimes1000.get() / 1000L;
    }

    private void refill() {
        long now = System.nanoTime();
        long last = lastRefillNanos.get();
        long elapsed = now - last;
        if (elapsed <= 0) return;
        long add = (long) (elapsed * refillTokensPerNano * 1000L);
        if (add > 0) {
            long updated = Math.min(capacity * 1000L, tokensTimes1000.get() + add);
            tokensTimes1000.set(updated);
            lastRefillNanos.set(now);
        }
    }
}
