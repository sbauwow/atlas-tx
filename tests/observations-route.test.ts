import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ClientReading } from "@/lib/observations/types";

vi.mock("node:fs/promises", async (orig) => {
  const actual = await orig<typeof import("node:fs/promises")>();
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/observations/qa", () => ({
  runImageQa: vi.fn().mockResolvedValue({
    flags: [],
    metrics: { meanLuminance: 180, laplacianVariance: 500, saturationClipRatio: 0 },
  }),
}));

const created = {
  id: "obs_test_id",
  createdAt: new Date("2026-05-09T00:00:00Z"),
  kind: "strip" as const,
  countySlug: null,
  imagePath: null,
  imageHash: null,
  stripBrand: null,
  clientReading: null as unknown as ClientReading,
  llmReading: null,
  llmModel: null,
  agreement: null,
  qaFlags: [],
  status: "pending" as const,
};

vi.mock("@/lib/observations/persistence", () => ({
  createObservation: vi.fn(async (input) => ({ ...created, clientReading: input.clientReading })),
  updateAfterAnalysis: vi.fn(async (input) => ({
    ...created,
    clientReading: created.clientReading,
    status: input.status,
    agreement: input.agreement,
    llmModel: input.llmModel,
    llmReading: input.llmReading,
    qaFlags: input.qaFlags,
  })),
  findByImageHash: vi.fn().mockResolvedValue(null),
  findById: vi.fn(),
  listRecent: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/observations/vision", () => ({
  analyzeStripImage: vi.fn().mockResolvedValue(null), // simulate missing API key
}));

import { GENERIC_9PAD_CHART } from "@/lib/observations/strips/reference-chart-9pad";
import { JED_POOL_TOOLS_5WAY_CHART } from "@/lib/observations/strips/reference-chart-jed-5way";
import { OBSERVATION_SCHEMA_VERSION } from "@/lib/observations/types";

function fakeImage(): File {
  // 1x1 PNG, valid header so File.type is taken as image/png.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=",
    "base64",
  );
  return new File([png], "strip.png", { type: "image/png" });
}

function fakeClientReading(chart = GENERIC_9PAD_CHART): ClientReading {
  return {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    chartId: chart.id,
    perAnalyte: chart.analytes.map((a) => ({
      analyteId: a.id,
      bandIndex: 0,
      distance: 5,
      distanceToRunnerUp: 10,
      sampledLab: [50, 0, 0],
      sampledRgb: [128, 128, 128],
    })),
  };
}

describe("POST /api/citizen/observations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when no image is attached", async () => {
    const { POST } = await import("@/app/api/citizen/observations/route");
    const fd = new FormData();
    fd.append("clientReading", JSON.stringify(fakeClientReading()));
    const res = await POST(new Request("http://localhost/api/citizen/observations", { method: "POST", body: fd }));
    expect(res.status).toBe(400);
  });

  it("rejects when clientReading JSON is malformed", async () => {
    const { POST } = await import("@/app/api/citizen/observations/route");
    const fd = new FormData();
    fd.append("image", fakeImage());
    fd.append("clientReading", "not json");
    const res = await POST(new Request("http://localhost/api/citizen/observations", { method: "POST", body: fd }));
    expect(res.status).toBe(400);
  });

  it("rejects unsupported mime types", async () => {
    const { POST } = await import("@/app/api/citizen/observations/route");
    const fd = new FormData();
    fd.append("image", new File([Buffer.from("hi")], "x.txt", { type: "text/plain" }));
    fd.append("clientReading", JSON.stringify(fakeClientReading()));
    const res = await POST(new Request("http://localhost/api/citizen/observations", { method: "POST", body: fd }));
    expect(res.status).toBe(415);
  });

  it("returns 201 with status=review when LLM is unavailable", async () => {
    const { POST } = await import("@/app/api/citizen/observations/route");
    const fd = new FormData();
    fd.append("image", fakeImage());
    fd.append("clientReading", JSON.stringify(fakeClientReading()));
    const res = await POST(new Request("http://localhost/api/citizen/observations", { method: "POST", body: fd }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.observation.status).toBe("review");
    expect(body.observation.id).toBe("obs_test_id");
    expect(body.observation.llmModel).toBeNull();
  });

  it("routes JED 5-way observations through the matching reference chart", async () => {
    const vision = await import("@/lib/observations/vision");
    (vision.analyzeStripImage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      schemaVersion: OBSERVATION_SCHEMA_VERSION,
      chartId: JED_POOL_TOOLS_5WAY_CHART.id,
      perAnalyte: JED_POOL_TOOLS_5WAY_CHART.analytes.map((a) => ({
        analyteId: a.id,
        bandIndex: 0,
        confidence: 0.95,
      })),
      qaFlags: [],
    });

    const { POST } = await import("@/app/api/citizen/observations/route");
    const fd = new FormData();
    fd.append("image", fakeImage());
    fd.append("clientReading", JSON.stringify(fakeClientReading(JED_POOL_TOOLS_5WAY_CHART)));
    fd.append("stripBrand", "JED Pool Tools 5-way");

    const res = await POST(new Request("http://localhost/api/citizen/observations", { method: "POST", body: fd }));
    expect(res.status).toBe(201);
    expect(vision.analyzeStripImage).toHaveBeenCalledWith(
      expect.objectContaining({ chart: JED_POOL_TOOLS_5WAY_CHART }),
    );
  });

  it("dedupes by image hash on replay", async () => {
    const persistence = await import("@/lib/observations/persistence");
    (persistence.findByImageHash as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...created,
      clientReading: fakeClientReading(),
      status: "accepted" as const,
    });

    const { POST } = await import("@/app/api/citizen/observations/route");
    const fd = new FormData();
    fd.append("image", fakeImage());
    fd.append("clientReading", JSON.stringify(fakeClientReading()));
    const res = await POST(new Request("http://localhost/api/citizen/observations", { method: "POST", body: fd }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deduped).toBe(true);
  });
});
