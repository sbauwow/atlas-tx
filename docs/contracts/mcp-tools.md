# Contract — MCP Tool Surface

> Contract version: **0.3.0** — bump on any breaking change to tool name, params, or response shape. Notify `skill` workstream in `STATE.md` when bumping.
>
> Changelog:
> - 0.3.0 (2026-05-09): add filing-level permit scrutiny tools `list_permit_filing_red_flags` and `build_permit_protest_prep` so MCP matches the new `/permits` filing-detail workflow.
> - 0.2.0 (2026-05-08): add draft protest/CID tool signatures (`list_protested_permits`, `score_protest_density`) and optional APD folding in `summarize_water_risk_for_county`.
> - 0.1.0: initial DWRS/EJ tool surface.

This is the API the **mcp** workstream publishes for the **skill** workstream (and any external agent) to consume. Every tool returns the same envelope.

---

## Response envelope (all tools)

```ts
type ToolResponse<T> = {
  data: T;
  sources: Source[];        // every dataset row used to compute `data`
  caveats: string[];        // human-readable warnings; empty allowed but field present
  generated_at: string;     // ISO 8601
  cache_state: "fresh" | "snapshot";  // "snapshot" if served from public/cache/*
};

type Source = {
  dataset_id: string;       // matches MVP_DATASETS entry
  publisher: string;
  url: string;              // stable public URL
  retrieved_at: string;
  rows_used: number;
};
```

Tools never return naked data. The skill relies on `sources` and `caveats` to satisfy attribution + safety guardrails.

## Tool catalog (v0.3.0)

### `discover_datasets`
Lists registered datasets with category + use-case + access type.

```ts
params: {} | { category?: MvpDataset["category"] };
data: MvpDataset[];
```

### `get_dataset_schema`
Returns the registered fields and caveats for a single dataset.

```ts
params: { dataset_id: string };
data: { dataset: MvpDataset; field_descriptions?: Record<string, string> };
```

### `score_pws_drinking_water_risk`
Computes DWRS for Texas Public Water Systems.

```ts
params: {
  county?: string;          // normalized via counties.ts; if omitted, all TX
  limit?: number;           // default 25
  min_population?: number;  // default 0
};
data: Array<{
  pws_id: string;
  pws_name: string;
  county: string;
  population_served: number;
  score: number;            // 0-100
  components: { violation_severity: number; population_weight: number; recency_weight: number };
  top_violations: Array<{ code: string; description: string; date: string }>;
}>;
```

### `overlay_ej_burden`
Joins EJScreen demographic burden with TCEQ permit-buffer density.

```ts
params: {
  county?: string;
  block_group_geoid?: string;
  buffer_miles?: number;    // default 1.0
  limit?: number;
};
data: Array<{
  block_group_geoid: string;
  county: string;
  ejscreen_percentile: number;
  permit_count_in_buffer: number;
  score: number;
  components: { demographic_burden: number; permit_density: number };
}>;
```

### `summarize_water_risk_for_county`
Composite county-level summary that pulls DWRS + EJ overlap + permit context. Intended as the "answer panel" the skill returns to the user.

```ts
params: {
  county: string;
  max_words?: number;               // default 200
  include_protest_density?: boolean; // default false at v0.2
};
data: {
  county: string;
  headline: string;
  narrative: string;          // bounded summary citing source rows
  top_pws: Array<{ pws_id: string; pws_name: string; score: number }>;
  top_block_groups: Array<{ geoid: string; score: number }>;
  protest_density?: {
    score: number;
    raw_pressure: number;
    per_1k_population: number;
    open_case_count: number;
  };
};
```

### `list_protested_permits`
Lists protested/open CID items with filing counts and procedural status. This is the journalist-facing drilldown tool.

```ts
params: {
  county?: string;                    // normalized county name
  program_area?: string;              // e.g. "APO", "AQ", "WQ", "PWS"
  min_hearing_requests?: number;      // default 0
  limit?: number;                     // default 25
  include_closed?: boolean;           // default false
};
data: Array<{
  tceq_id: string;
  applicant_name: string;
  county: string | null;
  program_area: string;
  item_status: "open" | "closed";
  tceq_docket_number: string | null;
  soah_docket_number: string | null;
  filing_counts: {
    comments: number;
    hearing_requests: number;
    public_meeting_requests: number;
  };
  named_filing_orgs: string[];        // organizations only; no individual commenter names
  latest_filed_at: string | null;     // ISO date
}>;
```

### `score_protest_density`
Computes APD from CID + ACS rows. Initial scope is county only.

```ts
params: {
  county?: string;                    // if omitted, statewide ranking
  scope?: "county";                  // default and only supported value at v0.2
  limit?: number;                     // default 25
  min_population?: number;            // default 0
};
data: Array<{
  county: string;
  score: number;                      // normalized 0-100
  raw_pressure: number;
  per_1k_population: number;
  open_case_count: number;
  components: {
    comment_count: number;
    hearing_request_count: number;
    public_meeting_request_count: number;
    soah_case_count: number;
  };
}>;
```

### `build_permit_protest_prep`
Builds a non-legal, public-record drafting pack for one filing.

```ts
params: {
  tceq_id: string;
};
data: {
  tceq_id: string;
  participation_status: string[];
  evidence_checklist: string[];
  draft_text: string;
  export_text: string;
};
```

### `list_permit_filing_red_flags`
Lists filing-level scrutiny candidates derived from permit concentration plus CID procedural pressure.

```ts
params: {
  county?: string;
  limit?: number;
};
data: Array<{
  tceq_id: string;
  applicant_name: string;
  county: string | null;
  program_area: string;
  score: number;
  reasons: string[];
  components: {
    procedural_pressure: number;
    county_pressure: number;
  };
}>;
```

## Adding a new tool

1. Add the entry to this contract first (params + data shape).
2. Implement under `packages/mcp-server/src/tools/<tool_name>.ts`.
3. Wire into the dispatcher.
4. Add a smoke test that asserts the envelope shape.
5. Update `skills/atlas-tx/SKILL.md` references if the skill should know about it.

## Naming conventions

- Tool names are `snake_case` verbs.
- Discovery / schema reads start with `discover_` or `get_`.
- Computations start with `score_` or `summarize_` or `overlay_`.
- Mutations are not allowed at v0.1.0.

## Failure modes

- Validation error ⇒ throw with `code: "INVALID_PARAMS"`, message names the bad field.
- Data unavailable for a county ⇒ return `data: []` and a `caveat` explaining coverage gap. Do not throw.
- Underlying source older than 90 days ⇒ add a caveat naming the snapshot date.
