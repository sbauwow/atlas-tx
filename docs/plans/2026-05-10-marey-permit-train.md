# Marey-style permit train chart — blocker

## What it would show

A Marey/train-schedule style chart on `/permits`:

- **y-axis**: counties (sorted by basin or by current backlog age)
- **x-axis**: time
- **glyph**: each filing = a thin diagonal segment from `received_date` → `terminal_date` (decision/withdrawn/permitted). Pending filings are unfinished diagonals trailing into "now."

One glance reveals:

1. Which counties have *aging* pending filings (long unfinished diagonals).
2. Whether a backlog is uniform or concentrated in a few applicants.
3. Per-county throughput change over time.

It's the natural Tufte view of the dataset. The current "pending count" KPI tile is a 1D summary that hides the entire age distribution.

## Why we can't ship it today

`src/lib/tceq-permits.ts` ↔ Socrata dataset `7fq8-wig2`:

```ts
export type TceqWaterPermitRawRow = {
  permit_number?: string;
  authorization_type?: string;
  authorization_status?: string;
  permittee_name?: string;
  facility_county?: string;
  nearest_city?: string;
  latitude?: string | null;
  longitude?: string | null;
};
```

Notice what is missing: **`received_date`, `status_date`, or any timestamp field**. The normalizer drops everything Socrata might return. CID `cid-protests` has `filedAt` but that is a different dataset — the protest filings, not the underlying permits.

Without paired (received, terminal) timestamps per filing the chart cannot be drawn honestly.

## What unblocks it

1. Inspect `7fq8-wig2` schema:
   `https://data.texas.gov/resource/7fq8-wig2.json?$limit=1` and confirm the date columns it actually exposes (typically `proj_status_date`, `wq_proj_status_date`, etc.).
2. Add the relevant columns to `TceqWaterPermitRawRow` and surface them as ISO dates on the normalized `TceqWaterPermit` shape.
3. Refresh and commit a snapshot under `public/cache/tceq-pending-permits-tx.json` (and a `data/` full version) so `/permits` doesn't depend on the live Socrata path during the demo.
4. Wire a `<MareyChart>` SVG primitive (extend `src/app/components/data-viz/`) — same authoring conventions as `Sankey`/`MismatchStrip`.

Estimate: 1–2 hours once the Socrata column names are confirmed and the snapshot fits the 5 MB budget.

## Owner

Pending claim under `data` workstream in `docs/STATE.md`.
