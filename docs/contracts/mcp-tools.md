# Contract — MCP Tool Surface

> Contract version: **0.7.0** — bump on any breaking change to tool name, params, or response shape. Notify `skill` workstream in `STATE.md` when bumping.
>
> Changelog:
> - 0.7.0 (2026-05-10): wire a real stdio MCP transport via `@modelcontextprotocol/sdk` (`packages/mcp-server/src/server.js`, run with `npm run mcp:stdio`); ship the contract-promised `summarize_water_risk_for_county` composite (DWRS top PWS + analytics snapshot + optional APD); existing JSON CLI dispatch (`npm run mcp <tool> '<json>'`) stays as a back-door for scripts.
> - 0.6.0 (2026-05-10): add Wave 3 analytics-spine MCP tools `get_county_analytics_summary`, `list_county_movers`, `get_pressure_risk_scatter`, and `get_county_score_decomposition` over the committed Wave 1/2 analytics artifacts.
> - 0.5.0 (2026-05-10): add `get_permit_filing_detail` and `list_county_pending_fights` so MCP exposes the permit-detail workspace and county-level pending-fights lane.
> - 0.4.0 (2026-05-10): add `get_pipeline_health` so MCP can read the staged refresh artifact and expose CID fallback/failure state to agents.
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

## Tool catalog (v0.7.0)

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

### `get_county_analytics_summary`
Returns the committed Wave 1/2 analytics-spine summary for one county. This is snapshot-only and does not fetch live upstream rows.

```ts
params: {
  county: string;                    // explicit county name, e.g. "Comal County"
  history_limit?: number;            // default 4; max snapshots to echo from county-history
};
data: {
  county: string;
  county_slug: string;
  current_snapshot: {
    snapshot_at: string;
    county_risk_score: number;
    pressure_score: number;
    risk_rank: number;
    pressure_rank: number;
    system_count: number;
    violation_count: number;
    impaired_segment_count: number;
    hydrology_layer_hit_count: number;
    affected_population: number | null;
    population: number | null;
  } | null;
  previous_snapshot: {
    snapshot_at: string;
    county_risk_score: number;
    pressure_score: number;
    risk_rank: number;
    pressure_rank: number;
  } | null;
  deltas: {
    county_risk_score: number | null;
    pressure_score: number | null;
    risk_rank: number | null;
    pressure_rank: number | null;
  };
  movement: {
    movement: "new" | "steady" | "up" | "down";
    current_rank: number;
    previous_rank: number | null;
    rank_delta: number | null;
    current_risk_score: number;
    previous_risk_score: number | null;
    score_delta: number | null;
    current_pressure_score: number;
    previous_pressure_score: number | null;
  } | null;
  scatter_context: {
    x: number;
    y: number;
    quadrant: string;
    quadrant_label: string | null;
    population: number | null;
    impaired_segment_count: number;
    hydrology_layer_hit_count: number;
    system_count: number;
    violation_count: number;
  } | null;
  top_systems: Array<{
    pwsId: string;
    pwsName: string;
    score: number;
    violationCount: number;
  }>;
  history: Array<{
    snapshot_at: string;
    county_risk_score: number;
    pressure_score: number;
    risk_rank: number;
    pressure_rank: number;
    violation_count: number;
    impaired_segment_count: number;
  }>;
  provenance: {
    method: string | null;
    notes: string[];
  };
};
```

### `list_county_movers`
Lists counties from the committed `county-movers.json` artifact, optionally filtered by movement label or county.

```ts
params: {
  movement?: "new" | "steady" | "up" | "down"; // explicit movement filter
  county?: string;                                   // exact county name if caller wants one county row
  limit?: number;                                    // default 25
};
data: {
  baseline_snapshot_at: string | null;
  comparison_snapshot_at: string | null;
  notes: string[];
  movers: Array<{
    county: string;
    county_slug: string;
    movement: "new" | "steady" | "up" | "down";
    current_rank: number;
    previous_rank: number | null;
    rank_delta: number | null;
    current_risk_score: number;
    previous_risk_score: number | null;
    score_delta: number | null;
    current_pressure_score: number;
    previous_pressure_score: number | null;
  }>;
};
```

### `get_pressure_risk_scatter`
Returns the statewide pressure-vs-risk scatter context from the committed analytics artifact, with optional county/quadrant filtering.

```ts
params: {
  county?: string;                                   // exact county name for a single-point lookup
  quadrant?:
    | "high-pressure-high-risk"
    | "high-pressure-lower-risk"
    | "lower-pressure-high-risk"
    | "lower-pressure-lower-risk";
  limit?: number;                                    // default 100 after filtering
};
data: {
  axes: {
    x: string;
    y: string;
  };
  quadrant_summary: Array<{
    quadrant: string;
    label: string;
    count: number;
  }>;
  points: Array<{
    county: string;
    county_slug: string;
    x: number;
    y: number;
    population: number | null;
    impaired_segment_count: number;
    hydrology_layer_hit_count: number;
    system_count: number;
    violation_count: number;
    quadrant: string;
    quadrant_label: string | null;
  }>;
};
```

### `get_county_score_decomposition`
Breaks one county's committed analytics view into the current risk axis, pressure axis, supporting counts, top systems, and scatter position.

```ts
params: {
  county: string;                     // explicit county name, e.g. "Travis County"
};
data: {
  county: string;
  county_slug: string;
  snapshot_at: string;
  decomposition: Array<{
    component_id: "county_risk_score" | "pressure_score";
    label: string;
    value: number;
    rank: number;
    statewide_county_count: number | null;
    details: Record<string, number | null>;
  }>;
  top_systems: Array<{
    pws_id: string;
    pws_name: string;
    score: number;
    violation_count: number;
  }>;
  scatter_context: {
    quadrant: string;
    quadrant_label: string | null;
    x: number;
    y: number;
  } | null;
  provenance: {
    method: string | null;
    notes: string[];
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

### `get_permit_filing_detail`
Returns the structured filing-detail workspace context for one TCEQ ID.

```ts
params: {
  tceq_id: string;
};
data: {
  tceq_id: string;
  procedural_status: {
    county: string | null;
    program_area: string;
    item_status: string;
    tceq_docket_number: string | null;
    soah_docket_number: string | null;
    latest_filed_at: string | null;
    filing_counts: {
      comments: number;
      hearing_requests: number;
      public_meeting_requests: number;
    };
  };
  county_permit_count: number;
  related_permits: Array<{
    permit_number: string;
    permittee_name: string;
    authorization_type: string;
    county: string | null;
    nearest_city: string | null;
  }>;
  red_flag: {
    score: number;
    reasons: string[];
    components: {
      procedural_pressure: number;
      county_pressure: number;
    };
    caveats: string[];
  } | null;
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

### `list_county_pending_fights`
Lists county-filterable open fights ranked by procedural pressure for the county workspace lane.

```ts
params: {
  county?: string;
  limit?: number;
};
data: Array<{
  tceq_id: string;
  applicant_name: string;
  county: string | null;
  county_slug: string | null;
  program_area: string;
  procedural_pressure_score: number;
  county_permit_count: number;
  item_status: string;
  tceq_docket_number: string | null;
  soah_docket_number: string | null;
  latest_filed_at: string | null;
  filing_counts: {
    comments: number;
    hearing_requests: number;
    public_meeting_requests: number;
  };
  named_filing_orgs: string[];
}>;
```

### `get_pipeline_health`
Returns the latest staged refresh status from `public/cache/pipeline-health.json`.

```ts
params: {};
data: {
  overall_status: "ok" | "degraded" | "failed";
  last_successful_run_at: string | null;
  stale_steps: string[];
  cid: {
    status: "ok" | "failed" | "skipped" | "missing";
    browser_fallback_used: boolean;
    last_error: string | null;
  };
  steps: Array<{
    step_id: string;
    status: "ok" | "failed" | "skipped";
    started_at: string;
    ended_at: string;
    duration_ms: number;
    output_path: string | null;
    notes: string[];
  }>;
};
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
