# Atlas TX

Atlas TX is an open-source Texas county intelligence platform for exploring environmental burden, social strain, and local fiscal capacity.

Initial MVP focus:
- county comparison for Texas public datasets
- environment + social vulnerability signals
- debt and fiscal-context expansion path
- agent-safe discovery and bounded query workflows

## MVP datasets

Environment and infrastructure:
- `7fq8-wig2` — TCEQ Water Quality Individual Permits Active/Pending
- `hr84-s96f` — Texas Water Districts

Social strain:
- `waxz-c9q5` — CPI Completed Abuse/Neglect Investigations by County and Region FY2016-FY2025

Fiscal and debt:
- `u3nh-2phm` — Local Government Debt Report (HB 1378) FY 2023
- `ctj5-pypw` — County Returns
- `tmhs-ahbh` — Sales Tax Allocation, Tax Rates

## Planned architecture

- `src/app/` — Next.js frontend and API routes
- `src/lib/` — dataset registry, county normalization, scoring logic
- `packages/mcp-server/` — MCP server for discover/query/compare/summarize tools
- `skills/atlas-tx/` — agent skill documentation for safe use
- `docs/plans/` — implementation plans and scope docs

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## First milestone

Ship a county comparison demo showing:
- environmental permit density
- water district presence
- social-strain proxy
- debt-report coverage
- fiscal context links and citations

## Constraints

- Use public data with attribution
- No scraping behind authentication
- No investor-grade or medical claims
- Explicit uncertainty and coverage caveats for every summary
