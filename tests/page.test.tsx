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
    expect(html).toContain("Atlas TX joins Texas permit and water-system context with federal");
    expect(html).toContain("Safe Drinking Water Information System");
    expect(html).toContain("American Community Survey");
    expect(html).toContain("Journalists, policy analysts, and civic-tech teams");
    expect(html).toContain('href=\"/counties\"');
    expect(html).toContain('href=\"/analytics\"');
    expect(html).toContain('href=\"/operators\"');
    expect(html).toContain("Statewide analytics terminal");
    expect(html).toContain("Operator directory");
    expect(html).toContain("County workspace overview");
    expect(html).toContain("Entry paths");
    expect(html).toContain("Permit tracker");
    expect(html).toContain('href=\"/permits\"');
  });

  it("surfaces live workflow counts on the homepage entry cards", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain("17 pending permits");
    expect(html).toContain("254 ranked counties");
    expect(html).toContain("5 active alerts · 13 gauges");
  });

  it("turns workflow counts into clickable status links", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('href="/water?mode=mismatch"');
    expect(html).toContain("View live status");
    expect(html).toContain('href="/counties#top-counties"');
    expect(html).toContain("View top counties");
    expect(html).toContain('href="/permits#top-counties"');
    expect(html).toContain("View permit hotspots");
  });

  it("adds a fast homepage callout for the statewide analytics terminal", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain("New statewide screen");
    expect(html).toContain("Analytics terminal");
    expect(html).toContain("pressure-versus-risk screening");
    expect(html).toContain("Open analytics");
    expect(html).toContain('href="/analytics"');
  });

  it("adds a concise homepage operator callout", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain("Entity navigation");
    expect(html).toContain("Operator directory");
    expect(html).toContain("permittee and applicant footprints");
    expect(html).toContain("Open operators");
    expect(html).toContain('href="/operators"');
  });

  it("describes the refocused product thesis and signals", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain("Water-risk thesis");
    expect(html).toContain("Drinking Water Risk Score");
    expect(html).toContain("environmental-justice overlap");
    expect(html).toContain("Headline signals");
    expect(html).toContain("Atlas TX dataset registry");
    expect(html).toContain("title=\"Texas Commission on Environmental Quality\"");
  });

  it("tags the homepage GitHub CTA for outbound telemetry", async () => {
    const html = renderToStaticMarkup(await Home());

    expect(html).toContain('href="https://github.com/sbauwow/atlas-tx"');
    expect(html).toContain('data-event="outbound"');
    expect(html).toContain('data-event-target="repo:github.com/sbauwow/atlas-tx@home"');
  });
});
