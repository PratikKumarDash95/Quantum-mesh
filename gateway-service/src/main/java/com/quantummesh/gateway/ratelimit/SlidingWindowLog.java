package com.quantummesh.gateway.ratelimit;

import java.util.ArrayDeque;
import java.util.Deque;

/**
 * Sliding-window-log limiter. Stores timestamps of recent allowed requests and
 * enforces a hard ceiling of {@code maxRequests} within the rolling window of
 * {@code windowMillis}. Used in tandem with {@link TokenBucket}: the bucket
 * smooths bursts at a per-second rate; the sliding log enforces a longer-term
 * ceiling that the bucket alone cannot express precisely.
 */
public class SlidingWindowLog {

    private final int maxRequests;
    private final long windowMillis;
    private final Deque<Long> timestamps = new ArrayDeque<>();

    public SlidingWindowLog(int maxRequests, long windowMillis) {
        this.maxRequests = maxRequests;
        this.windowMillis = windowMillis;
    }

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        long cutoff = now - windowMillis;
        while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
            timestamps.pollFirst();
        }
        if (timestamps.size() >= maxRequests) {
            return false;
        }
        timestamps.addLast(now);
        return true;
    }

    public synchronized int currentCount() {
        long cutoff = System.currentTimeMillis() - windowMillis;
        while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
            timestamps.pollFirst();
        }
        return timestamps.size();
    }

    public int getMaxRequests() {
        return maxRequests;
    }

    public long getWindowMillis() {
        return windowMillis;
    }
}
