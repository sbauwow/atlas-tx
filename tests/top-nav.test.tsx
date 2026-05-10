import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/app/components/tracked-link", () => ({
  default: ({ event, eventTarget, href, children, className }: { event: string; eventTarget?: string; href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} data-event={event} data-event-target={eventTarget} className={className}>{children}</a>
  ),
}));

import TopNav from "@/app/components/top-nav";

describe("TopNav", () => {
  it("renders brand + primary route links", () => {
    const html = renderToStaticMarkup(<TopNav />);

    expect(html).toContain("Atlas TX");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/analytics"');
    expect(html).toContain('href="/watchlists"');
    expect(html).toContain('href="/operators"');
    expect(html).toContain('href="/water"');
    expect(html).toContain('href="/counties"');
    expect(html).toContain('href="/education"');
    expect(html).toContain('href="/glossary"');
    expect(html).toContain('href="/api/health"');
  });

  it("tags the GitHub link for outbound telemetry", () => {
    const html = renderToStaticMarkup(<TopNav />);

    expect(html).toContain('href="https://github.com/sbauwow/atlas-tx"');
    expect(html).toContain('data-event="outbound"');
    expect(html).toContain('data-event-target="repo:github.com/sbauwow/atlas-tx@nav"');
  });
});
