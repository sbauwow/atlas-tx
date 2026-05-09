import { describe, expect, it } from "vitest";
import {
  filterLcraWaterQualityObservationsByStoretCode,
  normalizeLcraWaterQualityObservation,
  normalizeLcraWaterQualityParameter,
  normalizeLcraWaterQualitySegment,
  normalizeLcraWaterQualitySite,
} from "@/lib/water/lcra-water-quality";

describe("LCRA water quality", () => {
  it("normalizes site metadata and parameter catalog rows", () => {
    const site = normalizeLcraWaterQualitySite({
      SiteId: "12281",
      SiteName: "COLORADO RV TIDAL NEAR FM 521",
      SegmentId: "1401",
      SegmentName: "COLORADO RIVER TIDAL",
      RootSegmentId: "1401",
      RootSegmentName: "COLORADO RIVER TIDAL",
      Latitude: 28.767336,
      Longitude: -96.002508,
      LastDate: "2025-10-29T00:00:00",
      Agency: "LCRA",
      IsActive: true,
      ImpairedSegment: false,
      SurfaceDataOverride: null,
    });

    const parameter = normalizeLcraWaterQualityParameter({
      SiteId: "12281",
      SegmentId: "1401",
      StoretCode: "00010",
      StoretName: "Temperature, water",
      StoretCategory: "Field Measurements",
      HasSurfaceData: true,
    });

    expect(site).toEqual({
      sourceId: "lcra-water-quality-sites",
      siteId: "12281",
      siteName: "COLORADO RV TIDAL NEAR FM 521",
      segmentId: "1401",
      segmentName: "COLORADO RIVER TIDAL",
      rootSegmentId: "1401",
      rootSegmentName: "COLORADO RIVER TIDAL",
      latitude: 28.767336,
      longitude: -96.002508,
      lastObservedAt: "2025-10-29T00:00:00",
      agency: "LCRA",
      isActive: true,
      impairedSegment: false,
      surfaceDataOverride: null,
      raw: {
        SiteId: "12281",
        SiteName: "COLORADO RV TIDAL NEAR FM 521",
        SegmentId: "1401",
        SegmentName: "COLORADO RIVER TIDAL",
        RootSegmentId: "1401",
        RootSegmentName: "COLORADO RIVER TIDAL",
        Latitude: 28.767336,
        Longitude: -96.002508,
        LastDate: "2025-10-29T00:00:00",
        Agency: "LCRA",
        IsActive: true,
        ImpairedSegment: false,
        SurfaceDataOverride: null,
      },
    });

    expect(parameter).toEqual({
      sourceId: "lcra-water-quality-parameters",
      siteId: "12281",
      segmentId: "1401",
      storetCode: "00010",
      storetName: "Temperature, water",
      storetCategory: "Field Measurements",
      hasSurfaceData: true,
      raw: {
        SiteId: "12281",
        SegmentId: "1401",
        StoretCode: "00010",
        StoretName: "Temperature, water",
        StoretCategory: "Field Measurements",
        HasSurfaceData: true,
      },
    });
  });

  it("normalizes observations and filters by storet code", () => {
    const observations = [
      normalizeLcraWaterQualityObservation({
        SiteId: "12281",
        SegmentId: "1401",
        StoretCode: "00010",
        StoretName: "Temperature, water",
        StoretCategory: "Field Measurements",
        Depth: "Surface",
        Agency: "LCRA",
        Symbol: "",
        Value: 25.4,
        Date: "2025-10-29T00:00:00",
      }),
      normalizeLcraWaterQualityObservation({
        SiteId: "12281",
        SegmentId: "1401",
        StoretCode: "00300",
        StoretName: "Dissolved oxygen",
        StoretCategory: "Field Measurements",
        Depth: "Surface",
        Agency: "LCRA",
        Symbol: "<",
        Value: 7.2,
        Date: "2025-10-29T00:00:00",
      }),
    ];

    expect(observations[0]).toMatchObject({
      sourceId: "lcra-water-quality-observations",
      siteId: "12281",
      storetCode: "00010",
      value: 25.4,
      observedAt: "2025-10-29T00:00:00",
    });
    expect(filterLcraWaterQualityObservationsByStoretCode(observations, "00300")).toEqual([observations[1]]);
  });

  it("normalizes segment metadata", () => {
    const segment = normalizeLcraWaterQualitySegment({
      SegmentId: "1403",
      SegmentName: "LAKE AUSTIN",
      RootSegmentId: "1403",
      RootSegmentName: "LAKE AUSTIN",
      SiteIds: "12300,12299",
      Agencies: "LCRA,COA",
      ImpairedSegment: false,
      Sites: [{ SiteId: "12300", SiteName: "LK AUSTIN AT LOW WATER CROSSIN" }],
    });

    expect(segment).toMatchObject({
      sourceId: "lcra-water-quality-segments",
      segmentId: "1403",
      segmentName: "LAKE AUSTIN",
      rootSegmentId: "1403",
      rootSegmentName: "LAKE AUSTIN",
      siteIds: ["12300", "12299"],
      agencies: ["LCRA", "COA"],
      impairedSegment: false,
    });
  });
});
