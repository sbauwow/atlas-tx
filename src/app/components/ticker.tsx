"use client";

import { useEffect, useRef, useState } from "react";

export type TickerProps = {
  value: number;
  /** Total animation duration in ms. */
  durationMs?: number;
  /** Locale for Intl.NumberFormat. */
  locale?: string;
  /** Optional formatting overrides. */
  format?: Intl.NumberFormatOptions;
  /** Suffix appended after the number, e.g. "%". */
  suffix?: string;
  className?: string;
};

/**
 * Counts up to `value` once on mount (and again whenever the visible target
 * changes). Uses requestAnimationFrame with an ease-out cubic curve.
 *
 * Honors prefers-reduced-motion: snaps to the final value immediately.
 */
export default function Ticker({
  value,
  durationMs = 1100,
  locale = "en-US",
  format,
  suffix,
  className,
}: TickerProps) {
  const [display, setDisplay] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const raf = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(raf);
    }
    fromRef.current = display;
    startedAtRef.current = null;
    let raf = 0;
    const step = (now: number) => {
      if (startedAtRef.current === null) startedAtRef.current = now;
      const elapsed = now - startedAtRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  const formatted = new Intl.NumberFormat(locale, format ?? { maximumFractionDigits: 0 }).format(
    Math.round(display * 100) / 100,
  );
  return (
    <span className={className}>
      {formatted}
      {suffix ? <span className="ml-0.5 text-[0.7em] text-slate-400">{suffix}</span> : null}
    </span>
  );
}
