import { describe, expect, it } from "vitest";
import {
  filterLcraWaterQualityObservationsByStoretCode,
  normalizeLcraWaterQualityObservation,
  normalizeLcraWaterQualityParameter,
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
});
