import { describe, expect, it } from "vitest";

import { buildWatchlistFeed } from "@/lib/watchlists/feed";

describe("buildWatchlistFeed", () => {
  it("builds county matches plus operator and permit fallbacks", () => {
    const response = buildWatchlistFeed({
      generatedAt: "2026-05-10T00:00:00.000Z",
      watchlists: [
        {
          id: "wl_1",
          workspaceId: "ws_1",
          label: "Priority watchlist",
          notes: "Saved items",
          createdAt: new Date("2026-05-09T20:00:00.000Z"),
          updatedAt: new Date("2026-05-10T00:00:00.000Z"),
          itemCount: 3,
          items: [
            {
              id: "item_county",
              watchlistId: "wl_1",
              itemType: "county",
              itemKey: "travis-county",
              displayLabel: "Travis County",
              notes: JSON.stringify({
                version: 1,
                sourceId: "county:travis-county",
                kind: "County",
                href: "/counties/travis-county",
                summary: "Track county risk.",
                detail: "Saved from county analytics.",
                surface: "analytics",
              }),
              createdAt: new Date("2026-05-09T20:00:00.000Z"),
              updatedAt: new Date("2026-05-09T20:00:00.000Z"),
            },
            {
              id: "item_operator",
              watchlistId: "wl_1",
              itemType: "operator",
              itemKey: "acme-water",
              displayLabel: "Acme Water",
              notes: JSON.stringify({
                version: 1,
                sourceId: "operator:acme-water",
                kind: "Operator",
                href: "/operators/acme-water",
                summary: "Saved from operator lane.",
                detail: "Top operator to review.",
                surface: "operators",
              }),
              createdAt: new Date("2026-05-09T20:00:00.000Z"),
              updatedAt: new Date("2026-05-09T20:00:00.000Z"),
            },
            {
              id: "item_permit",
              watchlistId: "wl_1",
              itemType: "permit",
              itemKey: "wq0001",
              displayLabel: "WQ0001",
              notes: null,
              createdAt: new Date("2026-05-09T20:00:00.000Z"),
              updatedAt: new Date("2026-05-09T20:00:00.000Z"),
            },
          ],
        },
      ],
      artifacts: {
        countyMovers: {
          id: "county-movers",
          path: "/tmp/county-movers.json",
          available: true,
          generatedAt: "2026-05-09T22:08:46.795Z",
          note: null,
          data: {
            generatedAt: "2026-05-09T22:08:46.795Z",
            baselineSnapshotAt: "2026-05-09T22:05:56.932Z",
            comparisonSnapshotAt: "2026-05-09T22:08:46.795Z",
            movers: [
              {
                county: { name: "Travis County", slug: "travis-county" },
                movement: "steady",
                currentRank: 2,
                previousRank: 2,
                rankDelta: 0,
                currentRiskScore: 9.72,
                previousRiskScore: 9.72,
                scoreDelta: 0,
                currentPressureScore: 0.43,
                previousPressureScore: 0.43,
              },
            ],
          },
        },
        pressureRiskScatter: {
          id: "pressure-risk-scatter",
          path: "/tmp/pressure-risk-scatter.json",
          available: true,
          generatedAt: "2026-05-09T22:08:46.795Z",
          note: null,
          data: {
            generatedAt: "2026-05-09T22:08:46.795Z",
            points: [
              {
                county: { name: "Travis County", slug: "travis-county" },
                x: 0.43,
                y: 9.72,
                population: 1300000,
                impairedSegmentCount: 5,
                hydrologyLayerHitCount: 3,
                systemCount: 28,
                violationCount: 136,
                quadrant: "lower-pressure-high-risk",
              },
            ],
          },
        },
        sourceFreshness: {
          id: "source-freshness",
          path: "/tmp/source-freshness.json",
          available: true,
          generatedAt: "2026-05-09T22:08:46.795Z",
          note: null,
          data: {
            generatedAt: "2026-05-09T22:08:46.795Z",
            sources: [
              {
                sourceId: "sdwis",
                label: "EPA SDWIS Texas snapshot",
                artifactPath: "public/cache/sdwis-tx.json",
                source: "https://data.epa.gov/efservice",
                generatedAt: "2026-05-09T01:50:21.429Z",
                ageDays: 0.85,
                status: "fresh",
                rowCount: 11686,
                notes: ["Fresh enough for demo use."],
              },
            ],
          },
        },
      },
    });

    expect(response.generatedAt).toBe("2026-05-10T00:00:00.000Z");
    expect(response.watchlists).toHaveLength(1);
    expect(response.watchlists[0].entries).toHaveLength(3);

    const countyEntry = response.watchlists[0].entries[0];
    expect(countyEntry.status).toBe("matched");
    expect(countyEntry.signalType).toBe("county-analytics");
    expect(countyEntry.signals.movement).toMatchObject({ currentRank: 2, currentRiskScore: 9.72 });
    expect(countyEntry.signals.scatter).toMatchObject({ quadrant: "lower-pressure-high-risk", violationCount: 136 });

    const operatorEntry = response.watchlists[0].entries[1];
    expect(operatorEntry.status).toBe("no-model");
    expect(operatorEntry.signalType).toBe("operator-watchlist-metadata");
    expect(operatorEntry.summary).toBe("Saved from operator lane.");
    expect(operatorEntry.signals.fallbackReason).toBe("no operator movement model yet");

    const permitEntry = response.watchlists[0].entries[2];
    expect(permitEntry.status).toBe("no-model");
    expect(permitEntry.signalType).toBe("permit-watchlist-metadata");
    expect(permitEntry.href).toBe("/permits/wq0001");
    expect(permitEntry.signals.fallbackReason).toBe("no permit movement model yet");
  });

  it("gracefully marks county entries when artifacts are missing", () => {
    const response = buildWatchlistFeed({
      watchlists: [
        {
          id: "wl_2",
          workspaceId: "ws_1",
          label: "County only",
          notes: null,
          createdAt: new Date("2026-05-09T20:00:00.000Z"),
          updatedAt: new Date("2026-05-10T00:00:00.000Z"),
          itemCount: 1,
          items: [
            {
              id: "item_county_missing",
              watchlistId: "wl_2",
              itemType: "county",
              itemKey: "unknown-county",
              displayLabel: "Unknown County",
              notes: null,
              createdAt: new Date("2026-05-09T20:00:00.000Z"),
              updatedAt: new Date("2026-05-09T20:00:00.000Z"),
            },
          ],
        },
      ],
      artifacts: {
        countyMovers: {
          id: "county-movers",
          path: "/tmp/county-movers.json",
          available: false,
          generatedAt: null,
          note: "ENOENT",
          data: null,
        },
        pressureRiskScatter: {
          id: "pressure-risk-scatter",
          path: "/tmp/pressure-risk-scatter.json",
          available: false,
          generatedAt: null,
          note: "ENOENT",
          data: null,
        },
        sourceFreshness: {
          id: "source-freshness",
          path: "/tmp/source-freshness.json",
          available: false,
          generatedAt: null,
          note: "ENOENT",
          data: null,
        },
      },
    });

    const countyEntry = response.watchlists[0].entries[0];
    expect(countyEntry.status).toBe("artifact-unavailable");
    expect(countyEntry.summary).toContain("missing or unreadable");
    expect(response.artifacts.countyMovers.available).toBe(false);
    expect(response.artifacts.pressureRiskScatter.available).toBe(false);
  });
});
