# Claim-support arbitration CSV to JSON conversion guide

Generated: 2026-05-10

## Conversion script

- `experiments/claim_support_arbitration_csv_to_json.ts`

## Package command

- `npm run convert:claim-support-arbitration-csv`

---

## Purpose

This helper converts the spreadsheet-friendly review sheet:
- `data/claim-support/claim_support_arbitration_review_sheet.csv`

into the JSON benchmark dataset used by the Experiment A evaluator:
- `data/claim-support/claim_support_arbitration_dataset.json`

It closes the loop between:
- human spreadsheet review,
- machine-readable benchmark data,
- and the arbitration evaluator.

---

## What the converter does

### Input
- `data/claim-support/claim_support_arbitration_review_sheet.csv`

### Output
- `data/claim-support/claim_support_arbitration_dataset.json`

### Report artifact
- `outputs/research/2026-05-10-claim-support-arbitration-csv-import-report.md`

---

## Conversion rules

- blank analyte cells become `null`
- QA boolean columns become entries in the `qaFlags` array
- empty `notes` become `null`
- `chartVisible` must be exactly `true` or `false`
- QA columns must be exactly `true` or `false`
- `imageQualityLabel` must be one of:
  - `valid`
  - `marginal`
  - `invalid`
- `readabilityLabel` must be one of:
  - `readable`
  - `uncertain`
  - `unreadable`

If the CSV contains invalid labels, the conversion should fail rather than silently guess.

---

## Recommended workflow

1. Review and label rows in:
   - `data/claim-support/claim_support_arbitration_review_sheet.csv`
2. Run:
   - `npm run convert:claim-support-arbitration-csv`
3. Then run:
   - `npm run analyze:claim-support-arbitration`

That sequence updates the benchmark JSON and then evaluates it.

---

## Why this matters

Without this helper, spreadsheet-based labeling creates friction and copy/paste risk.
With this helper, the Experiment A benchmark becomes a repeatable workflow:

> label in CSV → convert to JSON → evaluate benchmark

---

## Sources

### Local Atlas TX files
- `data/claim-support/claim_support_arbitration_review_sheet.csv`
- `data/claim-support/claim_support_arbitration_dataset.json`
- `experiments/claim_support_arbitration_csv_to_json.ts`
- `experiments/claim_support_arbitration.ts`
- `outputs/research/2026-05-10-claim-support-arbitration-csv-review-sheet-guide.md`
