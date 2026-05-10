# Atlas Missions — design memo

_Date: 2026-05-09_

## Summary

Atlas Missions is the future participatory layer for Atlas TX.

Atlas TX already uses official public data to identify places where water-risk signals, environmental context, and operational stress may deserve closer scrutiny. Atlas Missions extends that model by turning anomaly detection into structured field verification.

The core idea is simple:

> Atlas finds the anomaly. The community investigates it.

This memo defines the product stance, design principles, mission system, reward model, trust model, and recommended rollout order for that future layer.

---

## 1. Product stance

Atlas Missions should not be a generic citizen-science app, social feed, or random upload surface.

It should be:
- mission-driven,
- place-based,
- evidence-oriented,
- and anchored to the existing Atlas TX water-risk thesis.

The product role is:
- identify where official records suggest a lead,
- direct people to verify or challenge that lead,
- collect useful observations with structured metadata,
- and turn those observations into reporter-usable evidence.

### What Missions is

- a field-verification system
- a structured community evidence layer
- a way to improve spatial and temporal coverage around real anomalies
- a bridge between public records and local conditions

### What Missions is not

- a replacement for regulatory or official monitoring
- a leaderboard for upload volume
- a generic “post your reading” app
- a way to silently merge user data into core water-risk scoring

---

## 2. Strategic fit with Atlas TX

Atlas TX is water-first.

That remains true even after Missions exists.

The future stack should be:
1. authoritative public-record water intelligence
2. official explanatory context, especially weather and hydrology
3. community/observational evidence via Missions
4. later additive layers such as hobbyist weather networks or ecology/sentinel workflows

Missions should strengthen the product by helping distinguish:
- chronic structural stress,
- short-run trigger pressure,
- and incomplete or contradictory official pictures.

That means the best Missions tasks are not random sampling requests. They are targeted responses to:
- anomalies,
- storms,
- drought episodes,
- under-sampled watersheds,
- repeated notices,
- and reporter-driven verification needs.

---

## 3. Core design principles

### 3.1 Water-first

The first Missions workflows should stay tightly connected to the water story:
- post-storm water checks
- repeat tap-water strip checks
- creek / reservoir edge observations
- overflow-adjacent condition checks

### 3.2 Reward quality over quantity

A low-volume, high-confidence contributor should be more valuable than a high-volume spammer.

### 3.3 Tie tasks to real places and real reasons

Every mission should answer:
- why here?
- why now?
- why this observation?

### 3.4 Keep evidence classes distinct

Official public-record risk, official explanatory context, and community observations must remain visibly separate in code and product UX.

### 3.5 Make repeat observations first-class

Repeatability is one of the most valuable forms of community contribution.

### 3.6 Optimize for journalists and serious local observers

The system should be legible to residents, but the output should remain useful for investigative or public-interest workflows.

---

## 4. User roles

### Residents

Role:
- contribute low- to medium-structure field evidence
- verify post-storm or local anomaly conditions
- document visible environmental changes

Likely tasks:
- strip-based tap or surface-water screening
- local flooding confirmation
- photo + notes
- repeat visits to the same site

### Journalists

Role:
- use Missions to strengthen leads
- request or follow-up on anomaly verification
- assemble evidence packs for stories

Likely tasks:
- review mission results
- perform their own higher-value field missions
- compare official signals to field context

### Trusted field contributors

Role:
- produce higher-confidence, repeatable observations
- complete more disciplined monitoring tasks
- serve as a bridge between broad participation and reliable evidence

Likely tasks:
- repeated same-site checks
- event response missions
- anomaly verification missions

### Future weather contributors

Role:
- provide localized weather or flood context later
- help validate rainfall/storm footprint gaps

This role should come later, after the water-first mission layer is stable.

---

## 5. Mission model

Atlas Missions should be generated from rule-based conditions tied to the core Atlas platform.

### Mission sources

1. Atlas anomaly detection
2. official weather / hydrology events
3. spatial coverage gaps
4. repeat-monitoring schedules
5. future reporter/admin-defined mission requests

### Initial mission types

#### A. Post-storm verification

Use when:
- heavy rainfall
- flood or flash-flood warnings
- hydrologic event windows
- overflow pressure overlaps with weather context

Goal:
- determine whether short-run conditions may have changed water stress or local exposure context

#### B. Anomaly verification

Use when:
- county/PWS patterns do not line up cleanly
- official records suggest a lead that needs field context

Goal:
- help determine whether the anomaly is visible, repeated, or worth escalation

#### C. Repeat monitoring

Use when:
- the same site should be checked again over time
- post-event recovery or persistence matters

Goal:
- distinguish one-off observations from persistent local patterns

#### D. Coverage-gap missions

Use when:
- a county or watershed lacks recent community evidence

Goal:
- improve map completeness and future confidence

---

## 6. Submission model

The first supported submission types should be narrow and structured.

### Water observation

Recommended fields:
- observation type
- analyte
- unit or banded value
- timestamp
- location
- photo
- notes
- workflow metadata
- confidence metadata

### Weather / flood confirmation

Recommended fields:
- rainfall / flooding observed?
- time window
- photo or note
- location
- optional severity text

### Environmental context note

Recommended fields:
- odor, discoloration, algae/scum, visible runoff, clarity
- photo
- notes
- location
- time

The system should prefer structured rows, not freeform text alone.

---

## 7. Gamification model

Gamification should feel like fieldwork and contribution, not toy engagement.

### Good mechanics

- missions
- badges
- trust tiers
- repeat-monitor streaks
- watershed/county coverage goals
- corroboration bonuses
- evidence-pack contributions

### Bad mechanics

- upload-count leaderboards
- random points for inactivity-breaking check-ins
- public like/follow systems as the primary reward
- noisy “coin” economies disconnected from evidence quality

### Recommended progression ladder

1. Observer
2. Sampler
3. Repeat Monitor
4. Watershed Scout
5. Trusted Verifier
6. Community Lead

This progression should be earned through quality, reliability, and repeatability.

---

## 8. Trust model

Trust is the core safety mechanism of Missions.

Every observation should have:
- an observation-quality signal
- a contributor trust signal
- a story-relevance signal

### Trust should increase with

- complete metadata
- location precision
- guided workflow compliance
- photo evidence
- repeat-site consistency
- corroboration by other observations
- low rejection rate over time

### Trust should decrease with

- incomplete submissions
- implausible or inconsistent values
- repeated low-quality behavior
- obvious spam or duplication

The trust model is what keeps Missions from becoming noise.

---

## 9. Evidence packs

One of the highest-value outputs of Atlas Missions is the evidence pack.

An evidence pack should combine:
- official records
- weather/hydrology context
- community mission submissions
- photos and notes
- trust/confidence summaries
- repeat-observation timelines

Use cases:
- reporter workflow
- county anomaly review
- post-storm dossier
- public-interest briefing

This is the ideal downstream product form because it turns scattered observations into something coherent and useful.

---

## 10. Recommended rollout order

### Phase 0 — current Atlas baseline

- official water-risk intelligence
- official explanatory weather/hydrology context
- reporter-first anomaly logic

### Phase 1 — mission framework

Launch with:
- post-storm verification missions
- anomaly-verification missions
- guided water strip/photo/note submissions

### Phase 2 — trust and repeatability

Add:
- stronger contributor trust tiers
- repeat-monitor missions
- corroboration logic
- evidence-pack output

### Phase 3 — broader field network

Add:
- watershed teams
- journalist/admin mission tooling
- more structured contributor roles

### Phase 4 — later expansion

Potential later additions:
- hobbyist weather participation
- additive ecology missions
- richer trained-volunteer workflows

---

## 11. Strongest first mission concept

If Atlas Missions launches with one narrow, compelling use case, it should be:

> Post-storm anomaly verification

Why:
- easy to explain
- ties water and weather together cleanly
- mission urgency is natural
- useful for journalists
- supports repeat checks
- aligns with the current research focus on separating persistence from trigger pressure

---

## 12. Product thesis

Atlas Missions should extend Atlas TX from a platform that reads official records into a platform that organizes structured public-interest verification.

A concise statement:

> Open data gives the baseline. Missions create the field network. Trust turns participation into evidence.
