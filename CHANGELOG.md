# Changelog

## 2026-05-09

### feat: add DWRS and surface water mismatch signals

Atlas TX now ships a deeper water-risk and journalist-outlier detection stack.

Added:
- Drinking Water Risk Score (DWRS) scorer from SDWIS violations
- MCP `score_pws_drinking_water_risk` endpoint
- TCEQ surface-water-quality dataset loader and statewide snapshot
- `npm run refresh:surface-water-quality` refresh script
- County joins for surface-water rows via text extraction, AU-layer fallback, and geometry reverse-county lookup
- Additive surface-water impairment context in county water summaries
- First journalist-facing mismatch detector for official-signal contradictions
- Docs and roadmap updates shifting Atlas TX toward outlier-first / contradiction-first workflows

Current snapshot result for surface-water-quality:
- 1,523 total rows
- 613 impaired rows
- 100% county coverage after direct + geometry fallback joins

Guardrails preserved:
- surface-water impairment is additive context, not a standalone verdict on county-wide harm
- environmental burden remains an indicator/proxy framing, not a direct harm claim

Verification:
- full test suite passed
- lint passed
- build passed
