import type { ReactNode } from "react";

import { joinClassNames, renderFooterMeta, type FooterMeta } from "./chart-helpers";

export type ChartShellProps = FooterMeta & {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ChartShell({
  title,
  subtitle,
  eyebrow,
  aside,
  children,
  className,
  sourceLabel,
  freshnessLabel,
  caveat,
  footer,
}: ChartShellProps) {
  return (
    <section className={joinClassNames("rounded-3xl border border-white/10 bg-slate-950/95 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          {eyebrow ? <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300/80">{eyebrow}</div> : null}
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{subtitle}</p> : null}
          </div>
        </div>
        {aside ? <div className="min-w-fit">{aside}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
      {renderFooterMeta({ sourceLabel, freshnessLabel, caveat, footer })}
    </section>
  );
}

export function ChartEmptyState({ title, message }: { title?: string; message: string }) {
  return (
    <div className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <div className="max-w-sm space-y-2">
        {title ? <div className="text-sm font-medium text-slate-200">{title}</div> : null}
        <p className="text-sm leading-6 text-slate-500">{message}</p>
      </div>
    </div>
  );
}
