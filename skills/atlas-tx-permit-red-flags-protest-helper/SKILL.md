---
name: atlas-tx-permit-red-flags-protest-helper
description: Extend Atlas TX's permits workflow with filing-level red-flag scoring, `/permits/[tceqId]` detail pages, and non-legal protest-helper UX built on CID procedural data.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [atlas-tx, permits, cid, protest, red-flags, nextjs, tdd]
    related_skills: [test-driven-development, karpathy-guidelines, atlas-tx-public-data-lanes]
---

# Atlas TX permit red flags + protest helper

Use when Atlas TX needs to move from county-level permit monitoring to filing-level scrutiny and protest-support workflows.

## When this applies
- User wants red flags on individual TCEQ/CID filings, not just county aggregates.
- User wants `/permits` to surface “what needs scrutiny now”.
- User wants a filing detail page or protest-helper workflow.
- User wants to turn CID hearing/public-meeting/comment pressure into actionable public-interest UX.

## Current architecture pattern
Atlas TX already has the core ingredients:
- `src/lib/tceq-permits.ts`
  - merges pending TCEQ permit rows with CID snapshot context
  - exposes `CidCaseWithFilings`, `CidOpenCasesSummary`, county map rows, page data
- `src/lib/datasets/cid.ts`
  - Search One / Search Two parsing
- `src/lib/scoring/protest_density.ts`
  - county-level procedural pressure model
- `/permits`
  - main permit workflow page
- county workspace links
  - `/permits?county=...`
  - `/water/counties/[slug]`
  - `/counties/[slug]`

## Guardrails
- Never present red flags as proof that a filing is invalid.
- Never present legal advice.
- Keep “comment filed”, “hearing request filed”, “public meeting request filed”, and “SOAH docket present” distinct.
- Use public-record framing: “best-effort procedural context”, “public-record leads”, “signals that deserve scrutiny”.
- No individual commenter naming.

## Proven Phase 1 pattern: filing-level red-flag scorer
Create a pure scorer first.

### File
- `src/lib/scoring/permit_filing_red_flags.ts`

### Minimal row shape that worked
```ts
export type PermitFilingRedFlagReason = {
  category: "procedural-pressure" | "county-pressure";
  severity: "medium" | "high";
  text: string;
};

export type PermitFilingRedFlagRow = {
  tceqId: string;
  applicantName: string;
  county: string | null;
  programArea: string;
  score: number;
  components: {
    proceduralPressure: number;
    countyPressure: number;
  };
  reasons: PermitFilingRedFlagReason[];
  caveats: string[];
};
```

### Inputs that worked
- pending permits (`TceqWaterPermit[]`)
- CID enriched cases (`CidCaseWithFilings[]`)

### Proven scoring heuristics
- SOAH docket present → strong bump
- hearing requests → strong bump
- public meeting requests → medium bump
- comments → small bump
- multiple pending permits in same county → county-pressure bump

### Reason strings that were useful in UI/tests
- `SOAH docket present`
- `1 hearing request filed`
- `1 public meeting request filed`
- `2 public comments filed`
- `2 pending permits in Travis County`

## Proven Phase 1 UI pattern on `/permits`
Add a dedicated section above roster-heavy/detail-heavy sections.

### Section title
- `Filings that need scrutiny`

### Placement
Put it after top-level permit/CID stats and before the old county/roster/CID-detail blocks.

### Card contents
- applicant name (link to filing detail page)
- program area
- county
- TCEQ ID
- score
- explicit reason bullets

### Important implementation detail
Link applicant/title to:
- `/permits/${row.tceqId}`

## Proven Phase 2 pattern: filing detail page
### Route
- `src/app/permits/[tceqId]/page.tsx`

### Data source pattern
Do not build a separate fetch stack first. Reuse page data you already trust.

Call:
```ts
const data = await getTceqPendingPermitsPageData();
const detail = getPermitFilingDetailPageData({
  tceqId,
  permits: data.permits,
  cidSummary: data.cidSummary,
});
```

### Helper added to `src/lib/tceq-permits.ts`
Add:
```ts
export type PermitFilingDetailPageData = {
  caseRow: CidCaseWithFilings;
  countyPermitCount: number;
  relatedPermits: TceqWaterPermit[];
  redFlagRow: PermitFilingRedFlagRow | null;
  cidSummary: CidOpenCasesSummary;
};
```

and a helper:
```ts
getPermitFilingDetailPageData({ tceqId, permits, cidSummary })
```

### What that helper should do
- find the CID case by `tceqId`
- throw if missing
- derive related permits by matching applicant name (and county when available)
- derive county permit count
- reuse `scorePermitFilingRedFlags(...)` and find the corresponding row

## Filing detail page structure that worked
1. County workspace header
   - if county is known, map through `getCountyBySlugOrName`
   - reuse `CountyWorkspaceHeader`
2. Top nav pills
   - back to county permit view
   - back to statewide permits
3. Stats row
   - program area
   - hearing requests
   - public meeting requests
   - pending permits in county
4. Procedural status card
   - TCEQ ID
   - county
   - TCEQ docket
   - SOAH docket
   - latest filing date
   - filing count summary
5. Red-flag breakdown card
   - reason rows with category + severity
6. Related county permits table
7. Caveats card
   - combine red-flag caveats + CID caveats

## TDD path that worked well
Always do RED first with targeted tests.

### Tests added/updated
- `tests/permit-filing-red-flags.test.ts`
  - pure scorer behavior
- `tests/permits-page.test.tsx`
  - new scrutiny section on `/permits`
- `tests/tceq-permits.test.ts`
  - filing detail data builder helper
- `tests/permit-detail-page.test.tsx`
  - `/permits/[tceqId]` render coverage

### Useful assertions
For `/permits` page:
- `Filings that need scrutiny`
- `SOAH docket present`
- `1 hearing request filed`
- `2 pending permits in Travis County`

For detail page:
- `County workspace`
- applicant name
- TCEQ ID
- `Related county permits`
- county permit link + water link

## Gotchas / experiential findings
- For `/permits` page tests, if you want county-pressure reason text like `2 pending permits in Travis County`, your mocked permit list must actually include 2 permits in that county.
- Reusing `getTceqPendingPermitsPageData()` for the filing detail page is the fastest honest path for Phase 2. Do not over-engineer a separate data pipeline first.
- TypeScript may complain when narrowing `caseRow.county`; if needed, use explicit narrowing/casting inside count filters.
- When moving sections around in `src/app/permits/page.tsx`, re-read the page after patching to ensure section nesting didn’t break. It’s easy to accidentally swallow the roster/CID sections while inserting the new red-flag section.

## Validation commands
Run in `~/Projects/atlas-tx`:
```bash
npm test -- tests/permit-filing-red-flags.test.ts tests/permits-page.test.tsx
npm test -- tests/tceq-permits.test.ts tests/permit-detail-page.test.tsx tests/permits-page.test.tsx
npm run lint
npm run build
npm test
```

## Proven Phase 3 pattern: protest-prep panel
Phase 3 shipped cleanly by keeping everything server-rendered and deriving prep content from the existing filing-detail helper.

### Helper added to `src/lib/tceq-permits.ts`
Add:
```ts
export type PermitProtestPrep = {
  participationStatus: string[];
  evidenceChecklist: string[];
  draftText: string;
  exportText: string;
};
```

and a pure helper:
```ts
buildPermitProtestPrep({
  caseRow,
  countyPermitCount,
  redFlagReasons,
  relatedPermitNumbers,
})
```

### What that helper should generate
- `participationStatus`
  - contested-case / comment / public-meeting framing from the record
  - if `soahDocketNumber` exists, say so explicitly
- `evidenceChecklist`
  - county/community impact
  - cumulative burden in county
  - latest filing activity
  - related permit IDs
- `draftText`
  - a starter paragraph grounded in filing facts
- `exportText`
  - one copy-ready block combining status, checklist, red flags, and draft

### Proven strings that worked in tests/UI
- `Request a contested case hearing`
- `Describe how the filing affects Travis County or nearby neighborhoods.`
- `I am submitting this comment regarding TCEQ ID WQ0000447000`
- `Top visible red flags:`

### Detail-page UI pattern that worked
On `src/app/permits/[tceqId]/page.tsx`:
1. build `protestPrep` immediately after `detail`
2. add a standalone section titled:
   - `Protest prep panel`
3. inside it render four blocks:
   - `Participation status`
   - `Evidence checklist`
   - `Draft from facts`
   - `Submission pack`
4. use explicit guardrail copy:
   - `Drafting support only. Atlas TX surfaces public-record context but does not provide legal advice or auto-submit anything.`

### Important implementation detail
Keep the panel server-rendered and text-first for now. Do not add form state, client components, or submission plumbing in Phase 3.

### Tests added/updated for Phase 3
- `tests/tceq-permits.test.ts`
  - pure helper coverage for `buildPermitProtestPrep`
- `tests/permit-detail-page.test.tsx`
  - render assertions for the four panel blocks and starter text

### Gotchas / experiential findings
- The best minimal participation-status heuristic is record-driven, not deadline-driven:
  - hearing request present → `Request a contested case hearing`
  - no hearing request → `Submit a public comment`
  - public meeting request present vs consider-public-meeting wording
  - SOAH referral visible vs not yet visible
- `exportText` should be assembled as a plain text block with section labels. That makes it immediately reusable for copy/export later.
- Keep the draft factual and procedural; avoid verbs that imply Atlas is instructing the user on legal strategy.

## Recommended next move after Phase 3
Phase 4 should harden procedural precision on `/permits/[tceqId]` with:
- explicit status badges for comment / hearing requested / public meeting requested / SOAH referred
- deadline fields when available
- clearer distinction between citizen filings and actual contested-case referral

Keep it procedural and non-legal.
