"use client";

import { useMemo, useState, type ReactNode } from "react";

export type ChoroplethTooltipRow = {
  label?: string;
  value: string;
  tone?: "default" | "warn" | "muted" | "accent";
};

export type ChoroplethTooltipContent = {
  title: string;
  subtitle?: string;
  rows?: ChoroplethTooltipRow[];
  footer?: string;
};

export type ChoroplethTooltipLayerProps = {
  tooltips: Array<[string, ChoroplethTooltipContent]> | Record<string, ChoroplethTooltipContent>;
  /** DOM attribute names to inspect for a county slug, in priority order. */
  slugAttributes?: string[];
  className?: string;
  children: ReactNode;
};

const DEFAULT_SLUG_ATTRS = ["data-county-map-path", "data-county-slug"];
const TOOLTIP_OFFSET = 16;
const TOOLTIP_WIDTH = 280;

const TONE_CLASS: Record<NonNullable<ChoroplethTooltipRow["tone"]>, string> = {
  default: "text-slate-200",
  warn: "text-amber-200",
  muted: "text-slate-400",
  accent: "text-cyan-200",
};

function findSlug(element: Element | null, attrs: string[]): string | null {
  let node: Element | null = element;
  while (node) {
    for (const attr of attrs) {
      const value = node.getAttribute(attr);
      if (value) return value;
    }
    node = node.parentElement;
  }
  return null;
}

export function ChoroplethTooltipLayer({
  tooltips,
  slugAttributes = DEFAULT_SLUG_ATTRS,
  className,
  children,
}: ChoroplethTooltipLayerProps) {
  const [hover, setHover] = useState<{ slug: string; x: number; y: number; width: number } | null>(null);

  const tooltipMap = useMemo(() => {
    if (Array.isArray(tooltips)) return new Map(tooltips);
    return new Map(Object.entries(tooltips));
  }, [tooltips]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const slug = findSlug(event.target as Element | null, slugAttributes);
    if (!slug || !tooltipMap.has(slug)) {
      if (hover) setHover(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setHover({
      slug,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: rect.width,
    });
  }

  const content = hover ? tooltipMap.get(hover.slug) ?? null : null;
  const tooltipLeft = hover
    ? Math.max(8, Math.min(hover.x + TOOLTIP_OFFSET, hover.width - TOOLTIP_WIDTH - 8))
    : 0;
  const tooltipTop = hover ? Math.max(8, hover.y - TOOLTIP_OFFSET) : 0;

  return (
    <div
      className={["relative", className].filter(Boolean).join(" ")}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHover(null)}
    >
      {children}
      {content && hover ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 rounded-lg border border-white/10 bg-slate-950/95 px-3 py-2 text-xs leading-5 text-slate-200 shadow-[0_12px_30px_rgba(2,6,23,0.55)] backdrop-blur"
          style={{
            left: tooltipLeft,
            top: tooltipTop,
            width: TOOLTIP_WIDTH,
          }}
        >
          <div className="text-sm font-semibold text-white">{content.title}</div>
          {content.subtitle ? (
            <div className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
              {content.subtitle}
            </div>
          ) : null}
          {content.rows && content.rows.length > 0 ? (
            <ul className="mt-2 space-y-0.5">
              {content.rows.map((row, index) => (
                <li key={index} className={TONE_CLASS[row.tone ?? "default"]}>
                  {row.label ? (
                    <span className="text-slate-400">{row.label}: </span>
                  ) : null}
                  <span>{row.value}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {content.footer ? (
            <div className="mt-2 border-t border-white/10 pt-1.5 text-[11px] text-slate-500">
              {content.footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
