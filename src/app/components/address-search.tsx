"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import type { AddressLookupEnvelope } from "@/lib/address-lookup";

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; envelope: Extract<AddressLookupEnvelope, { ok: true }> }
  | { status: "error"; message: string; kind: string };

const ERROR_HINTS: Record<string, string> = {
  "no-match": "Census geocoder could not match this address.",
  "out-of-state": "Atlas TX covers Texas only.",
  "invalid-input": "Address is too short.",
  timeout: "Census geocoder timed out — try again.",
  network: "Census geocoder is unreachable.",
  internal: "Lookup failed. Please retry.",
};

export default function AddressSearch() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<FetchState>({ status: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 4) return;
    setState({ status: "loading" });
    try {
      const response = await fetch(
        `/api/address/lookup?q=${encodeURIComponent(trimmed)}`,
      );
      const body = (await response.json()) as AddressLookupEnvelope;
      if (!body.ok) {
        const kind = body.error.kind;
        setState({
          status: "error",
          kind,
          message: ERROR_HINTS[kind] ?? body.error.message,
        });
        return;
      }
      setState({ status: "ok", envelope: body });
    } catch (error) {
      setState({
        status: "error",
        kind: "network",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 ring-1 ring-white/10 backdrop-blur">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
          Address lookup · public data
        </div>
        <h2 className="text-2xl font-semibold text-white">
          What does Atlas TX know about an address?
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          Type a Texas address. Atlas TX resolves it to a county and surfaces public
          drinking-water risk, environmental burden, regulated facilities, and
          governance signals. Geocoded by the U.S. Census Bureau.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Texas street address
        </label>
        <input
          id={inputId}
          type="text"
          autoComplete="street-address"
          inputMode="text"
          placeholder="e.g. 1100 Congress Ave, Austin, TX 78701"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1 rounded-full border border-white/15 bg-slate-950/60 px-5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
        />
        <button
          type="submit"
          disabled={state.status === "loading" || query.trim().length < 4}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
        >
          {state.status === "loading" ? "Looking up…" : "Look up address"}
        </button>
      </form>

      {state.status === "error" && (
        <p className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/5 px-4 py-2 text-sm text-amber-100">
          {state.message}
        </p>
      )}

      {state.status === "ok" && <AddressLookupResult envelope={state.envelope} />}
    </section>
  );
}

function AddressLookupResult({
  envelope,
}: {
  envelope: Extract<AddressLookupEnvelope, { ok: true }>;
}) {
  const { data } = envelope;
  const county = data.county;
  const summary = data.water.summary;
  const populationServed = data.pws.reduce(
    (sum, system) => sum + (system.populationServed ?? 0),
    0,
  );

  return (
    <div className="mt-6 space-y-5 text-sm leading-6 text-slate-200">
      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Match
        </div>
        <p className="mt-1 text-base font-medium text-white">
          {data.matchedAddress}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {data.location.latitude.toFixed(5)}, {data.location.longitude.toFixed(5)}
          {data.blockGroupGeoid ? ` · block group ${data.blockGroupGeoid}` : ""}
        </p>
        {county && (
          <p className="mt-2 text-sm">
            <Link
              href={`/counties/${county.slug}`}
              className="text-cyan-200 underline-offset-4 hover:underline"
            >
              {county.name}
            </Link>{" "}
            {county.fips ? <span className="text-slate-500">FIPS {county.fips}</span> : null}
            {data.demographics.countyPopulation !== null && (
              <span className="text-slate-400">
                {" "}
                · {data.demographics.countyPopulation.toLocaleString()} residents (ACS)
              </span>
            )}
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ResultBlock title="Drinking water risk">
          {data.pws.length === 0 ? (
            <p className="text-slate-400">No SDWIS PWSs joined to this county in the snapshot.</p>
          ) : (
            <ul className="space-y-2">
              {data.pws.map((system) => (
                <li key={system.pwsid} className="flex flex-col">
                  <span className="font-medium text-white">{system.pwsName ?? system.pwsid}</span>
                  <span className="text-xs text-slate-400">
                    {system.healthBasedViolationCount} health-based violations
                    {system.populationServed !== null
                      ? ` · serves ${system.populationServed.toLocaleString()}`
                      : ""}
                    {system.latestViolationEnd ? ` · latest ${system.latestViolationEnd}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {populationServed > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Top {data.pws.length} PWSs · {populationServed.toLocaleString()} residents covered
            </p>
          )}
        </ResultBlock>

        <ResultBlock title="Active NWS alerts">
          {data.water.activeAlerts.length === 0 ? (
            <p className="text-slate-400">No active alerts for this county.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.water.activeAlerts.slice(0, 4).map((alert) => (
                <li key={alert.alertId} className="text-slate-200">
                  <span className="font-medium text-white">{alert.event}</span>
                  {alert.severity ? (
                    <span className="ml-1 text-xs text-slate-400">· {alert.severity}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </ResultBlock>

        <ResultBlock title="Nearest TCEQ pending permits">
          {data.permits.nearest.length === 0 ? (
            <p className="text-slate-400">No pending permits joined to this county.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.permits.nearest.map((permit) => (
                <li key={permit.permitNumber} className="text-slate-200">
                  <Link
                    href={`/permits/${permit.permitNumber}`}
                    className="text-cyan-200 underline-offset-4 hover:underline"
                  >
                    {permit.permitNumber}
                  </Link>{" "}
                  <span className="text-slate-300">{permit.permitteeName}</span>
                  <span className="block text-xs text-slate-400">
                    {permit.authorizationType}
                    {permit.distanceMiles !== null
                      ? ` · ${permit.distanceMiles.toFixed(1)} mi away`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {county && (
            <p className="mt-2 text-xs">
              <Link
                href={`/permits?county=${county.slug}`}
                className="text-cyan-200 underline-offset-4 hover:underline"
              >
                {data.permits.pendingInCounty} pending in {county.name} →
              </Link>
            </p>
          )}
        </ResultBlock>

        <ResultBlock title="Nearest USGS gauges">
          {data.water.nearestGauges.length === 0 ? (
            <p className="text-slate-400">No gauges found nearby.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.water.nearestGauges.map((gauge) => (
                <li key={gauge.siteNumber} className="text-slate-200">
                  <span className="font-medium text-white">{gauge.stationName}</span>
                  <span className="block text-xs text-slate-400">
                    USGS {gauge.siteNumber} · {gauge.distanceMiles.toFixed(1)} mi
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ResultBlock>

        <ResultBlock title="Surface water segments">
          {data.water.surfaceWaterSegments.length === 0 ? (
            <p className="text-slate-400">No segment context available.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.water.surfaceWaterSegments.slice(0, 4).map((segment) => (
                <li
                  key={`${segment.segmentId ?? segment.segmentName}-${segment.layerId}`}
                  className="text-slate-200"
                >
                  <span className="font-medium text-white">
                    {segment.segmentName ?? segment.segmentId ?? "Unnamed segment"}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {segment.basinName ?? "—"}
                    {segment.isImpaired ? " · impaired" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ResultBlock>

        <ResultBlock title="Water governance (MUDs, SUDs, utilities)">
          {data.governance.totalCount === 0 ? (
            <p className="text-slate-400">No districts or PUCT-registered utilities for this county.</p>
          ) : (
            <>
              <p className="text-xs text-slate-400">
                {data.governance.totalCount} entit{data.governance.totalCount === 1 ? "y" : "ies"} in county
                {Object.entries(data.governance.byCode)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([code, count]) => ` · ${count} ${code}`)
                  .join("")}
              </p>
              <ul className="mt-2 space-y-1.5">
                {data.governance.entities.map((entity) => (
                  <li key={`${entity.sourceId}-${entity.entityId}`} className="text-slate-200">
                    <span className="font-medium text-white">{entity.entityName}</span>
                    <span className="ml-2 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                      {entity.code}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {entity.typeLabel}
                      {entity.city ? ` · ${entity.city}` : ""}
                      {entity.activityStatus ? ` · ${entity.activityStatus}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ResultBlock>

        <ResultBlock title="Storage tanks (water towers)">
          {data.storage.totalCount === 0 ? (
            <p className="text-slate-400">
              No SDWIS storage facilities for the in-county PWSs surfaced above.
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-400">
                {data.storage.totalCount} active storage{" "}
                {data.storage.totalCount === 1 ? "facility" : "facilities"} across{" "}
                {data.storage.pwsCount} PWS{data.storage.pwsCount === 1 ? "" : "s"}
              </p>
              <ul className="mt-2 space-y-2">
                {data.storage.groups.map((group) => (
                  <li key={group.pwsid} className="text-slate-200">
                    <div className="text-sm font-medium text-white">
                      {group.pwsName ?? group.pwsid}
                      <span className="ml-2 text-xs text-slate-400">
                        {group.storageCount} tank{group.storageCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <ul className="mt-1 space-y-0.5 pl-3 text-xs text-slate-400">
                      {group.facilities.map((facility) => (
                        <li key={facility.facilityId}>
                          {facility.facilityName ?? facility.facilityId}
                          {facility.stateFacilityId ? (
                            <span className="ml-1 text-slate-500">
                              · {facility.stateFacilityId}
                            </span>
                          ) : null}
                        </li>
                      ))}
                      {group.storageCount > group.facilities.length ? (
                        <li className="text-slate-500">
                          + {group.storageCount - group.facilities.length} more
                        </li>
                      ) : null}
                    </ul>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ResultBlock>

        <ResultBlock title="County water summary">
          {summary ? (
            <ul className="space-y-1 text-slate-300">
              <li>
                Active alerts: <span className="text-white">{summary.metrics.activeWaterAlertCount ?? 0}</span>
              </li>
              <li>
                Stream gauges: <span className="text-white">{summary.metrics.streamGaugeCount ?? 0}</span>
              </li>
              <li>
                Sewer overflows (30d):{" "}
                <span className="text-white">{summary.metrics.sewerOverflowCount30d ?? 0}</span>
              </li>
              <li>
                Pending permits in county:{" "}
                <span className="text-white">{summary.metrics.generalPermitCount ?? 0}</span>
              </li>
              {summary.mismatch && (
                <li className="text-amber-200">
                  Mismatch flags: {summary.mismatch.flags.join(" · ")}
                </li>
              )}
            </ul>
          ) : (
            <p className="text-slate-400">County water summary not available.</p>
          )}
        </ResultBlock>
      </div>

      <details className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-400">
        <summary className="cursor-pointer text-slate-300">
          Sources &amp; caveats ({envelope.sources.length})
        </summary>
        <div className="mt-3 space-y-2">
          <p>
            <span className="text-slate-500">Sources:</span>{" "}
            {envelope.sources.join(", ")}
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {envelope.caveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}

function ResultBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}
