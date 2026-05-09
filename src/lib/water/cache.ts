type CacheEntry<TValue> = {
  value?: TValue;
  expiresAt?: number;
  pending?: Promise<TValue>;
};

export type WaterDataCache = {
  getOrLoad<TValue>(key: string, ttlMs: number, loader: () => Promise<TValue>): Promise<TValue>;
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
          entries.set(key, { value, expiresAt: Date.now() + ttlMs });
          return value;
        })
        .catch((error) => {
          entries.delete(key);
          throw error;
        });

      entries.set(key, { ...existing, pending });
      return pending;
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
