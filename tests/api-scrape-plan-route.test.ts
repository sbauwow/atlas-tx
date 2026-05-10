import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/scrape/plan/route";

describe("GET /api/scrape/plan", () => {
  it("returns balanced plan by default", async () => {
    const request = new NextRequest("http://localhost:3000/api/scrape/plan");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.aggressiveness).toBe("balanced");
    expect(Array.isArray(body.hierarchy)).toBe(true);
    expect(Array.isArray(body.sourcePlans)).toBe(true);
  });

  it("accepts aggressiveness query param", async () => {
    const request = new NextRequest("http://localhost:3000/api/scrape/plan?aggressiveness=aggressive");
    const response = await GET(request);
    const body = await response.json();

    expect(body.aggressiveness).toBe("aggressive");
  });
});
