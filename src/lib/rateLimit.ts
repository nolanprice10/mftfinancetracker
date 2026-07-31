type BucketEntry = {
  timestamps: number[];
};

export interface InMemoryRateLimiter {
  /**
   * Returns true when action is allowed, false when rate-limited.
   */
  tryConsume: (key: string, now?: number) => boolean;
  /**
   * Returns milliseconds until next action is allowed for the key.
   */
  getRetryAfterMs: (key: string, now?: number) => number;
  /**
   * Clears all stored counters.
   */
  reset: () => void;
}

/**
 * Lightweight sliding-window rate limiter for client-side actions.
 */
export function createInMemoryRateLimiter(maxEvents: number, windowMs: number): InMemoryRateLimiter {
  const buckets = new Map<string, BucketEntry>();

  const prune = (key: string, now: number) => {
    const entry = buckets.get(key);
    if (!entry) {
      return [] as number[];
    }

    entry.timestamps = entry.timestamps.filter((timestamp) => now - timestamp < windowMs);
    if (entry.timestamps.length === 0) {
      buckets.delete(key);
      return [] as number[];
    }

    return entry.timestamps;
  };

  return {
    tryConsume: (key: string, now = Date.now()) => {
      const active = prune(key, now);
      if (active.length >= maxEvents) {
        return false;
      }

      const entry = buckets.get(key) ?? { timestamps: [] };
      entry.timestamps.push(now);
      buckets.set(key, entry);
      return true;
    },
    getRetryAfterMs: (key: string, now = Date.now()) => {
      const active = prune(key, now);
      if (active.length < maxEvents) {
        return 0;
      }

      const oldestTimestamp = active[0];
      const retryAfter = windowMs - (now - oldestTimestamp);
      return Math.max(0, retryAfter);
    },
    reset: () => {
      buckets.clear();
    },
  };
}
