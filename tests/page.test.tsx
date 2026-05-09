import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/app/components/tracked-link", () => ({
  default: ({ event, eventTarget, href, children, className }: { event: string; eventTarget?: string; href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} data-event={event} data-event-target={eventTarget} className={className}>{children}</a>
  ),
}));

vi.mock("@/lib/atlas-county-explorer", () => ({
  getDefaultAtlasCountyExplorerService: () => ({
    getCountyOverview: async () => ({
      countyCount: 254,
    }),
  }),
}));

vi.mock("@/lib/water/water-summary-service", () => ({
  getDefaultAtlasWaterSummaryService: () => ({
    getWaterOverview: async () => ({
      counties: [
        { metrics: { activeWaterAlertCount: 3, streamGaugeCount: 8 } },
        { metrics: { activeWaterAlertCount: 2, streamGaugeCount: 5 } },
      ],
    }),
  }),
}));

vi.mock("@/lib/tceq-permits", () => ({
  getTceqPendingPermitsPageData: async () => ({
    summary: { pendingPermitCount: 17 },
  }),
}));

import Home from "@/app/page";

describe("Home landing page", () => {
  it("frames Atlas TX as a Texas drinking-water-risk and EJ explorer", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain("Atlas TX · Texas water risk explorer");
    expect(html).toContain("Surface Texas drinking-water risk and environmental-justice burden.");
    expect(html).toContain("Atlas TX joins Texas permit and water-system context with federal SDWIS, EJScreen, and ACS data");
    expect(html).toContain("Journalists, policy analysts, and civic-tech teams");
    expect(html).toContain('href="/counties"');
    expect(html).toContain("County workspace overview");
    expect(html).toContain("Entry paths");
    expect(html).toContain("Permit tracker");
    expect(html).toContain('href="/permits"');
  });

  it("surfaces live workflow counts on the homepage entry cards", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain("17 pending permits");
    expect(html).toContain("254 ranked counties");
    expect(html).toContain("5 active alerts · 13 gauges");
  });

  it("describes the refocused product thesis and signals", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain("Water-risk thesis");
    expect(html).toContain("Start with DWRS + EJ overlap + cited permit context.");
    expect(html).toContain("Primary user: Texas county-newsroom journalists");
    expect(html).toContain("Headline signals: DWRS, EJ overlap, protest density");
    expect(html).toContain("Atlas TX dataset registry");
  });

  it("tags the homepage GitHub CTA for outbound telemetry", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('href="https://github.com/sbauwow/atlas-tx"');
    expect(html).toContain('data-event="outbound"');
    expect(html).toContain('data-event-target="repo:github.com/sbauwow/atlas-tx@home"');
  });
});
