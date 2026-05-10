# Android Missions — sample mobile flow

_Date: 2026-05-09_

## Summary

This document sketches a future Android app flow for Atlas Missions.

The design goal is to make field verification feel simple and guided for residents while still producing structured, trustworthy observations that are useful to journalists, researchers, and future evidence-pack workflows.

This is not a generic social upload flow. It is a mission-driven field workflow.

---

## 1. Core UX principles

### 1.1 Start with a reason

Every mission should explain:
- why this place matters
- why this task matters
- why now matters

### 1.2 Keep fieldwork simple in the moment

In the field, users should not face dense forms first. The flow should front-load:
- mission context
- simple checklist steps
- guided capture

### 1.3 Make quality visible

Users should understand that:
- complete metadata improves trust
- photos help corroboration
- repeat visits are highly valuable
- missing steps reduce confidence

### 1.4 Distinguish observation from conclusion

The app should never imply that a strip reading or observation proves contamination. It should frame results as screening or verification evidence.

---

## 2. Primary navigation

Suggested primary tabs:
- Missions
- Map
- Submit
- Activity
- Profile

### Missions
Home for available and active missions.

### Map
Spatial view of nearby missions, anomaly zones, and completed observations.

### Submit
Quick path for structured submission if a user is already on-site.

### Activity
Past missions, pending review, corroboration status, and evidence contributions.

### Profile
Trust tier, badges, completed missions, streaks, and settings.

---

## 3. Main user flows

## Flow A — accept a mission from the Missions tab

### Screen 1: Missions Home

Sections:
- Nearby missions
- Time-sensitive missions
- Under-sampled places
- Repeat-monitor reminders

Each card shows:
- title
- county/watershed
- why it matters
- urgency/time left
- difficulty
- reward/trust impact

Example card:
- Post-Storm Verification
- East Travis Creek
- Heavy rainfall + overflow pressure may have changed local conditions
- Ends in 36 hours
- Reward: Storm Responder + Trust Bonus

Primary actions:
- View mission
- Save
- Accept

### Screen 2: Mission Detail

Sections:
1. Why this matters
2. What to collect
3. Required steps
4. Optional follow-up steps
5. Safety notes
6. Reward / trust impact
7. Map / route context

Primary CTA:
- Start mission

Secondary CTA:
- Save for later

### Screen 3: Mission Checklist

Example checklist:
- confirm you are near the site
- capture one water reading
- take one site photo
- add notes on clarity / odor / flow
- submit location + time

Optional:
- revisit after 24–48 hours

UX note:
This screen should feel like a field checklist, not a survey.

---

## Flow B — guided water observation submission

### Screen 1: Confirm location

Inputs:
- current GPS
- manual correction if needed
- optional named place/site label

Display:
- county
- watershed if available
- mission area confirmation

Primary CTA:
- Confirm location

### Screen 2: Observation type

Choices:
- Water strip reading
- Photo + notes only
- Flood / rainfall confirmation
- Other field note

For Android MVP future path, “Water strip reading” is the key branch.

### Screen 3: Guided water-strip capture

Inputs and prompts:
- choose analyte
- choose strip/assay type
- follow timer/incubation guidance if needed
- capture image or enter guided result
- attach strip photo

Important UX:
- show a short explanation that this is a screening workflow
- avoid overstating precision
- prefer category/banded output where appropriate

### Screen 4: Site context

Questions:
- tap or surface water?
- visible runoff?
- unusual color?
- odor?
- flooding nearby?
- additional notes?

Primary CTA:
- Continue

### Screen 5: Review confidence checklist

Show:
- location captured
- timestamp captured
- photo attached
- analyte selected
- notes present or absent
- repeat visit recommended or not

The app should show users how confidence is built, for example:
- Good: location confirmed
- Good: photo attached
- Missing: repeat visit not yet completed

### Screen 6: Submit

Submission state:
- submitted
- under review
- mission contribution recorded

Immediate feedback:
- mission progress updated
- trust impact preview
- optional suggestion for nearby follow-up mission or repeat visit

---

## Flow C — quick weather/flood confirmation

This is the likely later bridge to community weather participation.

### Screen 1: Select weather confirmation mission

Possible prompts:
- Confirm flooding here
- Record visible storm impact
- Confirm heavy rainfall effects

### Screen 2: Capture evidence

Inputs:
- photo
- note
- simple structured options such as:
  - standing water observed
  - roadway flooding observed
  - creek visibly elevated
  - no visible flooding

### Screen 3: Submit and link to mission

Outputs:
- contribution added to event mission
- trust/confidence note
- possible request for follow-up observation later

---

## Flow D — repeat monitoring

Repeatability is one of the highest-value loops.

### Trigger

User receives:
- “Return to this site in 24 hours”
- “Complete day 3 of 7-day monitoring”
- “Conditions changed after rainfall — revisit if possible”

### Repeat mission screen

Show:
- prior observation summary
- map to prior location
- what to repeat exactly
- what changed since last time, if known

Submission difference:
- emphasize same-site consistency
- compare previous and current evidence

Reward difference:
- stronger trust gain than one-off uploads

---

## 4. Profile and reputation screens

## Profile overview

Show:
- trust tier
- level
- badges
- missions completed
- repeat-monitor streaks
- corroborated observations count

Suggested labels:
- Observer
- Sampler
- Repeat Monitor
- Watershed Scout
- Trusted Verifier
- Community Lead

## Contribution history

List:
- completed missions
- pending review
- corroborated submissions
- rejected/needs more info states

## Why trust changed

This is important.
The app should explain trust changes in simple terms:
- complete metadata improved your trust
- repeat monitoring increased reliability
- missing photo reduced confidence

That keeps the system legible and fair.

---

## 5. Mission result states

After submission, the user should see one of several states:
- Received
- Under review
- High-confidence observation
- Corroborated by nearby observation
- Follow-up recommended
- Escalated into evidence pack

This helps users feel that their work enters a real workflow.

---

## 6. Suggested first-launch Android flow

If Atlas Missions ever launches in a narrow MVP, the cleanest first Android flow is:

1. user sees a post-storm mission near them
2. user accepts mission
3. user confirms location
4. user performs guided strip/photo/note submission
5. user gets quality feedback and mission completion
6. user is asked to revisit if conditions warrant

That creates a strong loop with minimal product complexity.

---

## 7. Design guardrails

### Avoid

- infinite social feed framing
- gamified clutter before users understand mission purpose
- large freeform forms before guided capture
- public popularity metrics as the primary motivator
- visual blending of official and community evidence

### Prefer

- mission cards
- checklists
- visible trust/confidence explanations
- structured guided capture
- place-based maps
- simple repeat prompts

---

## 8. Future extensions

Potential later Android expansions:
- trusted station owner/weather witness flows
- journalist/admin mission creation
- watershed team coordination
- offline capture for fieldwork
- evidence-pack export or share preview
- ecology observation mission templates

These should come after the basic mission, submission, and trust loops are proven.

---

## 9. Product thesis

The Android Missions app should make one future Atlas behavior feel natural:

> when Atlas identifies a place worth checking, the app helps people collect structured evidence that can verify, challenge, or enrich the public record.
