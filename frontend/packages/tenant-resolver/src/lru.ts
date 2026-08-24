/**
 * Minimal edge-safe LRU cache with TTL.
 *
 * Used by the tenant resolver (performance contract: resolution < 5ms,
 * cacheable). Map insertion order provides LRU semantics: every hit
 * re-inserts the key, eviction drops the oldest entry.
 *
 * No Node.js APIs — safe for Next.js middleware (edge runtime).
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LruCache<T> {
  private readonly map = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly maxSize = 512,
    private readonly ttlMs = 5 * 60 * 1000,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (this.now() >= entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh recency: re-insert so this key becomes the newest.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict least-recently-used (first inserted).
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }

  /** Test/ops introspection. */
  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}
