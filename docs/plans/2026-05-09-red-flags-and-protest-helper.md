# Atlas TX — Permit Filing Red Flags + Protest Helper

> For Hermes: this is a product/implementation plan, not a request to ship code in this commit.

Goal
- Help Atlas TX users spot high-risk or high-weirdness permit filings early, then move from passive monitoring to an evidence-backed, deadline-aware protest workflow.

Architecture
- Build on the existing `/permits` + CID snapshot lane, not a new parallel system.
- Keep the feature procedural and public-record oriented: identify red flags, summarize what is on file, surface deadlines/status, and help users draft/organize a response.
- Do not give legal advice or claim a protest will succeed. The product should help users prepare a public comment / hearing-request package, not act as counsel.

Current repo leverage
- `src/lib/tceq-permits.ts` already merges pending TCEQ water permits with CID open-case/protest context.
- `src/lib/datasets/cid.ts` already parses Search One / Search Two rows.
- `src/lib/scoring/protest_density.ts` already computes county-level filing pressure.
- `/permits`, `/counties/[slug]`, and `/water/counties/[slug]` already function as county workspaces.
- `docs/plans/2026-05-08-protests-extension.md` already defines APD and the PII / process guardrails.

Non-negotiable guardrails
- No legal advice. Copy must say: “Atlas TX is not a law firm and does not determine legal merit.”
- No naming individual commenters. Counts + orgs only.
- Distinguish clearly between:
  - comment filed
  - hearing request filed
  - public meeting request filed
  - contested case / SOAH referral
- Separate “red flag” from “proof.” Red flags are reporter/community leads.
- Keep any letter-generation feature editable and user-authored. Atlas TX can draft, structure, and cite, but the user owns the submission.

---

## What the video adds to product direction

The speaker’s strongest product-relevant points are not the insults; they are the missing diligence questions:
- capital cost transparency
- operating cost transparency
- funding source clarity
- intake/discharge process design clarity
- recirculation / fouling risk
- energy demand and transmission burden
- environmental-justice siting burden
- whether serious engineering / environmental review actually exists

Those translate cleanly into a red-flag model. Atlas TX should not just count protests; it should show why a filing deserves closer scrutiny.

---

## Red-flag model

### Filing-level red-flag categories

1. Process / engineering opacity
- Missing or vague intake/discharge design details
- Missing recovery / waste-stream explanation
- Missing pretreatment / fouling discussion
- Missing power-demand disclosure
- Missing O&M assumptions

2. Procedural escalation
- Hearing requests filed
- Public meeting requests filed
- SOAH docket present
- Large comment volume
- Repeat filings / amended filings / re-submissions

3. Environmental-justice / community burden
- Facility sited near already burdened counties / tracts
- Existing permit density already high
- Existing surface-water impairment context nearby
- County already shows high mismatch or APD pressure
- Siting adjacent to historically burdened communities (for example Hillcrest-style patterns)

4. Water-system / hydrology strain
- County already has flood/overflow/notice stress
- Existing water permits + new filing compound the same geography
- Intake/discharge location suggests semi-closed or constrained receiving water risk

5. Economic / governance opacity
- Funding source unclear
- Public cost exposure unclear
- Applicant / authority history unclear
- Project scope large relative to explained benefits

### Proposed score shape

Create a new derived signal that remains explainable:

`filing_red_flag_score = process_opacity + procedural_pressure + ej_burden + hydrology_strain + governance_opacity`

Each component should emit:
- numeric subscore
- exact triggered reasons
- source provenance
- caveats

Do not produce a mysterious single number without reason rows.

---

## Product surfaces

### 1. Filing red-flag cards inside `/permits`

Add a new section above the roster:
- “Filings that need scrutiny”
- top 10 filings ranked by red-flag score
- each card shows:
  - permit / TCEQ ID
  - permittee
  - county
  - program area
  - filing pressure summary
  - top 3 triggered red flags
  - CTA: `Review filing`

### 2. Filing detail page

Add a new route:
- `/permits/[tceqId]`

This should be the operator workspace for one filing.

Sections:
- Filing summary
- Procedural status
- Protest signal
- Red-flag breakdown
- County / hydrology / burden context
- Source links
- Protest prep panel

### 3. Protest prep panel

This is the user-help feature.

It should help users answer:
- What is this application?
- Why are people already reacting?
- What are the strongest public-record concerns?
- What kind of participation is still open?
- What do I need to gather before I submit anything?

Panel blocks:
- `Participation status`
  - comment / hearing / public meeting availability
  - known deadlines if captured
  - SOAH referral status if present
- `Evidence checklist`
  - location-specific impact notes
  - affected neighborhood/community context
  - water / air / overflow / permit context already in Atlas
  - related filings or prior pressure in county
- `Draft from facts`
  - generates a structured editable comment draft
  - sections: concern, local context, cited records, requested action
- `Submission pack`
  - export plain text / markdown / copy-ready text
  - never auto-submit in v1

### 4. County workspace “Pending fights” panel

Existing plan already hinted at this. Extend it.

Add to:
- `/counties/[slug]`
- optionally `/water/counties/[slug]`

Show:
- top protested / red-flagged filings in county
- counts of comments / hearing requests / PMRs
- strongest triggered reasons
- direct link to filing detail page

---

## Suggested data additions

### New derived model
File:
- `src/lib/scoring/permit_filing_red_flags.ts`

Proposed type:

```ts
export type FilingRedFlagRow = {
  tceqId: string;
  county: string | null;
  programArea: string;
  score: number;
  components: {
    processOpacity: number;
    proceduralPressure: number;
    ejBurden: number;
    hydrologyStrain: number;
    governanceOpacity: number;
  };
  reasons: Array<{
    category:
      | "process-opacity"
      | "procedural-pressure"
      | "ej-burden"
      | "hydrology-strain"
      | "governance-opacity";
    severity: "low" | "medium" | "high";
    text: string;
    sourceId: string;
  }>;
  caveats: string[];
};
```

### New helper input aggregator
File:
- `src/lib/permits/filing-context.ts`

Purpose:
- join pending permit rows, CID case rows, CID protests, county explorer signals, and optional water-summary signals into one filing context object.

### Optional snapshot lane for filing metadata enrichment
If Atlas later acquires more structured permit documents or notice metadata, isolate that in a separate data loader.
Do not block v1 on document OCR/parsing.

---

## Suggested route/API additions

### API
- `src/app/api/permits/red-flags/route.ts`
  - returns ranked filing red flags statewide or by county
- `src/app/api/permits/[tceqId]/route.ts`
  - returns one filing context envelope
- optional: `src/app/api/permits/[tceqId]/protest-draft/route.ts`
  - returns structured editable draft sections

### App routes
- `src/app/permits/[tceqId]/page.tsx`
  - filing detail workspace

---

## Minimal v1 feature definition

### Phase 1 — rank and explain red-flagged filings
Deliverable:
- filing-level red-flag scoring
- top filings section on `/permits`
- simple filing detail page

Acceptance criteria:
- User can see which filings Atlas thinks need scrutiny.
- Every ranked filing shows explicit reasons, not just a score.
- Reasons are sourced from existing Atlas data only.

### Phase 2 — county integration
Deliverable:
- county pages show “Pending fights”
- filing detail page links back to county intelligence / permits / water pages

Acceptance criteria:
- County workspace no longer stops at aggregate pressure.
- Users can move from county-level concern to one filing.

### Phase 3 — protest helper
Deliverable:
- structured protest prep panel
- editable draft generator
- evidence checklist
- copy/export workflow

Acceptance criteria:
- User can turn a flagged filing into a structured public-comment draft.
- UI makes clear this is procedural support, not legal counsel.
- Draft text is editable and citations are traceable.

### Phase 4 — deadline/status hardening
Deliverable:
- explicit comment/hearing/public-meeting status model
- deadline display where available
- stronger SOAH / contested-case distinctions

Acceptance criteria:
- Atlas no longer conflates “people complained” with “case referred.”
- Status language is legally/procedurally precise.

---

## Exact file targets for implementation

Likely new files
- `src/lib/scoring/permit_filing_red_flags.ts`
- `src/lib/permits/filing-context.ts`
- `src/app/api/permits/red-flags/route.ts`
- `src/app/api/permits/[tceqId]/route.ts`
- `src/app/permits/[tceqId]/page.tsx`
- `tests/permit-filing-red-flags.test.ts`
- `tests/permit-detail-page.test.tsx`
- `tests/permit-red-flags-route.test.ts`

Likely modified files
- `src/app/permits/page.tsx`
- `src/app/counties/[slug]/page.tsx`
- `src/lib/tceq-permits.ts`
- `docs/contracts/dataset-registry.md`
- `docs/STATE.md`

Optional later files
- `src/app/components/protest-prep-panel.tsx`
- `src/app/components/filing-red-flag-card.tsx`
- `src/app/components/filing-status-badge.tsx`

---

## TDD-first implementation slices

### Slice A — pure scoring
- Add failing tests for filing-level red-flag ranking.
- Implement `permit_filing_red_flags.ts` as pure logic with deterministic fixtures.
- No UI yet.

### Slice B — API envelope
- Add failing route test for `/api/permits/red-flags`.
- Return ranked rows + reasons.

### Slice C — `/permits` UI section
- Add failing page test for “Filings that need scrutiny”.
- Render top cards from the red-flags API/service.

### Slice D — filing detail page
- Add failing test for `/permits/[tceqId]`.
- Render summary + reasons + protest context.

### Slice E — protest prep panel
- Add failing test for editable evidence checklist / draft sections.
- Implement non-submitting helper panel.

---

## How to spot filings with red flags in practice

Atlas should treat these as explicit rules before any fancy scoring:

High-confidence red flags
- SOAH docket present
- hearing requests > 0
- public meeting requests > 0
- county already high in APD and permit pressure
- filing sits in county with mismatch signals / overflow stress / impaired waters

Medium-confidence red flags
- heavy comment volume without escalation
- applicant / authority disclosures feel incomplete
- cost / funding / power / discharge basics absent from the record Atlas can access
- project scale is large relative to local burden and infrastructure context

Needs-human-review flags
- technical claims about RO recovery / pretreatment / recirculation
- alleged fraud / sham permitting
- environmental-justice burden claims requiring tract/siting precision

That last category should be surfaced as:
- “claim worth checking”
- not “Atlas has verified this”

---

## UX copy constraints

Preferred framing
- “Signals that this filing deserves scrutiny”
- “Public-record concerns already visible”
- “Participation options”
- “Draft from cited facts”

Avoid
- “This permit is invalid”
- “This protest will win”
- “Fraud confirmed”
- “File this legal challenge”

---

## Best near-term implementation order

1. Filing red-flag scorer
2. `/api/permits/red-flags`
3. `/permits` top red-flag section
4. `/permits/[tceqId]` detail page
5. county “Pending fights” panel
6. protest prep panel
7. deadline/status hardening

---

## Why this is a strong Atlas TX feature

It turns Atlas from:
- a county risk and permit monitoring surface

into:
- a public-interest action-intelligence product

That is a better fit for:
- journalists
- community groups
- residents near controversial projects
- watchdog / advocacy workflows

And it uses the repo’s strongest differentiated asset already in progress:
- CID procedural data that most people do not aggregate well.
