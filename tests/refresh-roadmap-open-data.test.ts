import { describe, expect, it } from "vitest";

import { buildRoadmapOpenDataBotnetSnapshot } from "../scripts/refresh-roadmap-open-data";

describe("refresh-roadmap-open-data", () => {
  it("builds a machine-readable roadmap candidate snapshot", () => {
    const snapshot = buildRoadmapOpenDataBotnetSnapshot({ generatedAt: "2026-05-10T08:00:00.000Z" });

    expect(snapshot.generatedAt).toBe("2026-05-10T08:00:00.000Z");
    expect(snapshot.scope).toBe("atlas-tx-roadmap-open-data-botnet");
    expect(snapshot.candidateCount).toBeGreaterThan(0);
    expect(snapshot.waves["wave-3"]).toBeGreaterThan(0);
    expect(snapshot.candidates.find((candidate) => candidate.executionUnitId === "boil-water-notices")).toMatchObject({
      nextAction: "verify-upstream-source",
      roadmapWave: "wave-3",
    });
  });
});
