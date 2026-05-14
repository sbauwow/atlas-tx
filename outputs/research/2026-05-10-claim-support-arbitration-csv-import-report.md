# Claim-support arbitration CSV import report

Generated: 2026-05-10T07:20:38.196Z

## Conversion summary

- Input CSV: `data/claim-support/claim_support_arbitration_review_sheet.csv`
- Output JSON: `data/claim-support/claim_support_arbitration_dataset.json`
- Rows converted: **3**

## Conversion rules applied

- blank analyte band cells become `null`
- QA boolean columns are converted into the `qaFlags` array
- empty notes become `null`
- only exact `true` / `false` are accepted for boolean columns
- image quality and readability labels must match the benchmark rubric exactly

## Recommended next step

Run:

`npm run analyze:claim-support-arbitration`

to evaluate the newly converted JSON benchmark dataset.
