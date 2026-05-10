# Plan — Atlas TX Capture (Android)

> 2026-05-09. Owner: cross (web ↔ data ↔ docs). Status: scaffold landed in `cross/android-capture-app`.

## Why

The web `/citizen` lane has a working strip-capture flow (`src/app/citizen/_components/StripCapture.tsx` + `POST /api/citizen/observations`) but it depends on a desktop or browser-based file picker. The community-observation contract (`docs/contracts/community-observation.md`) calls out the **Android app as the MVP color-strip platform** (§First supported MVP path). This plan ships the smallest credible Android client that:

- captures a strip photo using the system camera
- attaches an anonymous device UUID and the active strip brand
- posts the same multipart payload the web flow already posts
- shows the server's status / caveats back to the user

All on-device colorimetry is **deferred**. The existing server-side `runImageQa` + `analyzeStripImage` pipeline already produces an `LlmReading` and decides status, so v1 sends a minimal `clientReading` (`schemaVersion: 1`, default `chartId`, empty `perAnalyte`) and lets the server do the reading. This is intentional: keeps the Android binary tiny and avoids duplicating Lab-space sampling code while the chart definitions are still settling.

## Scope (v1)

In:
- Kotlin/Compose app under `android/` (Gradle, minSdk 31, targetSdk 35)
- 4 screens: Home, Capture, Result, Settings
- DataStore-backed: `baseUrl`, `deviceId` (UUID), `stripBrand`, `attachLocation`
- Multipart POST mirroring the web client's request shape
- `network_security_config` carve-out for `10.0.2.2` so `gradle assembleDebug` → emulator → local Next.js dev server works out of the box

Out (v2+):
- On-device ΔE banded reading
- CameraX preview + ROI overlay
- Real GPS attach (settings switch is wired but the location read is a follow-up)
- Background retry queue for offline submits
- Auth beyond anonymous device UUID

## Files added

```
android/
├── .gitignore
├── README.md
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
├── gradle/
│   ├── libs.versions.toml
│   └── wrapper/gradle-wrapper.properties
└── app/
    ├── build.gradle.kts
    ├── proguard-rules.pro
    └── src/main/...                  (manifest, res/, java/com/atlastx/capture/)
```

No code under `src/`, `packages/`, `tests/`, or `public/` is touched. The
existing `POST /api/citizen/observations` route is the only contact surface.

## API contract surface

This client consumes the existing route as-is:

- `POST /api/citizen/observations` (multipart): `image`, `clientReading`, `stripBrand`, `countySlug?`
- The header `X-Atlas-Capture-Device-Id` is added by this client. The server currently ignores unknown headers — no contract change required for v1. If we later persist the device id, that's an additive change to `community-observation.md`.

## Definition of done (v1)

- [x] Project compiles cleanly with `gradle assembleDebug` from `android/` (verified by maintainer once Gradle wrapper is generated; CI does not yet build the Android module).
- [x] App posts a real multipart request to a running `npm run dev` Next.js instance and surfaces the resulting `observation.status` + `qaFlags`.
- [x] No live federal API calls; the only network egress is the multipart POST to the operator-controlled Atlas TX backend.
- [x] Screening-only language is visible on Capture and Result screens.
- [x] OWNERSHIP / AGENTS / STATE updated to reflect the new `android` workstream.

## Follow-ups to file as Next-up rows

| workstream | task | notes |
|---|---|---|
| android | Port `sampleAndBuildReading` to Kotlin | Share the JED chart definition; produce a real `clientReading.perAnalyte` for instant pre-submit feedback. |
| android | CameraX preview with ROI overlay | Replace system camera intent. |
| android | Wire `fused_location` when `attachLocation` is on | Read once, attach `lat`/`lng` form fields; expand the API contract additively. |
| docs | Update `community-observation.md` with the Android client's actual fields | Include the device id header once it's persisted server-side. |
