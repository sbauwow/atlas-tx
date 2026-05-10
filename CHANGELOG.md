# Changelog

## 2026-05-10

### docs: record map-first county analytics direction

What shipped:
- updated README positioning so Atlas explicitly describes the statewide county map as the headliner workflow on analytics and water surfaces
- documented the supporting role of scatterplots, decomposition bars, and other follow-on views as user-directed correlation tools rather than the primary surface
- recorded the user goal directly: empower analysts to find their own correlations from grounded county evidence

## 2026-05-09

### research: add practical deployment section to paper draft

What shipped:
- added a practical deployment and use subsection to the paper draft clarifying Atlas TX as a screening and triage workflow rather than an automated enforcement or causal diagnosis system
- made the deployment language more honest by stating that the workflow was assembled in a short weekend-scale sprint and is not yet fully field-tested or production-ready
- tightened the conclusion to state the deployment lesson directly: use the model to prioritize deeper follow-up, not to adjudicate compliance on its own

### research: add related-work positioning and repo whitepaper section

What shipped:
- added a related-work positioning subsection to the paper draft covering water-quality prediction, empirical-Bayes small-area stabilization, and open-data environmental monitoring
- expanded the paper's sources with direct URLs for the related-work items referenced in that new section
- added a `Whitepaper and research artifacts` section to `README.md` so the paper-style track is visible from the repo root

### research: add source/proxy table and threat-to-validity framing to paper draft

What shipped:
- added a compact source/proxy table to the paper draft to make the Texas open-data backbone and federal enrichment stack more legible
- converted the limitations section into a clearer threats-to-validity framing with measurement, temporal, model-specification, interpretive, and external-validity subsections
- renumbered downstream tables in the draft accordingly

### research: seasonality robustness pass for temperature-seasonality thesis claim

What shipped:
- added `experiments/seasonality_robustness.ts` to pressure-test the temperature result with explicit month-of-year controls
- added package/test coverage for the new robustness analysis entry point
- generated `outputs/thesis-status/2026-05-10-seasonality-robustness-memo.md` and matching JSON output
- updated the paper draft and thesis status memo to reflect the stronger finding that broad month-of-year seasonality is a major predictor and temperature features add only a smaller residual gain after season controls

### research: reviewer-style critique and revision punch list for paper draft

What shipped:
- added a reviewer-style critique of the county-month paper draft with likely objections, section-by-section weaknesses, and a prioritized revision punch list
- identified the highest-value next experiment as a seasonality robustness check on the temperature-seasonality result
- saved the review artifact to `outputs/reviews/2026-05-10-county-month-paper-draft-review.md`

### research: final polish pass on paper draft prose and structure

What shipped:
- improved section transitions and tightened academic prose across the paper draft for a cleaner near-submission read
- normalized section and table/figure headings, removed drafty phrasing, and sharpened the wording around the heat ablation result and limitations

### research: polish submission-style paper draft language

What shipped:
- tightened the paper title, abstract, introduction, contribution framing, discussion prose, and conclusion for a cleaner submission-style read
- standardized the draft around the phrases `temperature-seasonality context`, `non-temperature trigger stack`, and `open-data ranking utility` to reduce ambiguity

### research: foreground contest open-data framing in thesis artifacts

What shipped:
- revised the main paper draft to frame the thesis explicitly as a Texas open-data systems and risk-ranking contribution, not just a weather-trigger modeling exercise
- revised the thesis status memo to foreground contest-relevant Texas open data plus adjacent public federal context as the backbone of the study
- updated the problem framing, contribution list, data provenance section, and conclusion so the contest/open-data motivation is explicit

### research: grassroots strip validation preregistration and schema

Added:
- `papers/2026-05-10-grassroots-strip-validation-preregistration-and-schema.md`

What shipped:
- a preregistration-style study plan for using grassroots strip observations as external validation and mismatch detection on top of the public-data thesis backbone
- a first observation-level, analyte-level, and county-month aggregation schema for the grassroots strip layer
- explicit evidence-class separation rules so grassroots strips stay a secondary validation layer rather than an authoritative outcome replacement

### research: add paper tables and figures to the draft

Added:
- `outputs/figures/model-comparison-selected.png`
- `outputs/figures/heat-ablation-auprc.png`

What shipped:
- inserted compact model-comparison and heat-ablation tables into the first paper draft
- generated first draft figures for selected model comparisons and heat ablations and linked them from the paper draft

### research: first full county-month paper draft

Added:
- `papers/2026-05-10-county-month-water-risk-paper-draft.md`

What shipped:
- a first full paper-style draft covering abstract, introduction, data, methods, results, discussion, limitations, conclusion, and next tables/figures
- the draft now reflects the refined heat-ablation result: temperature-seasonality context improves ranking, with `freeze_days` and the `heat_days + freeze_days` bundle carrying the strongest incremental signal

### research: heat ablation memo artifact

Added:
- `experiments/heat_ablation.ts`
- `tests/heat-ablation.test.ts`
- `outputs/thesis-status/2026-05-09-heat-ablation-memo.md`
- `outputs/thesis-status/2026-05-09-heat-ablation-memo.json`
- package script `analyze:heat-ablation`

What shipped:
- a focused pooled + county-FE heat decomposition benchmark against the existing EB-aware non-heat trigger stack
- single-term and bundled heat ablations for `temp_mean_anomaly_z`, `heat_days`, `freeze_days`, and `overflow_x_heat`

Observed result:
- the strongest single added heat term by validation AUPRC was `freeze_days` in both pooled and FE-style passes
- the best compact bundle was `heat_days + freeze_days`
- the full pooled heat stack matched the top validation result and kept the improved test AUPRC (`0.475` pooled, `0.478` FE-style)

### research: thesis outline plus heat-ablation plan artifact

Added:
- `papers/2026-05-09-thesis-outline-and-heat-ablation-plan.md`

What shipped:
- a paper-ready thesis outline centered on chronic county baseline risk, EB stabilization, and the incremental heat finding
- a focused heat-ablation plan specifying benchmark models, decomposition tests, robustness checks, and interpretation rules

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
