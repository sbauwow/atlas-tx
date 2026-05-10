export type QueryParam = string | string[] | undefined;

export function getFirstQueryParam(value: QueryParam): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseEnumQueryParam<T extends string>(
  value: QueryParam,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = getFirstQueryParam(value);
  if (!raw) return fallback;
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function resolveAllowedQueryParam(
  value: QueryParam,
  allowed: Iterable<string>,
  normalize: (value: string) => string = (entry) => entry,
): string | undefined {
  const raw = getFirstQueryParam(value);
  if (!raw) return undefined;

  const normalized = normalize(raw);
  for (const candidate of allowed) {
    if (candidate === normalized) return candidate;
  }
  return undefined;
}

export function clampQueryText(value: QueryParam, max = 200): string {
  return (getFirstQueryParam(value) ?? "").trim().slice(0, max);
}

export function parsePositiveIntQueryParam(
  value: QueryParam,
  defaultValue: number,
  opts?: { min?: number; max?: number },
): number {
  const min = opts?.min ?? 1;
  const max = opts?.max ?? Number.MAX_SAFE_INTEGER;
  const parsed = Number.parseInt(getFirstQueryParam(value) ?? "", 10);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(max, Math.max(min, parsed));
}
