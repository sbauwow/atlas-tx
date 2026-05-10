import { describe, expect, it } from "vitest";
import { createCountyWaterSourceProfileService } from "@/lib/water/source-provenance";
import type { ObservationRow } from "@/lib/observations/types";

describe("createCountyWaterSourceProfileService", () => {
  it("builds county source descriptors and timeline from open + community data", async () => {
    const service = createCountyWaterSourceProfileService({
      fetchGovernance: async () => [
        {
          sourceId: "tceq-water-districts",
          entityId: "D-1",
          countyName: "Travis County",
          entityName: "Travis Water Control",
          entityType: "MUD",
          activityStatus: "Active",
          city: "Austin",
          raw: {},
        },
      ],
      fetchPermits: async () => [
        {
          sourceId: "tceq-general-water-permits",
          permitNumber: "GP-1",
          countyName: "Travis County",
          permitStatus: "Active",
          permitType: "General",
          siteName: "Colorado Plant",
          raw: { effective_date: "2026-04-15T00:00:00.000Z" },
        },
      ],
      fetchAlerts: async () => [
        {
          sourceId: "nws-alerts",
          alertId: "AL-1",
          event: "Flood Watch",
          sentAt: "2026-04-10T12:00:00.000Z",
          countyNames: ["Travis County"],
          geometryType: "none",
          raw: {},
        },
      ],
      fetchSewerOverflows: async () => [
        {
          sourceId: "tceq-sewer-overflows",
          incidentNumber: "SO-1",
          countyName: "Travis County",
          startDate: "2026-04-05T00:00:00.000Z",
          raw: {},
        },
      ],
      fetchCommunityObservations: async () =>
        [
          {
            id: "obs-1",
            createdAt: new Date("2026-04-20T12:00:00.000Z"),
            kind: "strip",
            countySlug: "travis",
            imagePath: null,
            imageHash: null,
            stripBrand: "Generic",
            clientReading: { schemaVersion: 1, chartId: "chart", perAnalyte: [] },
            llmReading: null,
            llmModel: null,
            agreement: null,
            qaFlags: [],
            status: "accepted",
          },
        ] satisfies ObservationRow[],
    });

    const result = await service.getCountyProfile("travis-county");

    expect(result.county.slug).toBe("travis-county");
    expect(result.openDataSummary.activeWaterDistricts).toBe(1);
    expect(result.openDataSummary.trackedPermitSites).toBe(1);
    expect(result.sourceDescriptors.length).toBe(2);
    expect(result.timeline).toEqual([
      {
        month: "2026-04",
        alertCount: 1,
        sewerOverflowCount: 1,
        permitCount: 1,
        communitySampleCount: 1,
      },
    ]);
  });
});
