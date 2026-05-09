# Smartphone colorimetry for broad-scale water-quality screening

> Scope: explore whether Atlas TX should eventually ingest smartphone-based field readings as a separate, clearly non-regulatory layer. This is a research/design note, not a commitment for v1.

---

## 1. Bottom line

Smartphone colorimetry is promising for broad-scale screening when the goal is:
- low-cost distributed sampling
- coarse concentration bands or threshold alerts
- rapid triage into "normal / re-sample / lab confirm"
- community, utility-tech, NGO, or school-network data collection

It is weak when the goal is:
- regulatory compliance
- trace-level contaminant quantification
- analytes that need LC-MS/MS, GC-MS, ICP-MS, fluorescence, or microbiology culture/PCR
- cross-device comparability without standardized optics and QA

The right framing for Atlas TX is:

1. regulatory/public-record data remains the core signal
2. smartphone readings, if ever added, become a separate community-observation layer
3. every community reading carries explicit caveats: non-regulatory, user-collected, image-derived, confidence-scored

That keeps the product aligned with existing guardrails: burden/exposure/observation, not harm or compliance claims.

---

## 2. What smartphone colorimetry actually is

A field assay produces a visible color change. A smartphone camera captures that color under constrained conditions. Software maps image features to a semi-quantitative or quantitative estimate.

Basic pipeline:
1. collect water sample
2. add reagent or dip strip
3. wait defined incubation time
4. place sample in fixed capture geometry
5. image sample plus color reference
6. normalize for lighting/device variation
7. estimate concentration band or value
8. apply QA rules and confidence scoring

This is not "take a random photo of water." The real system is chemistry + optics + workflow + calibration + QA.

---

## 3. Best-fit analytes

Strongest candidates for broad deployment:
- nitrate / nitrite
- phosphate
- ammonia
- free chlorine / total chlorine
- iron
- manganese
- copper
- pH with indicator chemistry
- alkalinity / hardness with color-strip style chemistry

Possible but more fragile:
- turbidity proxies using fixed imaging geometry
- microbiology proxy assays that end in visible color change
- multi-pad strip interpretation for household screening

Poor fit / out of scope:
- PFAS
- VOCs
- pesticide panels without specialized chemistry
- ultra-low-level lead or arsenic quantification at strict regulatory thresholds
- pathogen identification requiring culture, qPCR, or microscopy

Practical lesson: broad-scale smartphone systems work best where the assay already has a strong visible response and where decisions can be threshold-based rather than precision-first.

---

## 4. Why most smartphone water-testing ideas fail

Failure modes are usually boring, not scientific:
- inconsistent illumination
- phone-specific image processing
- auto white balance drift
- auto exposure drift
- focus blur
- glare and reflections
- variable strip placement
- dirty cuvettes or bubbles
- user timing mistakes
- reagent lot drift
- matrix effects from real-world water samples

The camera is rarely the only issue. The bigger issue is uncontrolled end-to-end measurement conditions.

So the design principle is simple:

Do not try to make arbitrary consumer photos scientific.
Make the measurement system constrained enough that the phone becomes one component in a controlled instrument.

---

## 5. Target-state architecture for broad scale

If Atlas TX ever explores this seriously, the target state should be designed for massive growth up front rather than hacked together from ad hoc uploads.

### 5.1 Capture hardware

Preferred hardware stack:
- clip-on cradle, foldable dark box, or rigid mini-reader
- fixed phone-to-sample distance
- fixed sample holder geometry
- enclosed illumination with known LED characteristics
- integrated neutral / color reference patch in frame
- alignment guides that make off-axis capture hard

Priority order:
1. repeatability
2. cheap manufacturability
3. compatibility across common phone models
4. packability for field distribution

Avoid as a primary design:
- open-air capture in ambient lighting
- freehand strip photos on arbitrary backgrounds
- workflows that depend on the user choosing a good angle

### 5.2 Mobile capture workflow

The app should constrain the operator heavily:
- guide sample type and assay selection
- force a countdown for incubation timing
- perform pre-capture framing checks
- detect insufficient light, blur, glare, shadows, or underfill
- capture highest-quality image possible; RAW/DNG where supported
- store device model, app version, timestamp, GPS, reagent lot, operator ID
- require pass/fail capture validation before upload

The user experience should aim for valid first-time capture in under 2 minutes.

### 5.3 Chemistry layer

Design criteria for chosen assays:
- strong monotonic visible response
- low sensitivity to small timing errors
- stable field packaging and shelf life
- narrow interference profile or known correction factors
- simple sample prep
- clear blank/control workflow

For scale, one analyte done well beats a brittle multi-analyte kit.

### 5.4 Calibration and normalization

Minimum architecture:
- assay-specific calibration curves
- blank correction
- reference-patch normalization in every frame
- device-family correction tables if needed
- concentration estimate plus confidence score
- category mapping such as low / moderate / elevated / urgent

Do not rely on raw RGB thresholds alone. Use a calibrated feature pipeline.

### 5.5 QA/QC engine

The hard requirement is automated rejection of bad data.

QA checks should include:
- blur detection
- saturation clipping
- glare detection
- sample region fill level
- visible bubbles / debris
- timing window compliance
- out-of-distribution color check
- impossible chemistry progression check
- duplicate-reading agreement
- periodic known-control checks

Every reading should end in one of four states:
- accepted
- accepted with warning
- rejected and re-capture requested
- rejected and lab confirmation recommended

### 5.6 Cloud decision layer

A scalable backend should not only store readings; it should classify operational next steps.

Per reading, generate:
- analyte estimate or band
- confidence score
- quality flags
- explanation of limitations
- escalation action

Per geography, generate:
- anomaly clusters
- repeat exceedances
- trend shifts
- participation coverage gaps
- agreement/disagreement with public-record regulatory data

### 5.7 Atlas TX integration layer

If ever integrated, keep community smartphone readings isolated from core regulatory scoring.

Recommended product separation:
- Layer A: regulatory/public-record risk surfaces (SDWIS, EJScreen, TCEQ, ACS)
- Layer B: community observation overlay from smartphone field assays
- Layer C: optional lab-confirmed community samples

Rules:
- Layer B never overwrites Layer A
- Layer B is visually and textually labeled non-regulatory
- summaries distinguish "public-record risk" from "community field observations"
- journalistic outputs cite which layer each claim comes from

---

## 6. Recommended analytics pipeline

Image-analysis pipeline:
1. identify assay type and expected ROI layout
2. detect sample region(s)
3. detect reference patch / blank region
4. normalize color against in-frame reference
5. transform features into robust color space (Lab, HSV, ratios)
6. compute summary features across the ROI
7. perform blank subtraction or control comparison
8. apply assay calibration model
9. emit value/band + confidence
10. run QA policy and escalation rules

Useful feature families:
- channel ratios
- CIE Lab values
- hue and saturation statistics
- delta from blank/control
- spatial uniformity measures across the ROI

Start with classical calibration before ML.

---

## 7. Classical models first, ML second

Preferred order of sophistication:

1. linear / log-linear calibration
2. polynomial or piecewise calibration
3. ratio-based regression in calibrated color spaces
4. ML for image-quality classification
5. ML for device normalization/domain adaptation
6. only later: ML for concentration prediction if classical models underperform

Why this order:
- classical models are easier to validate
- regulators, utilities, and journalists can understand them
- they make failure analysis easier
- they reduce the chance of hidden device bias

Machine learning is most useful early for QA/rejection, not for replacing the chemistry model.

---

## 8. Validation plan

A serious program needs staged validation before any public claims.

### Phase 1 — bench chemistry validation
- same water matrix
- same phone
- same reader hardware
- repeated measurements across concentration range
- compare against reference laboratory method

Outputs:
- LoD / LoQ estimates where relevant
- bias
- precision / coefficient of variation
- usable concentration range

### Phase 2 — device variation study
- multiple phone brands/models
- same assay and reader
- quantify inter-device drift
- determine whether device-family calibration is mandatory

### Phase 3 — operator variation study
- trained vs untrained users
- first-time user completion rate
- invalid-capture rate
- effect of timing and handling mistakes

### Phase 4 — field matrix study
- tap water
- groundwater
- surface water
- chlorinated vs non-chlorinated systems
- high-iron/high-hardness and other interference-heavy matrices

### Phase 5 — operational pilot
- real-world deployment with target user cohort
- subset of samples confirmed by lab reference methods
- false-alarm and false-miss characterization
- operational cost per valid reading

Key metrics:
- agreement with reference method
- threshold sensitivity/specificity
- invalid image rate
- duplicate-measurement agreement
- time to valid result
- cost per accepted result

---

## 9. Deployment models

### A. Citizen science / household network
Pros:
- maximum coverage
- strong storytelling/community participation

Cons:
- highest variance
- most QA rejections
- weakest legal/operational trust

Best output style:
- bands and alerts, not precise numbers

### B. Trained field-tech network
Pros:
- better repeatability
- stronger operational value
- easier quality management

Cons:
- lower reach than citizen collection

Best use cases:
- NGOs
- watershed groups
- utility field crews
- school districts with trained staff

### C. Hybrid sentinel model
Pros:
- scalable and credible
- combines wide screening with lab confirmation

Pattern:
- many low-cost field readings
- smaller lab-confirmed subsample
- escalation logic for hotspots

This is the strongest long-term operating model.

---

## 10. Product positioning for Atlas TX

The most credible positioning would be:

"Atlas TX may eventually support community field-observation layers for broad screening, but regulatory/public-record datasets remain the authoritative foundation for water-risk reporting."

Good use cases if Atlas TX ever extends here:
- rural well-owner screening campaigns
- school/community watershed monitoring
- post-flood rapid screening
- chlorine residual spot checks in distributed systems
- NGO-led sampling around already-flagged areas

Bad positioning:
- "Atlas TX lets anyone prove their water is safe"
- "Atlas TX replaces lab testing"
- "Atlas TX can diagnose contamination from a phone photo"

---

## 11. Suggested v2 roadmap, if we ever pursue it

### Stage 0 — stay research-only
- keep this note internal
- do not expose smartphone uploads in product
- collect target analyte hypotheses and user workflows

### Stage 1 — one-analyte prototype
Recommended first analytes:
- nitrate
- free chlorine
- phosphate
- iron

Deliverables:
- one assay
- one capture box
- one image-processing pipeline
- one validation dataset
- one threshold-based output

### Stage 2 — pilot overlay
- invite trained pilot users only
- render results in a separate map layer
- attach strong confidence and caveat labels
- compare pilot observations with existing Atlas TX regulatory risk surfaces

### Stage 3 — lab-confirmed escalation loop
- add mail-in or partner-lab confirmation for selected readings
- measure whether community readings help surface real under-monitored areas

Only after Stage 3 should Atlas TX decide whether broader public participation is worth the trust and operational burden.

---

## 12. Recommendation

For Atlas TX v1: do not build smartphone colorimetry into the shipped product.

For Atlas TX strategy: keep it as a possible v2/community-data lane with these non-negotiables:
- constrained capture hardware
- threshold-first outputs
- automated QA rejection
- explicit non-regulatory labeling
- partial lab confirmation workflow
- strict separation from the core public-record risk score

That path preserves credibility while leaving room for a differentiated long-term community sensing layer.

---

## 13. References / products to verify before citing externally

Starting points worth checking at citation time:
- AKVO Caddisfly official platform page + instruction pages
- WaterScope official product/technology pages
- Hach portable colorimeter pages and any official mobile/app workflow documentation if it exists
- Texas Stream Team official pages (Meadows Center + TCEQ)
- Texas A&M AgriLife Extension water-quality pages and soil/water lab pages
- EPA and USGS field-method guidance for sample handling
- peer-reviewed literature on smartphone colorimetry for nitrate, phosphate, chlorine, and heavy metals

As with the broader sampling memo, re-fetch all URLs and product claims before external publication.

---

## 14. Live verification findings from this repo session

This pass did verify some of the previously flagged unknowns.

### Product/platform findings

1. AKVO Caddisfly
- Verified live from AKVO's official platform page and AKVO-hosted instruction pages.
- Official materials describe Caddisfly as a water-quality testing app that works with Flow in remote/off-grid settings.
- AKVO-hosted instructions explicitly show a striptest workflow and list multiple water analytes, including ammonium, arsenic, chloride, chlorine / hardness / alkalinity / pH, nitrate / nitrite, phosphate, and total iron.
- This is a valid example of smartphone-assisted color/strip analysis.

2. WaterScope
- Verified live from WaterScope's official website.
- Official materials describe a smart water-testing system with app/dashboard upload and bacterial testing workflows.
- The verified workflow is centered on membrane filtration, incubation, and digital result capture/analysis.
- Important nuance: this is adjacent to the smartphone-colorimetry theme, but it is not the same thing as a simple strip-plus-camera colorimetric workflow.

3. Hach
- Official Hach pages were verified live for portable instruments and portable colorimeters.
- This verification supports the claim that Hach is strong in portable photometric water-testing hardware.
- This pass did not find a clearly documented official Hach smartphone-colorimetry workflow comparable to AKVO Caddisfly.
- Therefore Hach should be described here as a relevant adjacent portable-photometer vendor, not as a confirmed smartphone-colorimetry example unless a stronger official citation is found.

### Texas program findings

4. Texas Stream Team
- Verified live from the Meadows Center / Texas State University page and the TCEQ program page.
- Official pages support describing Texas Stream Team as a statewide volunteer/community-science water-monitoring network.
- Verified signals include 30 years of citizen science, electronic monitoring forms, and TCEQ language describing statewide volunteer monitoring coordinated through partners and community scientists.
- This makes Texas Stream Team a credible example of an existing Texas field-monitoring channel, though not specifically a smartphone-colorimetry program.

5. Texas A&M AgriLife
- Verified live from the AgriLife Extension water-quality topic page and the Soil Testing Lab water-testing page.
- Official pages support describing AgriLife as having a statewide water-quality education/program network and lab-linked water-testing resources.
- The Soil Testing Lab water page specifically frames submissions for non-drinking-water purposes such as irrigation, troubleshooting domestic water issues, livestock, aquaculture, and similar uses.
- This pass did not verify AgriLife as an existing smartphone-assisted community-monitoring network for water colorimetry.

Bottom line from the live pass:
- AKVO Caddisfly remains a solid smartphone-colorimetry example.
- WaterScope is better described as an adjacent digital water-testing platform than as a clean strip-colorimetry analogue.
- Hach should be downgraded from "smartphone workflow example" to "portable photometry vendor unless stronger evidence appears."
- Texas Stream Team is a real statewide volunteer-monitoring channel.
- AgriLife is a real statewide education/lab channel, but not yet verified here as a smartphone field-sensing network.

---

## 15. Honest gaps in this memo

This note is still strategic and synthetic. It is not yet a complete verified market scan.

Known gaps that should still be stated plainly:
- The product verification pass was lightweight and web-based; it did not include hands-on app installation, export testing, hardware setup, or documentation diffing by version/date.
- We still have not verified detailed capability matrices for AKVO Caddisfly, WaterScope, or any Hach mobile workflow: export formats, calibration controls, supported phone models, QA features, offline behavior, and maintenance status all remain open.
- Texas Stream Team and AgriLife were verified as real Texas channels, but we have not mapped whether they are realistic pilot partners for Atlas TX specifically.
- The memo still does not contain a Texas-specific operator/distribution map showing who would actually run a trained-field-tech pilot.
- No pricing, procurement, shelf-life, or reagent-supply analysis has been done yet.
- No side-by-side literature table has been assembled yet comparing analytes, limits of detection, phone models, and validation quality.

Operational rule: treat this document as a framing memo for angle exploration, not as a build-ready implementation spec.

---

## 16. Open questions to research before Angle B becomes a plan

Before any trained-field-tech / community-sensing angle becomes an actual Atlas TX plan, answer these with live research and citations:

1. Product verification
- What do AKVO Caddisfly, WaterScope, and Hach actually support today?
- Which analytes, workflows, export formats, calibration features, and hardware dependencies are confirmed, not inferred?

2. Texas deployment channels
- Which Texas programs already have volunteer or technician sampling networks?
- Are Texas Stream Team, AgriLife, watershed alliances, rural water associations, school districts, or NGOs realistic pilot partners?
- Which of those groups already use smartphone-assisted field measurements versus paper strips or benchtop kits?

3. Assay fit for Texas use cases
- Which analytes matter most for likely Texas community-screening scenarios: nitrate, chlorine residual, iron, manganese, phosphate, hardness, or something else?
- Which of those can tolerate realistic field handling in heat, transport, and uneven operator skill?

4. Trust and governance
- Who is allowed to act on a community reading?
- What disclaimers are necessary so journalists, residents, and local officials do not mistake field observations for compliance determinations?
- What escalation path to lab confirmation is operationally realistic in Texas?

5. Economics and logistics
- What is the true cost per valid reading after consumables, QA rejection, shipping, and support?
- Is clip-on hardware feasible, or does the economics force a strip-only workflow?

6. Validation burden
- What reference methods and comparison datasets would be required to make even threshold-level public claims?
- How much device-specific calibration work is needed across common Android and iPhone models?

7. Atlas TX product fit
- Does a community-observation layer improve the core newsroom/investigator product, or does it distract from the stronger regulatory-data story?
- Would this become a separate pilot product rather than a native Atlas TX feature?

Until these questions are answered, Angle B should remain research-only.

---

## 17. v1 prototype (2026-05-09)

Despite the v1 recommendation in §12, a **Stage 1 prototype** has been built on
branch `cross/citizen-strips-prototype`. Lives entirely behind `/citizen` and
is strictly isolated from the regulatory data stack per
`docs/contracts/dataset-registry.md` (contract 0.7.0).

What this prototype does satisfy from the §5 non-negotiables:
- **Layer separation (§5.7)**: own page, own DB table (`WaterObservation`), no
  contribution to DWRS / EJ / APD / mismatch scorers. Contract enforces this.
- **Threshold-first outputs**: per-analyte band labels, never numeric units.
- **Automated QA rejection**: server-side blur / low-light / saturation-clip
  via sharp, plus LLM `no-chart-detected` flag. Decision logic in
  `src/lib/observations/status.ts` always lands in one of accepted /
  accepted_warn / review / rejected.
- **In-frame reference chart guidance (§6.3)**: capture UX requires the user
  to lay the strip beside its bottle's chart in the photo. Server vision pass
  grades against the in-frame chart, not absolute color memory.
- **Hybrid analysis (§7)**: classical CIE Lab ΔE76 client reading first;
  Claude Opus vision is the second-pass sanity check. Disagreement marks the
  observation `review` rather than auto-accepting.
- **Explicit non-regulatory labeling**: every result card and the page banner
  carry the disclaimer.

What this prototype intentionally does NOT satisfy yet:
- **Constrained capture hardware (§5.1)**: freehand smartphone capture only.
  No clip-on cradle / dark box. Lighting variance is the dominant accuracy
  risk.
- **Calibration curves with vendor citations (§5.4)**: the bundled
  `generic-9pad-v0` chart uses uncalibrated visual approximations. Marked
  `version: 0` so any uplift to a citable kit datasheet is a visible bump.
- **Device-family correction tables (§5.4)**: none.
- **Lab-confirmation escalation (§5.5)**: not wired. Users see bands and a
  caveat; there is no mail-in or partner-lab loop.
- **Operational rate-limits / abuse moderation**: anon uploads are accepted
  with a sha256 dedupe and a size cap; no per-IP rate limit or moderation
  queue. Acceptable for a single-dev box; not acceptable for a public deploy.
- **Validation studies (§8)**: none. Treat the prototype as a UX/architecture
  fixture, not a data source for any external claim.

The prototype's purpose is to make the *architecture* concrete (DB schema,
hybrid analysis pipeline, status decision logic, isolation contract) so that
when the project decides whether to invest in the real Stage 1 deliverables
(constrained hardware, calibrated chart, validation) those investments land on
existing scaffolding instead of greenfield.

Removal path: `cross/citizen-strips-prototype` is the only branch in scope.
Reverting it removes `/citizen`, the `WaterObservation` table, the Anthropic
SDK dependency, and the contract's 0.7.0 entry, leaving the regulatory stack
untouched.