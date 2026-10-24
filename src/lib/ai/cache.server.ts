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

function fnv1a(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function aiCacheKey(scope: string, payload: unknown) {
  return scope + ":" + fnv1a(stable(payload));
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
