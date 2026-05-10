import { describe, expect, it } from "vitest";
import pkg from "../package.json";

describe("package scripts", () => {
  it("exposes an mcp script for running the Atlas TX MCP tool surface", () => {
    expect(pkg.scripts["mcp"]).toBe("tsx packages/mcp-server/src/index.js");
  });

  it("exposes a refresh:all script for running the staged refresh pipeline", () => {
    expect(pkg.scripts["refresh:all"]).toBe("tsx scripts/refresh-all.ts");
  });

  it("exposes a refresh:botnet script for running the agentic ingest orchestrator", () => {
    expect(pkg.scripts["refresh:botnet"]).toBe("tsx scripts/refresh-all.ts");
  });

  it("exposes a refresh:weather script for grouped weather/history refreshes", () => {
    expect(pkg.scripts["refresh:weather"]).toBe("tsx scripts/refresh-weather.ts");
  });

  it("exposes a refresh:roadmap-open-data script for future open-data roadmap prep", () => {
    expect(pkg.scripts["refresh:roadmap-open-data"]).toBe("tsx scripts/refresh-roadmap-open-data.ts");
  });

  it("exposes a refresh:cid script for running the executable CID refresh scaffold", () => {
    expect(pkg.scripts["refresh:cid"]).toBe("tsx scripts/refresh-cid.ts");
  });

  it("exposes a refresh:twdb-hydrology script for refreshing TWDB hydrology cache", () => {
    expect(pkg.scripts["refresh:twdb-hydrology"]).toBe("tsx scripts/refresh-twdb-hydrology.ts");
  });

  it("exposes a refresh:surface-water-quality script for refreshing TCEQ surface-water-quality cache", () => {
    expect(pkg.scripts["refresh:surface-water-quality"]).toBe("tsx scripts/refresh-surface-water-quality.ts");
  });

  it("exposes a refresh:city-open-data script for refreshing Texas city open-data catalogs", () => {
    expect(pkg.scripts["refresh:city-open-data"]).toBe("tsx scripts/refresh-city-open-data.ts");
  });

  it("exposes a refresh:city-open-data-curated script for refreshing curated Texas city open-data catalogs", () => {
    expect(pkg.scripts["refresh:city-open-data-curated"]).toBe("tsx scripts/refresh-city-open-data-curated.ts");
  });

  it("exposes a refresh:city-open-data-ranked script for refreshing ranked Texas city open-data catalogs", () => {
    expect(pkg.scripts["refresh:city-open-data-ranked"]).toBe("tsx scripts/refresh-city-open-data-ranked.ts");
  });

  it("exposes a county-month precipitation refresh script", () => {
    expect(pkg.scripts["refresh:county-month-precipitation"]).toBe("tsx scripts/refresh-county-month-precipitation.ts");
  });

  it("exposes a county-month streamflow refresh script", () => {
    expect(pkg.scripts["refresh:county-month-streamflow"]).toBe("tsx scripts/refresh-county-month-streamflow.ts");
  });

  it("exposes a county-month drought refresh script", () => {
    expect(pkg.scripts["refresh:county-month-drought"]).toBe("tsx scripts/refresh-county-month-drought.ts");
  });

  it("exposes a county-month temperature refresh script", () => {
    expect(pkg.scripts["refresh:county-month-temperature"]).toBe("tsx scripts/refresh-county-month-temperature.ts");
  });

  it("exposes a county-month NWS flood alert refresh script", () => {
    expect(pkg.scripts["refresh:county-month-nws-flood-alerts"]).toBe("tsx scripts/refresh-county-month-nws-flood-alerts.ts");
  });

  it("exposes a heat ablation analysis script for the thesis robustness pass", () => {
    expect(pkg.scripts["analyze:heat-ablation"]).toBe("tsx experiments/heat_ablation.ts");
  });

  it("exposes a seasonality robustness analysis script for the thesis robustness pass", () => {
    expect(pkg.scripts["analyze:seasonality-robustness"]).toBe("tsx experiments/seasonality_robustness.ts");
  });
});
