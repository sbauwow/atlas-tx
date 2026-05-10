# Changelog

## 2026-05-09

### research: add county-month temperature / heat context and rerun EB-aware ladders

Added:
- `src/lib/datasets/temperature.ts`
- `scripts/refresh-county-month-temperature.ts`
- `tests/temperature.test.ts`
- `tests/refresh-county-month-temperature.test.ts`
- package script `refresh:county-month-temperature`

What shipped:
- county-centroid Open-Meteo temperature context aggregated to monthly mean-temperature anomaly z-scores, `heat_days`, and `freeze_days`
- panel integration for `temp_mean_anomaly_z`, `heat_days`, `freeze_days`, and `overflow_x_heat`
- regenerated pooled and county-FE EB-aware ladder outputs with heat included on top of precipitation, NWS flood, streamflow, and drought context

Observed result:
- temperature/heat context attached to all 18,288 county-month rows; trigger-model usability remained capped at 14,698 rows by streamflow coverage
- pooled `Persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat` reached validation AUPRC `0.578` and test AUPRC `0.475`
- county-FE `County FE + persistence + EB baseline + overflow + precipitation + NWS flood + streamflow + drought + heat` reached validation AUPRC `0.578` and test AUPRC `0.478`
- unlike the earlier drought and streamflow passes, the heat layer produced a clear incremental gain over the prior EB-aware trigger stack

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
