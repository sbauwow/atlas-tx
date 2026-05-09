import { createElement } from "react";
import type { ReactNode } from "react";

export type FooterMeta = {
  sourceLabel?: string;
  freshnessLabel?: string;
  caveat?: string;
  footer?: ReactNode;
};

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
  }).format(value);
}

export function formatSignedNumber(value: number, digits = 1) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(Math.abs(value))}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getNumericExtent(values: number[], fallback: [number, number] = [0, 100]): [number, number] {
  if (!values.length) return fallback;

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    const padding = min === 0 ? 1 : Math.abs(min) * 0.1;
    min -= padding;
    max += padding;
  }

  return [min, max];
}

export function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function renderFooterMeta({ sourceLabel, freshnessLabel, caveat, footer }: FooterMeta) {
  if (!sourceLabel && !freshnessLabel && !caveat && !footer) return null;

  return createElement(
    "div",
    { className: "mt-4 border-t border-white/10 pt-3 text-xs text-slate-400" },
    createElement(
      "div",
      { className: "flex flex-wrap gap-2" },
      sourceLabel
        ? createElement(
            "span",
            { className: "rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1" },
            `Source: ${sourceLabel}`,
          )
        : null,
      freshnessLabel
        ? createElement(
            "span",
            { className: "rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-100" },
            `Freshness: ${freshnessLabel}`,
          )
        : null,
    ),
    caveat ? createElement("p", { className: "mt-2 text-[11px] leading-5 text-slate-500" }, caveat) : null,
    footer ? createElement("div", { className: "mt-2" }, footer) : null,
  );
}
