type CacheEntry = {
  value: unknown;
  expiresAt: number;
  touchedAt: number;
};

const MAX_ENTRIES = 160;
const cache = new Map<string, CacheEntry>();

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";

  const obj = value as Record<string, unknown>;
  return (
    "{" +
    Object.keys(obj)
      .sort()
      .map((key) => JSON.stringify(key) + ":" + stable(obj[key]))
      .join(",") +
    "}"
  );
}

export async function aiCacheKey(scope: string, payload: unknown) {
  const bytes = new TextEncoder().encode(stable(payload));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return scope + ":" + hash.slice(0, 32);
}

function prune(now: number) {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }

  if (cache.size <= MAX_ENTRIES) return;

  const oldest = [...cache.entries()].sort(
    (a, b) => a[1].touchedAt - b[1].touchedAt,
  );
  for (const [key] of oldest.slice(0, cache.size - MAX_ENTRIES)) {
    cache.delete(key);
  }
}

export async function withAiCache<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>,
  shouldCache: (value: T) => boolean = () => true,
): Promise<{ value: T; cacheHit: boolean }> {
  const now = Date.now();
  prune(now);

  const current = cache.get(key);
  if (current && current.expiresAt > now) {
    current.touchedAt = now;
    return { value: current.value as T, cacheHit: true };
  }

  const value = await producer();
  if (ttlMs > 0 && shouldCache(value)) {
    cache.set(key, {
      value,
      expiresAt: now + ttlMs,
      touchedAt: now,
    });
  }

  return { value, cacheHit: false };
}

export function __clearAiCacheForTests() {
  cache.clear();
}
