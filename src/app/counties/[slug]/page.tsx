import Link from "next/link";

import GlossaryTooltip, { GlossaryInlineList } from "@/app/components/glossary-tooltip";
import { CountyWorkspaceHeader } from "@/app/components/county-workspace-header";
import { buildCountyAnalyticsViewModel, type CountyAnalyticsViewModel } from "@/app/counties/county-analytics";
import { getOperatorIntelligencePageData } from "@/app/operators/operator-page-data";
import { AddToWatchlistControl } from "@/app/watchlists/watchlist-client";
import { getDefaultAtlasCountyExplorerService } from "@/lib/atlas-county-explorer";
import { getAdjacentCountyRefs } from "@/lib/water/county-lookup";

export default async function CountyIntelligencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getDefaultAtlasCountyExplorerService();
  const [breakdown, operatorDataset] = await Promise.all([service.getCountyBreakdown(slug), getOperatorIntelligencePageData()]);
  const county = breakdown.overview.county;
  const adjacent = getAdjacentCountyRefs(county.slug);
  const analytics = await buildCountyAnalyticsViewModel(breakdown);
  const countyOperators = getCountyOperatorRows(operatorDataset.detailRows, county.slug);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
      <CountyWorkspaceHeader
        countyName={county.name}
        countySlug={county.slug}
        permitsHref={`/permits?county=${county.slug}`}
        waterHref={`/water/counties/${county.slug}`}
        previousCounty={adjacent.previous ? { ...adjacent.previous, href: `/counties/${adjacent.previous.slug}` } : null}
        nextCounty={adjacent.next ? { ...adjacent.next, href: `/counties/${adjacent.next.slug}` } : null}
      />

      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/water" className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
            Back to water map
          </Link>
          <Link href={`/permits?county=${county.slug}`} className="rounded-full bg-white px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-slate-200">
            Open permit view
          </Link>
        </div>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">{county.name} county intelligence</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Cross-source county ranking context from the Atlas county explorer service, with committed Wave 1 analytics overlays to help answer what changed and why.
          </p>
          <AddToWatchlistControl
            className="mt-4"
            item={{
              id: `county:${county.slug}`,
              kind: "County",
              label: county.name,
              href: `/counties/${county.slug}`,
              summary: `${formatDecimal(breakdown.overview.compositeScore)} composite · ${analytics.riskRank ? `risk rank #${analytics.riskRank}` : "risk rank unavailable"}`,
              detail: `${String(breakdown.highlights.length)} highlight lanes and ${String(countyOperators.length)} visible operators on the current county intelligence page.`,
              surface: "analytics",
            }}
          />
        </div>
      </section>

      <GlossaryInlineList label="Common county terms" terms={["TWDB", "HUC", "PWS"]} />

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-4">
        <StatTile value={formatDecimal(breakdown.overview.compositeScore)} label="Composite score" />
        <StatTile value={String(breakdown.overview.ranks.composite ?? "-")} label="Composite rank" />
        <StatTile value={String(breakdown.highlights.length)} label="Highlight lanes" />
        <StatTile value={analytics.riskRank ? `#${analytics.riskRank}` : "–"} label="Wave 1 risk rank" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Analytics snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Risk trend from committed snapshots</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Uses the committed county-history artifact only. Atlas does not backfill imaginary periods; if a previous snapshot is missing, this panel says so.
              </p>
            </div>
            {analytics.generatedAt ? <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Updated {shortTimestamp(analytics.generatedAt)}</span> : null}
          </div>

          {analytics.available ? (
            <div className="mt-6 space-y-6">
              <TrendChart analytics={analytics} />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat label="Risk score" value={formatSignedDeltaMetric(analytics.currentRiskScore, analytics.riskDelta)} />
                <MiniStat label="Pressure score" value={formatSignedDeltaMetric(analytics.currentPressureScore, analytics.pressureDelta)} />
                <MiniStat label="Systems / violations" value={`${analytics.topSystems.length ? analytics.topSystems.length : "0"} flagged systems shown`} />
                <MiniStat label="Pressure quadrant" value={analytics.quadrantLabel ?? "Unavailable"} />
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
              <div className="font-medium text-white">Trend panel waiting on committed history</div>
              <p className="mt-2 text-slate-400">This county renders with current explorer context now, but the Wave 1 cache does not yet provide a prior county-history row for period-over-period interpretation.</p>
            </div>
          )}
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">Interpretation</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{analytics.callout.title}</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <p>{analytics.callout.body}</p>
            <p className="text-slate-400">{analytics.callout.detail}</p>
            {analytics.quadrantDescription ? (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-amber-50/90">
                <div className="font-medium text-white">{analytics.quadrantLabel}</div>
                <div className="mt-1 text-amber-50/80">{analytics.quadrantDescription}</div>
              </div>
            ) : null}
            <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-slate-400">
              <div className="font-medium text-white">Grounding and caveats</div>
              <p className="mt-2">{analytics.provenanceMethod ?? "Committed county analytics provenance is unavailable for this county."}</p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
                {analytics.provenanceNotes.slice(0, 2).map((note) => (
                  <li key={note}>• {note}</li>
                ))}
                {analytics.moverNotes.slice(0, 1).map((note) => (
                  <li key={note}>• {note}</li>
                ))}
                {analytics.scatterNotes.slice(0, 1).map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Driver decomposition</h2>
          <p className="mt-2 text-sm text-slate-400">
            Top explorer lanes ranked against the statewide county stack. Percentile and contribution values are derived from the reusable Wave 1 analytics spine.
          </p>
          <div className="mt-5 space-y-4">
            {analytics.topDrivers.length ? (
              analytics.topDrivers.map((driver) => <DriverRow key={driver.sourceId} driver={driver} />)
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                No ranked driver decomposition was available beyond the current highlight list.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Top systems behind the county signal</h2>
          <p className="mt-2 text-sm text-slate-400">
            When county-history carries system-level highlights, Atlas surfaces the systems contributing the most to the latest committed risk snapshot.
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            {analytics.topSystems.length ? (
              analytics.topSystems.map((system) => (
                <div key={system.pwsId} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{system.pwsName}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">PWS {system.pwsId}</div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <div>Risk contribution {formatDecimal(system.score)}</div>
                      <div>{system.violationCount} violations in the cached snapshot</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                No top-system highlights were available in the committed county-history record for this county.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Operator lane</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Operators visible in this county snapshot</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">
                Ranked only from the current permittee and CID applicant snapshot. Atlas links out where operator presence is visible; it does not invent a deeper hierarchy or historical market share.
              </p>
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{countyOperators.length} visible operators</div>
          </div>
          <div className="mt-5 space-y-3">
            {countyOperators.length ? (
              countyOperators.map((operator) => (
                <article key={operator.slug} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-medium text-white">{operator.operatorName}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {operator.countyPermitCount} permits · {operator.countyCaseCount} cases · {operator.countyProceduralPressureScore} procedural pressure in {county.name}
                      </div>
                    </div>
                    <div className="rounded-full bg-white/5 px-3 py-1 text-sm font-medium text-cyan-300">
                      Statewide footprint: {operator.countyCount} counties
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                    <Link href={`/operators/${operator.slug}`} className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-950 transition-colors hover:bg-slate-200">
                      Open operator detail
                    </Link>
                    <Link href={`/permits?county=${county.slug}`} className="rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/5">
                      County permits
                    </Link>
                  </div>
                  <AddToWatchlistControl
                    className="mt-4"
                    item={{
                      id: `operator:${operator.slug}`,
                      kind: "Operator",
                      label: operator.operatorName,
                      href: `/operators/${operator.slug}`,
                      summary: `${operator.countyPermitCount} county permits · ${operator.countyCaseCount} cases · ${operator.countyProceduralPressureScore} procedural pressure in ${county.name}`,
                      detail: `${operator.countyCount} counties statewide with ${operator.filingCounts.hearingRequests} hearing requests, ${operator.filingCounts.publicMeetingRequests} public meeting requests, and ${operator.filingCounts.comments} comments across visible cases.`,
                      surface: "operators",
                    }}
                  />
                  <div className="mt-4 text-xs text-slate-500">
                    Current record mix: {operator.filingCounts.hearingRequests} hearing requests · {operator.filingCounts.publicMeetingRequests} public meeting requests · {operator.filingCounts.comments} comments across visible cases.
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                No operator grouping is visible for this county in the current permit and CID snapshot.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">County ↔ operator navigation</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Move from county stress to named operators</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <p>
              County rankings show where signal concentrates. Operator pages show which named permittees and applicants are currently visible inside that signal.
            </p>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-slate-400">
              {countyOperators.length
                ? `The strongest visible crosslinks here come from ${countyOperators.slice(0, 2).map((operator) => operator.operatorName).join(" and ")}. Use those pages to inspect county concentration, case posture, and permit roster.`
                : "This county currently has no grounded operator crosslink from the permit/CID dataset, so Atlas keeps the page anchored in county and permit context only."}
            </div>
            <ul className="space-y-2 text-slate-400">
              <li>• County page: risk, hydrology, and statewide rank context.</li>
              <li>• Operator page: county footprint, open CID case posture, and pending permit roster.</li>
              <li>• Permit view: county-scoped transaction list for the current public snapshot.</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Highlights</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {breakdown.highlights.map((item) => (
              <div key={item.sourceId} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="font-medium text-white">{item.label}</div>
                <div className="mt-1 text-slate-400">Rank {item.rank} · Value {item.value}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
          <h2 className="text-2xl font-semibold text-white">Hydrology context</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p className="text-slate-400">Built from <GlossaryTooltip term="TWDB" expand /> hydrology layers and <GlossaryTooltip term="HUC" expand /> geography.</p>
            {breakdown.hydrologyContext.matches.map((item) => (
              <div key={`${item.layerId}-${item.primaryCode ?? item.name ?? "match"}`} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="font-medium text-white">{item.name ?? item.layerName}</div>
                <div className="mt-1 text-slate-400">{item.layerName}</div>
              </div>
            ))}
            <div className="text-slate-500">{breakdown.hydrologyContext.caveat}</div>
          </div>
        </article>
      </section>
    </main>
  );
}

function TrendChart({ analytics }: { analytics: CountyAnalyticsViewModel }) {
  const points = analytics.trendPoints;
  if (!points.length) {
    return null;
  }

  const width = 480;
  const height = 180;
  const pad = 24;
  const riskMax = Math.max(...points.map((point) => point.riskScore), 1);
  const pressureMax = Math.max(...points.map((point) => point.pressureScore), 1);
  const xStep = points.length === 1 ? 0 : (width - pad * 2) / (points.length - 1);

  const riskPath = points
    .map((point, index) => {
      const x = pad + xStep * index;
      const y = height - pad - (point.riskScore / riskMax) * (height - pad * 2);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const pressurePath = points
    .map((point, index) => {
      const x = pad + xStep * index;
      const y = height - pad - (point.pressureScore / pressureMax) * (height - pad * 2);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <LegendSwatch color="bg-cyan-400" label="Risk score" />
        <LegendSwatch color="bg-fuchsia-400" label="Pressure score" />
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full overflow-visible">
        <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
        <line x1={pad} x2={pad} y1={pad} y2={height - pad} stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
        <path d={riskPath} fill="none" stroke="rgb(34,211,238)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pressurePath} fill="none" stroke="rgb(232,121,249)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => {
          const x = pad + xStep * index;
          const riskY = height - pad - (point.riskScore / riskMax) * (height - pad * 2);
          const pressureY = height - pad - (point.pressureScore / pressureMax) * (height - pad * 2);

          return (
            <g key={point.timestamp}>
              <circle cx={x} cy={riskY} r="4" fill="rgb(34,211,238)" />
              <circle cx={x} cy={pressureY} r="4" fill="rgb(232,121,249)" />
              <text x={x} y={height - 6} fill="rgb(148,163,184)" fontSize="10" textAnchor="middle">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DriverRow({ driver }: { driver: CountyAnalyticsViewModel["topDrivers"][number] }) {
  const barWidth = Math.max(driver.shareOfComposite ?? 0, 6);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium text-white">{driver.label}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
            {driver.rank ? `Rank #${driver.rank}` : "Rank unavailable"}
            {driver.percentile !== null ? ` · ${formatDecimal(driver.percentile)} percentile` : ""}
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>{driver.rawValue !== null ? `Value ${formatDecimal(driver.rawValue)}` : "Value unavailable"}</div>
          <div>{driver.scoreContribution !== null ? `${formatDecimal(driver.scoreContribution)} pts into composite` : "Contribution unavailable"}</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-cyan-400/80" style={{ width: `${Math.min(barWidth, 100)}%` }} />
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {driver.shareOfComposite !== null ? `${formatDecimal(driver.shareOfComposite)}% of the current composite score from this lane.` : "Composite share unavailable."}
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-slate-950/40 p-6">
      <div className="text-4xl font-semibold tabular-nums tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-950/40 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, "");
}

function formatSignedDeltaMetric(current: number | null, delta: number | null) {
  if (current === null) {
    return "Unavailable";
  }

  if (delta === null) {
    return formatDecimal(current);
  }

  const direction = delta > 0 ? `↑ ${formatDecimal(delta)}` : delta < 0 ? `↓ ${formatDecimal(Math.abs(delta))}` : "No change";
  return `${formatDecimal(current)} · ${direction}`;
}

function shortTimestamp(timestamp: string) {
  return timestamp.replace("T", " ").replace(".000Z", "Z").replace(/\.\d{3}Z$/, "Z");
}

function getCountyOperatorRows(
  operators: Array<{
    slug: string;
    operatorName: string;
    countyCount: number;
    filingCounts: { comments: number; hearingRequests: number; publicMeetingRequests: number };
    counties: Array<{
      countySlug: string;
      permitCount: number;
      caseCount: number;
      proceduralPressureScore: number;
    }>;
  }>,
  countySlug: string,
) {
  type CountyOperatorRow = {
    slug: string;
    operatorName: string;
    countyCount: number;
    filingCounts: { comments: number; hearingRequests: number; publicMeetingRequests: number };
    countyPermitCount: number;
    countyCaseCount: number;
    countyProceduralPressureScore: number;
  };

  return operators
    .map((operator): CountyOperatorRow | null => {
      const countyRow = operator.counties.find((row) => row.countySlug === countySlug);
      if (!countyRow) {
        return null;
      }

      return {
        slug: operator.slug,
        operatorName: operator.operatorName,
        countyCount: operator.countyCount,
        filingCounts: operator.filingCounts,
        countyPermitCount: countyRow.permitCount,
        countyCaseCount: countyRow.caseCount,
        countyProceduralPressureScore: countyRow.proceduralPressureScore,
      };
    })
    .filter((operator): operator is CountyOperatorRow => operator !== null)
    .sort((left, right) => {
      return (
        right.countyPermitCount - left.countyPermitCount ||
        right.countyCaseCount - left.countyCaseCount ||
        right.countyProceduralPressureScore - left.countyProceduralPressureScore ||
        left.operatorName.localeCompare(right.operatorName)
      );
    })
    .slice(0, 5);
}
