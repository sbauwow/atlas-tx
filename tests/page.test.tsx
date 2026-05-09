import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/app/components/tracked-link", () => ({
  default: ({ event, eventTarget, href, children, className }: { event: string; eventTarget?: string; href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} data-event={event} data-event-target={eventTarget} className={className}>{children}</a>
  ),
}));

import Home from "@/app/page";

describe("Home landing page", () => {
  it("frames Atlas TX as a Texas drinking-water-risk and EJ explorer", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Atlas TX · Texas water risk explorer");
    expect(html).toContain("Surface Texas drinking-water risk and environmental-justice burden.");
    expect(html).toContain("Atlas TX joins Texas permit and water-system context with federal SDWIS, EJScreen, and ACS data");
    expect(html).toContain("Journalists, policy analysts, and civic-tech teams");
  });

  it("describes the refocused product thesis and signals", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Water-risk thesis");
    expect(html).toContain("Start with DWRS + EJ overlap + cited permit context.");
    expect(html).toContain("Primary user: Texas county-newsroom journalists");
    expect(html).toContain("Headline signals: DWRS, EJ overlap, protest density");
    expect(html).toContain("Atlas TX dataset registry");
  });

  it("tags the homepage GitHub CTA for outbound telemetry", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain('href="https://github.com/sbauwow/atlas-tx"');
    expect(html).toContain('data-event="outbound"');
    expect(html).toContain('data-event-target="repo:github.com/sbauwow/atlas-tx@home"');
  });
});
