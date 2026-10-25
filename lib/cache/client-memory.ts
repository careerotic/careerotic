"use client";

type CacheEntry = {
  value: unknown;
  updatedAt: number;
};

export type ClientCacheResult<T> = {
  data: T;
  isFresh: boolean;
};

const cache = new Map<string, CacheEntry>();
const MAX_ENTRIES = 100;
const DEFAULT_RETAIN_MS = 10 * 60 * 1000;

export function readClientCache<T>(
  key: string,
  freshForMs: number,
  retainForMs = DEFAULT_RETAIN_MS,
): ClientCacheResult<T> | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.updatedAt;
  if (age > retainForMs) {
    cache.delete(key);
    return null;
  }

  // Refresh the insertion order so frequently used entries survive the size cap.
  cache.delete(key);
  cache.set(key, entry);
  return { data: entry.value as T, isFresh: age <= freshForMs };
}

export function writeClientCache<T>(key: string, value: T): void {
  cache.delete(key);
  cache.set(key, { value, updatedAt: Date.now() });

  while (cache.size > MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
}

export function clearClientCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function clearPrivateClientCache(): void {
  clearClientCache("private:");
}
