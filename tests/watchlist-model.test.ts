import { describe, expect, it } from "vitest";

import {
  DEFAULT_WATCHLIST_ID,
  buildWatchlistExport,
  createWatchlist,
  loadWatchlistsFromStorage,
  removeWatchlist,
  removeWatchlistItem,
  upsertWatchlistItem,
} from "@/app/watchlists/watchlist-model";

describe("watchlist model", () => {
  it("creates custom watchlists and always preserves the shared default", () => {
    const watchlists = createWatchlist([], "South Texas", "Shared triage for coastal counties", "2026-05-10T00:00:00.000Z");

    expect(watchlists[0]?.id).toBe(DEFAULT_WATCHLIST_ID);
    expect(watchlists[1]?.id).toBe("south-texas");
    expect(watchlists[1]?.description).toContain("coastal counties");
  });

  it("upserts and removes items without duplicating saved lanes", () => {
    const seed = createWatchlist([], "Operators", "", "2026-05-10T00:00:00.000Z");
    const firstSave = upsertWatchlistItem(
      seed,
      "operators",
      {
        id: "operator:alpha-water-llc",
        kind: "Operator",
        label: "Alpha Water LLC",
        href: "/operators/alpha-water-llc",
        summary: "2 permits · 1 case · 10 pressure",
        detail: "Travis County · Hays County",
        surface: "operators",
      },
      "2026-05-10T00:05:00.000Z",
    );

    expect(firstSave.alreadySaved).toBe(false);
    expect(firstSave.watchlists.find((entry) => entry.id === "operators")?.items).toHaveLength(1);

    const secondSave = upsertWatchlistItem(
      firstSave.watchlists,
      "operators",
      {
        id: "operator:alpha-water-llc",
        kind: "Operator",
        label: "Alpha Water LLC",
        href: "/operators/alpha-water-llc",
        summary: "2 permits · 1 case · 10 pressure",
        detail: "Travis County · Hays County",
        surface: "operators",
      },
      "2026-05-10T00:06:00.000Z",
    );

    expect(secondSave.alreadySaved).toBe(true);
    expect(secondSave.watchlists.find((entry) => entry.id === "operators")?.items).toHaveLength(1);

    const removedItem = removeWatchlistItem(secondSave.watchlists, "operators", "operator:alpha-water-llc", "2026-05-10T00:07:00.000Z");
    expect(removedItem.find((entry) => entry.id === "operators")?.items).toHaveLength(0);

    const removedList = removeWatchlist(removedItem, "operators");
    expect(removedList.some((entry) => entry.id === "operators")).toBe(false);
    expect(removedList.some((entry) => entry.id === DEFAULT_WATCHLIST_ID)).toBe(true);
  });

  it("loads both bare arrays and wrapped payloads from storage and exports clean queue lines", () => {
    const getItem = () =>
      JSON.stringify({
        version: 1,
        watchlists: [
          {
            id: "briefing",
            name: "Briefing",
            description: "Shared briefing queue",
            scopeLabel: "Local/shared in this browser",
            createdAt: "2026-05-10T00:00:00.000Z",
            updatedAt: "2026-05-10T00:00:00.000Z",
            items: [
              {
                id: "county:harris-county",
                kind: "County",
                label: "Harris County",
                href: "/counties/harris-county",
                summary: "Risk +3.6 · pressure 100",
                detail: "Opened from analytics",
                surface: "analytics",
                addedAt: "2026-05-10T00:01:00.000Z",
              },
            ],
          },
        ],
      });

    const watchlists = loadWatchlistsFromStorage({ getItem });
    expect(watchlists.some((entry) => entry.id === DEFAULT_WATCHLIST_ID)).toBe(true);
    expect(watchlists.some((entry) => entry.id === "briefing")).toBe(true);

    const exportValue = buildWatchlistExport(watchlists.find((entry) => entry.id === "briefing")?.items ?? []);
    expect(exportValue).toContain("county | Harris County | /counties/harris-county | Risk +3.6 · pressure 100 | Opened from analytics");
  });
});
