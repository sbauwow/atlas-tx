import Link from "next/link";
import { MetricTrendChart, type MetricTrendPoint } from "@/app/components/charts/metric-trend-chart";
import { getDefaultCountyWaterSourceProfileService } from "@/lib/water/source-provenance";

export const dynamic = "force-dynamic";

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  if (!year || !m) return month;
  const date = new Date(`${year}-${m}-01T00:00:00.000Z`);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function buildTrendPoints(
  timeline: Array<{ month: string; alertCount: number; sewerOverflowCount: number; permitCount: number; communitySampleCount: number }>,
  pick: (row: { month: string; alertCount: number; sewerOverflowCount: number; permitCount: number; communitySampleCount: number }) => number,
): MetricTrendPoint[] {
  return timeline.map((row) => ({ label: formatMonth(row.month), value: pick(row), annotation: row.month }));
}

function sumTimeline(timeline: Array<{ month: string; alertCount: number; sewerOverflowCount: number; permitCount: number; communitySampleCount: number }>) {
  return timeline.reduce(
    (acc, row) => ({
      alerts: acc.alerts + row.alertCount,
      overflows: acc.overflows + row.sewerOverflowCount,
      permits: acc.permits + row.permitCount,
      samples: acc.samples + row.communitySampleCount,
    }),
    { alerts: 0, overflows: 0, permits: 0, samples: 0 },
  );
}

type TimelineRow = {
  month: string;
  alertCount: number;
  sewerOverflowCount: number;
  permitCount: number;
  communitySampleCount: number;
};

type TimelineAnomaly = {
  openSignal: number;
  coverageRatio: number;
  anomalyScore: number;
  severity: "low" | "moderate" | "high";
  label: string;
};

function computeTimelineAnomaly(row: TimelineRow): TimelineAnomaly {
  const openSignal = row.alertCount + row.sewerOverflowCount + row.permitCount;
  const coverageRatio = openSignal > 0 ? row.communitySampleCount / openSignal : 0;
  const normalizedPressure = Math.min(openSignal / 12, 1);
  const normalizedCoverageGap = Math.max(0, 1 - Math.min(coverageRatio, 1));
  const anomalyScore = Math.round((normalizedPressure * 0.65 + normalizedCoverageGap * 0.35) * 100);

  if (anomalyScore >= 70) {
    return { openSignal, coverageRatio, anomalyScore, severity: "high", label: "High mismatch pressure" };
  }

  if (anomalyScore >= 40) {
    return { openSignal, coverageRatio, anomalyScore, severity: "moderate", label: "Moderate mismatch pressure" };
  }

  return { openSignal, coverageRatio, anomalyScore, severity: "low", label: "Low mismatch pressure" };
}

function anomalyRowClass(severity: TimelineAnomaly["severity"]): string {
  if (severity === "high") return "bg-rose-500/10";
  if (severity === "moderate") return "bg-amber-500/10";
  return "bg-emerald-500/10";
}

function anomalyBadgeClass(severity: TimelineAnomaly["severity"]): string {
  if (severity === "high") return "text-rose-300 border-rose-300/30 bg-rose-500/15";
  if (severity === "moderate") return "text-amber-200 border-amber-200/30 bg-amber-500/15";
  return "text-emerald-200 border-emerald-200/30 bg-emerald-500/15";
}

export default async function WaterSourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getDefaultCountyWaterSourceProfileService().getCountyProfile(slug);
  const totals = sumTimeline(profile.timeline);
  const openSignalTotal = totals.alerts + totals.overflows + totals.permits;
  const sampleCoverage = openSignalTotal > 0 ? ((totals.samples / openSignalTotal) * 100).toFixed(1) : "0.0";

  const sourceMix = {
    districts: profile.sourceDescriptors.filter((source) => source.sourceType === "district").length,
    utilities: profile.sourceDescriptors.filter((source) => source.sourceType === "utility").length,
    permittees: profile.sourceDescriptors.filter((source) => source.sourceType === "permittee").length,
  };

  const anomalousMonths = profile.timeline
    .map((row) => ({ row, anomaly: computeTimelineAnomaly(row) }))
    .filter(({ anomaly }) => anomaly.openSignal > 0)
    .sort((a, b) => b.anomaly.anomalyScore - a.anomaly.anomalyScore)
    .slice(0, 3);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/water" className="rounded-full border border-white/15 px-3 py-1.5 text-slate-200 hover:bg-white/5">
            Back to water map
          </Link>
          <Link href={`/api/water/sources/${profile.county.slug}`} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-200">
            Source profile API
          </Link>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-white">{profile.county.name} water source analysis</h1>
        <p className="max-w-3xl text-slate-400">
          Provenance-first view of where county water service likely routes through, plus monthly pressure analysis across permits, overflows, weather alerts, and community strip observations.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:grid-cols-5">
        <Stat label="Water districts" value={profile.openDataSummary.activeWaterDistricts} />
        <Stat label="Water utilities" value={profile.openDataSummary.activeWaterUtilities} />
        <Stat label="Tracked permit sites" value={profile.openDataSummary.trackedPermitSites} />
        <Stat label="Open-signal events" value={openSignalTotal} />
        <Stat label="Sample coverage" value={`${sampleCoverage}%`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <MetricTrendChart
          title="Community sampling trend"
          subtitle="Monthly count of county-tagged community strip observations."
          eyebrow="Community signal"
          points={buildTrendPoints(profile.timeline, (row) => row.communitySampleCount)}
          valueLabel="samples / month"
          sourceLabel="WaterObservation (citizen)"
          freshnessLabel="On-demand"
          caveat="Community observations are non-regulatory context signals, not compliance determinations."
        />

        <MetricTrendChart
          title="Open-data pressure trend"
          subtitle="Combined monthly permit, overflow, and alert event volume."
          eyebrow="Public signal"
          points={buildTrendPoints(profile.timeline, (row) => row.alertCount + row.sewerOverflowCount + row.permitCount)}
          valueLabel="events / month"
          sourceLabel="NWS + TCEQ"
          freshnessLabel="Mixed source cache windows"
          caveat="This is event volume, not severity-weighted risk scoring."
        />
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <h2 className="text-2xl font-semibold text-white">Top anomalous months</h2>
        <p className="mt-2 text-sm text-slate-400">Highest mismatch pressure months ranked by open-signal intensity vs community sample coverage.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {anomalousMonths.length ? (
            anomalousMonths.map(({ row, anomaly }) => (
              <article key={`anomaly-${row.month}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{formatMonth(row.month)}</div>
                <div className="mt-1 text-xl font-semibold text-white tabular-nums">{anomaly.anomalyScore}</div>
                <div className="mt-1 text-sm text-slate-300">{anomaly.label}</div>
                <div className="mt-2 text-xs text-slate-400">
                  Open signals: {anomaly.openSignal} · Coverage: {(anomaly.coverageRatio * 100).toFixed(1)}%
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <a
                    href={`#timeline-${row.month}`}
                    className="rounded-full border border-white/20 px-2 py-1 text-slate-200 hover:bg-white/5"
                  >
                    Jump to timeline
                  </a>
                  <Link
                    href={`/api/water/sources/${profile.county.slug}?month=${row.month}`}
                    className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-cyan-200"
                  >
                    Open evidence API
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="text-sm text-slate-500">No anomalous months yet. Evidence appears too sparse.</div>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <h2 className="text-2xl font-semibold text-white">Source-mix visualization</h2>
        <p className="mt-2 text-sm text-slate-400">Breakdown of inferred source-side entities tied to this county profile.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MixBar label="District entities" value={sourceMix.districts} color="bg-cyan-400" max={Math.max(sourceMix.districts, sourceMix.utilities, sourceMix.permittees, 1)} />
          <MixBar label="Utility entities" value={sourceMix.utilities} color="bg-emerald-400" max={Math.max(sourceMix.districts, sourceMix.utilities, sourceMix.permittees, 1)} />
          <MixBar label="Permit-linked entities" value={sourceMix.permittees} color="bg-violet-400" max={Math.max(sourceMix.districts, sourceMix.utilities, sourceMix.permittees, 1)} />
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <h2 className="text-2xl font-semibold text-white">Likely source entities</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {profile.sourceDescriptors.length ? (
            profile.sourceDescriptors.map((source, index) => (
              <article key={`${source.sourceType}-${source.name}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{source.sourceType}</div>
                <div className="mt-1 text-base font-semibold text-white">{source.name}</div>
                <div className="mt-1 text-sm text-slate-400">{source.countyName}</div>
                {source.metadata ? (
                  <div className="mt-2 text-xs text-slate-500">{Object.entries(source.metadata).filter(([, v]) => v !== null).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}</div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="text-sm text-slate-500">No county-matched source entities yet.</div>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <h2 className="text-2xl font-semibold text-white">Timeline matrix</h2>
        <p className="mt-2 text-sm text-slate-400">
          Rows are severity-coded by anomaly score (high open-data pressure with low community sample coverage = higher mismatch pressure).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4 text-right">Alerts</th>
                <th className="py-2 pr-4 text-right">Sewer overflows</th>
                <th className="py-2 pr-4 text-right">Permits</th>
                <th className="py-2 pr-4 text-right">Community samples</th>
                <th className="py-2 pr-4 text-right">Coverage ratio</th>
                <th className="py-2 text-right">Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {profile.timeline.length ? (
                profile.timeline.map((point) => {
                  const anomaly = computeTimelineAnomaly(point);
                  return (
                    <tr id={`timeline-${point.month}`} key={point.month} className={`border-t border-white/5 text-slate-300 ${anomalyRowClass(anomaly.severity)}`}>
                      <td className="py-2 pr-4">{formatMonth(point.month)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{point.alertCount}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{point.sewerOverflowCount}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{point.permitCount}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{point.communitySampleCount}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{(anomaly.coverageRatio * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right tabular-nums">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${anomalyBadgeClass(anomaly.severity)}`}>
                          {anomaly.anomalyScore} · {anomaly.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-3 text-sm text-slate-500">No timeline points yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900/40 p-6 ring-1 ring-white/5">
        <h2 className="text-2xl font-semibold text-white">Community-curated samples</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {profile.communitySamples.length ? (
            profile.communitySamples.map((sample) => (
              <article key={sample.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                <div className="font-mono text-xs text-slate-500">{sample.id}</div>
                <div className="mt-1 text-slate-200">{new Date(sample.createdAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</div>
                <div className="mt-1 text-slate-400">Status: {sample.status}</div>
                <div className="mt-1 text-slate-400">Strip: {sample.stripBrand ?? "Unknown"}</div>
              </article>
            ))
          ) : (
            <div className="text-sm text-slate-500">No community samples recorded for this county.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-slate-950/40 p-5">
      <div className="text-3xl font-semibold text-white tabular-nums">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function MixBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = Math.max(6, Math.round((value / max) * 100));
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span className="tabular-nums text-white">{value}</span>
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-slate-800">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
