type CacheEntry<TValue> = {
  value?: TValue;
  expiresAt?: number;
  cachedAt?: number;
  ttlMs?: number;
  pending?: Promise<TValue>;
};

export type WaterCacheFreshness = {
  cached: boolean;
  cachedAt: string | null;
  expiresAt: string | null;
  ttlMs: number | null;
};

export type WaterDataCache = {
  getOrLoad<TValue>(key: string, ttlMs: number, loader: () => Promise<TValue>): Promise<TValue>;
  getFreshness(key: string): WaterCacheFreshness;
  clear(key?: string): void;
};

export function createWaterDataCache(): WaterDataCache {
  const entries = new Map<string, CacheEntry<unknown>>();

  return {
    async getOrLoad<TValue>(key: string, ttlMs: number, loader: () => Promise<TValue>): Promise<TValue> {
      const now = Date.now();
      const existing = entries.get(key) as CacheEntry<TValue> | undefined;
      if (existing?.value !== undefined && typeof existing.expiresAt === "number" && existing.expiresAt > now) {
        return existing.value;
      }
      if (existing?.pending) {
        return existing.pending;
      }

      const pending = loader()
        .then((value) => {
          const cachedAt = Date.now();
          entries.set(key, { value, cachedAt, expiresAt: cachedAt + ttlMs, ttlMs });
          return value;
        })
        .catch((error) => {
          entries.delete(key);
          throw error;
        });

      entries.set(key, { ...existing, pending });
      return pending;
    },

    getFreshness(key: string): WaterCacheFreshness {
      const existing = entries.get(key);
      if (!existing || existing.value === undefined || existing.cachedAt === undefined || existing.expiresAt === undefined) {
        return {
          cached: false,
          cachedAt: null,
          expiresAt: null,
          ttlMs: null,
        };
      }
      return {
        cached: true,
        cachedAt: new Date(existing.cachedAt).toISOString(),
        expiresAt: new Date(existing.expiresAt).toISOString(),
        ttlMs: existing.ttlMs ?? null,
      };
    },

    clear(key?: string) {
      if (key) {
        entries.delete(key);
        return;
      }
      entries.clear();
    },
  };
}

const globalWaterDataCache = createWaterDataCache();

export function getGlobalWaterDataCache(): WaterDataCache {
  return globalWaterDataCache;
}
