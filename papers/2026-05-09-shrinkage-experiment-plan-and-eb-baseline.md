# Shrinkage experiment plan and first empirical-Bayes county baseline

Generated: 2026-05-09T14:10:19.479Z

## Summary

This note tests whether **Stein-type / empirical-Bayes shrinkage** can improve Atlas TX county-level prediction by stabilizing noisy county baseline SDWIS event rates.

The first implementation here is a **beta-binomial empirical-Bayes county baseline** rather than a literal Gaussian James–Stein estimator. That is a better fit for county-month binary event data.

## Why shrinkage is plausible here

- County-month SDWIS events are sparse and heterogeneous.
- Some counties have very little training information.
- Raw county historical rates can overreact to small samples.
- A shrinkage baseline can borrow strength from the statewide distribution and reduce variance.

## Current implementation

Training window for county baseline estimation:
- 2020-01 through 2023-12

Evaluation windows:
- validation: 2024-01 through 2024-12
- test: 2025-01 through 2025-12

Method:
1. Estimate each county's historical event rate from training county-month rows.
2. Estimate a beta prior by method of moments across county rates.
3. Shrink each county rate toward the statewide prior mean:

\[
\tilde{p}_c = \frac{y_c + \alpha}{n_c + \alpha + \beta}
\]

where:
- \(y_c\) is county training SDWIS-positive month count,
- \(n_c\) is county training month count,
- \(\alpha, \beta\) are empirical-Bayes prior parameters.

Estimated prior:
- alpha: 0.506
- beta: 2.511
- prior mean: 0.168
- prior strength: 3.017

## Baseline comparison

| Model | Split | N | Positives | Prevalence | AUROC | AUPRC | Brier | Precision@top-decile | Lift@top-decile |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Statewide prevalence baseline | train | 12192 | 2044 | 0.168 | 0.5 | 0.185 | 0.14 | 0.18 | 1.072 |
| Statewide prevalence baseline | validation | 3048 | 678 | 0.222 | 0.5 | 0.244 | 0.176 | 0.252 | 1.135 |
| Statewide prevalence baseline | test | 3048 | 484 | 0.159 | 0.5 | 0.167 | 0.134 | 0.151 | 0.95 |
| Raw county historical rate | train | 12192 | 2044 | 0.168 | 0.835 | 0.531 | 0.105 | 0.548 | 3.269 |
| Raw county historical rate | validation | 3048 | 678 | 0.222 | 0.725 | 0.497 | 0.15 | 0.557 | 2.506 |
| Raw county historical rate | test | 3048 | 484 | 0.159 | 0.771 | 0.437 | 0.113 | 0.436 | 2.746 |
| Empirical-Bayes county baseline | train | 12192 | 2044 | 0.168 | 0.835 | 0.531 | 0.105 | 0.548 | 3.269 |
| Empirical-Bayes county baseline | validation | 3048 | 678 | 0.222 | 0.725 | 0.497 | 0.15 | 0.557 | 2.506 |
| Empirical-Bayes county baseline | test | 3048 | 484 | 0.159 | 0.771 | 0.437 | 0.113 | 0.436 | 2.746 |

## Read of the first shrinkage result

- The key comparison is **raw county historical rate** vs **empirical-Bayes county baseline**.
- In this first county-only baseline test, the reported ranking metrics are effectively identical because every county contributes the same 48 training months, so beta-binomial shrinkage preserves almost the same county ordering while only compressing the probabilities toward the statewide mean.
- That means the value of shrinkage here is currently **stability/calibration-oriented** more than ranking-oriented.
- A more informative next test is to inject the shrunk county baseline into the richer prediction ladder or move to settings with unequal exposure counts (for example PWS-month or counties with variable usable history windows).

## Counties with strongest shrinkage adjustments

| County | Train months | Train positives | Raw rate | Shrunk rate | Raw - Shrunk |
|---|---:|---:|---:|---:|---:|
| Bexar County | 48 | 47 | 0.979 | 0.931 | 0.048 |
| Burnet County | 48 | 47 | 0.979 | 0.931 | 0.048 |
| Comal County | 48 | 47 | 0.979 | 0.931 | 0.048 |
| Edwards County | 48 | 47 | 0.979 | 0.931 | 0.048 |
| Harris County | 48 | 46 | 0.958 | 0.912 | 0.047 |
| Angelina County | 48 | 41 | 0.854 | 0.814 | 0.041 |
| Orange County | 48 | 29 | 0.604 | 0.578 | 0.026 |
| Palo Pinto County | 48 | 26 | 0.542 | 0.52 | 0.022 |
| Jefferson County | 48 | 25 | 0.521 | 0.5 | 0.021 |
| Brazoria County | 48 | 24 | 0.5 | 0.48 | 0.02 |

## How James–Stein ideas fit the project

The classical James–Stein estimator is for simultaneous Gaussian mean estimation. Our data are county-month binary events, so the more appropriate implementation family is:

- empirical-Bayes beta-binomial shrinkage for county event probabilities,
- empirical-Bayes / Poisson-gamma shrinkage for count-like county rates,
- hierarchical logistic or Poisson partial-pooling models for richer prediction.

So for Atlas TX, the right reading is:

> Use **Stein-type shrinkage principles** to stabilize noisy county baselines and county-level feature rates, rather than applying the classical James–Stein formula directly to final classifier outputs.

## Recommended next shrinkage experiments

1. **Shrunk baseline inside the prediction ladder**
   - Replace or augment raw persistence features with a shrunk county baseline risk feature.

2. **Hierarchical county intercept model**
   - Replace unrestricted county fixed effects with partial pooling.

3. **Shrinkage for overflow burden**
   - Build shrunk county overflow-intensity and severe-overflow rates.

4. **Basin-level partial pooling**
   - Shrink counties toward basin- or region-level means, not only statewide mean.

5. **PWS-level shrinkage**
   - If the panel moves to PWS-month, use the same idea for system-level sparse event baselines.

## Paper implication

If the empirical-Bayes county baseline is competitive with or better than raw county rates, that helps justify a paper section on:
- small-area instability,
- shrinkage-based stabilization,
- and why raw county burden ranking should not be treated as equally reliable across counties.

## Sources

- Small Area Shrinkage Estimation  
  https://projecteuclid.org/journals/statistical-science/volume-27/issue-1/Small-Area-Shrinkage-Estimation/10.1214/11-STS374.full
- Empirical Bayes and the James–Stein Estimator  
  https://utstat.toronto.edu/reid/sta2212s/2021/LSIChapter1.pdf
- Small area estimation with mixed models: a review  
  https://link.springer.com/article/10.1007/s42081-020-00076-x?error=cookies_not_supported&code=b6c9b5c6-f540-4e9c-ba42-4d29099ad10b
- On Application of the Empirical Bayes Shrinkage in Epidemiological Settings  
  https://mdpi-res.com/d_attachment/ijerph/ijerph-07-00380/article_deploy/ijerph-07-00380.pdf?version=1403137707
- Poisson Counts, Square Root Transformation and Small Area Estimation  
  https://link.springer.com/content/pdf/10.1007/s13571-021-00269-8.pdf?error=cookies_not_supported&code=7e0b3ca1-49b9-4918-8b79-b6278b311977
