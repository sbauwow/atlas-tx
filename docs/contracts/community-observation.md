# Contract Draft — Community Observation Layer

> Draft status: future/additive contract. Not active for default scoring. Do not treat this document as permission to merge community observations into Atlas TX core risk outputs.

Purpose: define a safe future landing zone for community-collected observations such as Android color-strip readings, reporter-submitted field notes, and later trusted volunteer observations.

This contract exists so Atlas TX can accept distributed observational evidence without weakening the project’s public-record water-risk spine.

---

## Product stance

Community observations are:
- screening inputs
- lead-generation signals
- repeat-observation evidence
- reporter/community context

Community observations are not:
- regulatory truth
- direct replacements for agency monitoring
- silent modifiers of default risk scores
- grounds for medical, legal, or causal claims

Rule:

> Public-record risk and community observation must remain distinguishable in both code and UX.

---

## Evidence class

Community observation is a third evidence class alongside:
1. authoritative public-record data
2. official explanatory context
3. community/observational data

The UI, API, and MCP layers should preserve that distinction.

---

## Initial intended source types

Near-term likely sources:
- Android color-strip observations
- reporter field observations
- trained pilot user submissions

Possible later sources:
- school/watershed volunteer networks
- partner NGO field kits
- manual ecology observations
- validated hobbyist sensor reports

Out of scope for this contract version:
- fully automated private weather station ingest
- laboratory LIMS integration
- continuous unattended IoT sensor ingestion at production scale

---

## Canonical row shape

Recommended file home when implemented:
- `src/lib/datasets/community-observations.ts`

Recommended normalized type:

```ts
export type CommunityObservationRow = {
  observationId: string;
  observationType: "color-strip" | "field-note" | "photo" | "manual-sample" | "other";
  sourceProgram: "atlas-android" | "reporter-submission" | "pilot-network" | "partner-network" | "unknown";

  observedAt: string;
  submittedAt: string;

  location: {
    latitude: number | null;
    longitude: number | null;
    countyName: string | null;
    countyFips: string | null;
    watershedId: string | null;
    placeLabel: string | null;
  };

  sampleTarget: {
    targetType: "tap" | "surface-water" | "reservoir" | "creek" | "outfall-adjacent" | "unknown";
    sourceDescription: string | null;
  };

  method: {
    deviceClass: "android-phone" | "manual-entry" | "unknown";
    assayType: string | null;          // e.g. nitrate strip, chlorine strip
    assayBrand: string | null;
    incubationSeconds: number | null;
    captureMode: "guided" | "unguided" | "manual-only" | "unknown";
    calibrationReferencePresent: boolean | null;
  };

  analyte: {
    name: string;                      // nitrate, chlorine, pH, etc.
    unit: string | null;               // ppm, mg/L, pH units, category only
    rawValue: number | null;
    bandedValue: "low" | "normal" | "elevated" | "high" | "unknown" | null;
  };

  evidence: {
    photoUrl: string | null;
    photoHash: string | null;
    notes: string | null;
  };

  confidence: {
    score: number;                     // 0-100
    band: "low" | "medium" | "high";
    reasons: string[];
  };

  review: {
    status: "unreviewed" | "screened" | "flagged" | "trusted" | "rejected";
    reviewerType: "auto" | "human" | "mixed" | "none";
  };

  caveats: string[];
  raw: Record<string, unknown>;
};
```

---

## Derived summary shapes

Community rows should not be mixed directly into DWRS or mismatch scores.
Instead, derive separate observation summaries.

Recommended summary shape:

```ts
export type CommunityObservationSummaryRow = {
  geographyId: string;                 // county FIPS, watershed id, or PWS id if later supported
  geographyType: "county" | "watershed" | "pws";
  observationCount: number;
  analyteCounts: Record<string, number>;
  elevatedObservationCount: number;
  latestObservedAt: string | null;
  confidenceWeightedSignal: number | null;
  caveats: string[];
};
```

Purpose:
- help reporters see if a place has repeated screening signals
- help Atlas identify where community observations may justify follow-up
- preserve separation from official risk ranks

---

## Confidence model requirements

Every community observation needs an explicit confidence model.

Minimum factors:
- guided vs unguided capture
- valid timestamp present
- location precision present
- assay metadata complete
- reference/calibration present
- image quality acceptable if image-derived
- duplicate/repeat submission detection
- known device/workflow compatibility

Recommended first rule:
- prefer banded outputs over fake numeric precision

Examples:
- "elevated nitrate screening result"
- "high chlorine residual band"
- not: "3.742 ppm" unless the workflow truly supports that precision

---

## UX / API guardrails

Must do:
- label as community observation, field screening, or reporter submission
- show confidence and caveats
- keep separate from authoritative public-record summaries
- make clear whether a row was human-reviewed

Must not do:
- merge into default county/PWS risk rank without an explicit later plan
- present as confirmed contamination
- imply official regulatory action should follow automatically
- hide provenance

Recommended user-facing phrasing:
- "community field observation"
- "screening result"
- "not a regulatory measurement"
- "follow-up recommended if repeated or corroborated"

---

## MCP / agent behavior guardrails

When this layer eventually reaches MCP/skill surfaces:
- always surface caveats verbatim
- distinguish observation from official record clearly
- do not answer community-observation questions as if they were agency monitoring findings
- prefer wording like:
  - "community screening suggests"
  - "field observations indicate"
  - "this is an unverified or semi-verified observational signal"

Do not say:
- "the water is contaminated"
- "this proves"
- "this confirms"

---

## First supported MVP path

The first intended product path is:
- Android app as the MVP color-strip platform
- constrained capture workflow
- selected analytes only
- explicit confidence scoring
- county/watershed aggregation as a secondary overlay

Recommended first analytes:
- nitrate
- chlorine residual
- pH
- hardness/alkalinity
- iron or manganese if the assay workflow proves reliable

Not first:
- PFAS
- bacteria claims from color strips alone
- trace heavy-metal precision claims
- any analyte whose consumer-strip workflow is too noisy to defend

---

## Relationship to hobbyist weather

Community observation and hobbyist weather are related but distinct.

Community observation examples:
- Android strip result
- reporter note about odor/discoloration
- photographed algae bloom

Hobbyist weather examples:
- neighborhood rainfall station
- temperature/dewpoint from a private station
- hyperlocal storm timing

They may eventually coexist, but they should not share a contract unless the platform first proves that the provenance/confidence models are compatible.

---

## Activation criteria

Before this contract becomes active implementation guidance, Atlas TX should first have:
1. stable official weather-normalized water summaries
2. mismatch logic grounded in public-record data
3. clear product language separating authoritative and observational evidence
4. a decision to ship the Android color-strip MVP as an additive layer

Until then, this contract is a future guardrail, not an execution order change.
