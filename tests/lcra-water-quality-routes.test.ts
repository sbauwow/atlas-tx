import { describe, expect, it, vi } from "vitest";

const fetchLcraWaterQualitySites = vi.fn();
const fetchLcraWaterQualitySite = vi.fn();
const fetchLcraWaterQualitySiteParameters = vi.fn();
const fetchLcraWaterQualitySiteObservations = vi.fn();

vi.mock("@/lib/water/lcra-water-quality", () => ({
  fetchLcraWaterQualitySites,
  fetchLcraWaterQualitySite,
  fetchLcraWaterQualitySiteParameters,
  fetchLcraWaterQualitySiteObservations,
  filterLcraWaterQualityObservationsByStoretCode: vi.fn((rows, storetCode: string) => rows.filter((row: { storetCode: string }) => row.storetCode === storetCode)),
}));

describe("LCRA water quality routes", () => {
  it("returns site inventory", async () => {
    fetchLcraWaterQualitySites.mockResolvedValue([
      { sourceId: "lcra-water-quality-sites", siteId: "12281", siteName: "COLORADO RV TIDAL NEAR FM 521", segmentId: "1401", agency: "LCRA", isActive: true, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/lcra/quality/sites/route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.sites[0].siteId).toBe("12281");
  });

  it("returns site detail and parameter catalog", async () => {
    fetchLcraWaterQualitySite.mockResolvedValue({ sourceId: "lcra-water-quality-sites", siteId: "12281", siteName: "COLORADO RV TIDAL NEAR FM 521", segmentId: "1401", raw: {} });
    fetchLcraWaterQualitySiteParameters.mockResolvedValue([
      { sourceId: "lcra-water-quality-parameters", siteId: "12281", storetCode: "00010", storetName: "Temperature, water", raw: {} },
    ]);

    const siteRoute = await import("@/app/api/water/lcra/quality/sites/[siteId]/route");
    const parameterRoute = await import("@/app/api/water/lcra/quality/sites/[siteId]/parameters/route");

    const siteResponse = await siteRoute.GET(new Request("http://localhost/api/water/lcra/quality/sites/12281"), { params: Promise.resolve({ siteId: "12281" }) });
    const parameterResponse = await parameterRoute.GET(new Request("http://localhost/api/water/lcra/quality/sites/12281/parameters"), { params: Promise.resolve({ siteId: "12281" }) });

    expect((await siteResponse.json()).site.siteName).toBe("COLORADO RV TIDAL NEAR FM 521");
    expect((await parameterResponse.json()).parameters[0].storetCode).toBe("00010");
  });

  it("returns observations with optional storet filter", async () => {
    fetchLcraWaterQualitySiteObservations.mockResolvedValue([
      { sourceId: "lcra-water-quality-observations", siteId: "12281", storetCode: "00010", value: 25.4, raw: {} },
      { sourceId: "lcra-water-quality-observations", siteId: "12281", storetCode: "00300", value: 7.2, raw: {} },
    ]);

    const { GET } = await import("@/app/api/water/lcra/quality/sites/[siteId]/observations/route");
    const response = await GET(new Request("http://localhost/api/water/lcra/quality/sites/12281/observations?storetCode=00300"), { params: Promise.resolve({ siteId: "12281" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.observations).toHaveLength(1);
    expect(payload.observations[0].storetCode).toBe("00300");
  });
});
