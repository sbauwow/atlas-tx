import type { ReactNode } from "react";

import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

export default function GlossaryTooltip({
  term,
  expand = false,
  className,
}: {
  term: GlossaryKey;
  expand?: boolean;
  className?: string;
}) {
  const entry = GLOSSARY[term];
  const tooltip = `${entry.long}`;
  const classes = [
    "underline decoration-dotted underline-offset-4 decoration-cyan-400/70 cursor-help",
    className,
  ].filter(Boolean).join(" ");

  if (expand) {
    return (
      <span>
        {entry.long} (
        <abbr title={tooltip} aria-label={`${entry.long} (${entry.short})`} className={classes}>
          {entry.short}
        </abbr>
        )
      </span>
    );
  }

  return (
    <abbr title={tooltip} aria-label={`${entry.long} (${entry.short})`} className={classes}>
      {entry.short}
    </abbr>
  );
}

export function GlossaryInlineList({
  label,
  terms,
}: {
  label: ReactNode;
  terms: GlossaryKey[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2.5">
        {terms.map((term) => (
          <span key={term} className="rounded-full border border-white/10 px-3 py-1">
            <GlossaryTooltip term={term} expand />
          </span>
        ))}
      </div>
    </div>
  );
}
