import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("watchlists page", () => {
  it("renders the persisted watchlists workspace with graceful empty states", async () => {
    const pageModule = await import("@/app/watchlists/page");
    const page = pageModule.default();
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Saved watchlists");
    expect(text).toContain("Saved-screen change feed");
    expect(text).toContain("Loading recent changes…");
    expect(text).toContain("permit lanes");
    expect(text).toContain("Create watchlist");
    expect(text).toContain("Shared triage");
    expect(text).toContain("Nothing is saved in this watchlist yet.");
    expect(text).toContain("No recent watchlist changes yet.");
    expect(text).toContain("analytics");
    expect(text).toContain("operators");
    expect(text).toContain("permits");
    expect(text).toContain('href="/analytics"');
    expect(text).toContain('href="/operators"');
    expect(text).toContain('href="/permits"');
    expect(text).toContain("Edit details");
    expect(text).toContain("API-backed with edit and delete controls");
  });

  it("normalizes the nested watchlist feed API payload", async () => {
    const { normalizeWatchlistFeedPayload } = await import("@/app/watchlists/watchlist-client");

    const entries = normalizeWatchlistFeedPayload({
      generatedAt: "2026-05-11T13:00:00.000Z",
      watchlists: [
        {
          id: "wl_1",
          label: "County queue",
          entries: [
            {
              id: "feed_1",
              itemType: "county",
              label: "Travis County",
              href: "/analytics?county=travis",
              status: "matched",
              signalType: "county-analytics",
              headline: "Travis County climbed into the high-pressure quadrant.",
              summary: "Pressure and risk both moved up in the latest artifact refresh.",
              detail: "County movers and scatter snapshots both flagged Travis County.",
              updatedAt: "2026-05-11T12:00:00.000Z",
            },
          ],
        },
        {
          id: "wl_2",
          label: "Permit queue",
          entries: [
            {
              id: "feed_2",
              itemType: "permit",
              label: "WQ0002",
              href: "/permits/WQ0002",
              status: "no-model",
              signalType: "permit-watchlist-metadata",
              headline: "WQ0002 has no current permit-side model.",
              summary: "Atlas kept the saved permit in the feed with metadata only.",
              detail: "No extra artifact match was available for this permit.",
              updatedAt: "2026-05-10T12:00:00.000Z",
            },
          ],
        },
      ],
    });

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: "feed_1",
      watchlistLabel: "County queue",
      itemLabel: "Travis County",
      itemKind: "County",
      href: "/analytics?county=travis",
      surface: "analytics",
      badgeLabel: "Matched",
      sourceLabel: "County analytics",
      headline: "Travis County climbed into the high-pressure quadrant.",
    });
    expect(entries[1]).toMatchObject({
      id: "feed_2",
      watchlistLabel: "Permit queue",
      itemLabel: "WQ0002",
      itemKind: "Permit",
      href: "/permits/WQ0002",
      badgeLabel: "No model",
      sourceLabel: "Permit metadata",
    });
  });

  it("derives recent saved lanes when the feed API is unavailable", async () => {
    const { deriveFallbackFeedEntries } = await import("@/app/watchlists/watchlist-client");

    const entries = deriveFallbackFeedEntries([
      {
        id: "shared-triage",
        name: "Shared triage",
        description: "Shared queue",
        scopeLabel: "Shared workspace",
        createdAt: "2026-05-08T00:00:00.000Z",
        updatedAt: "2026-05-08T00:00:00.000Z",
        items: [
          {
            id: "county:travis",
            kind: "County",
            label: "Travis County",
            href: "/analytics?county=travis",
            summary: "Summary",
            detail: "Detail",
            surface: "analytics",
            addedAt: "2026-05-11T12:00:00.000Z",
          },
        ],
      },
      {
        id: "permits",
        name: "Permits",
        description: "Permit queue",
        scopeLabel: "Shared workspace",
        createdAt: "2026-05-08T00:00:00.000Z",
        updatedAt: "2026-05-08T00:00:00.000Z",
        items: [
          {
            id: "permit:WQ0002",
            kind: "Permit",
            label: "WQ0002",
            href: "/permits/WQ0002",
            summary: "Summary",
            detail: "Detail",
            surface: "permits",
            addedAt: "2026-05-10T12:00:00.000Z",
          },
        ],
      },
    ]);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      action: "saved",
      itemLabel: "Travis County",
      watchlistLabel: "Shared triage",
      headline: "Travis County saved in Shared triage.",
      badgeLabel: "Saved lane",
      sourceLabel: "Saved lanes",
    });
    expect(entries[1]).toMatchObject({
      itemLabel: "WQ0002",
      watchlistLabel: "Permits",
    });
  });
});
