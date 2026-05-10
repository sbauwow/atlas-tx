import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const repoRoot = "/home/stathis/Projects/atlas-tx";

let dbDir = "";
let dbPath = "";

beforeAll(async () => {
  dbDir = mkdtempSync(path.join(tmpdir(), "atlas-tx-watchlists-"));
  dbPath = path.join(dbDir, "watchlists.test.db");
  process.env.DATABASE_URL = `file:${dbPath}`;

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: "pipe",
  });

  vi.resetModules();
});

afterAll(async () => {
  const dbModule = await import("@/lib/db");
  await dbModule.prisma.$disconnect();
  globalThis.__atlasPrisma = undefined;
  rmSync(dbDir, { recursive: true, force: true });
});

describe("watchlist persistence", () => {
  it("creates, lists, and fetches watchlists in the default workspace", async () => {
    const persistence = await import("@/lib/watchlists/persistence");

    const created = await persistence.createWatchlist({
      label: "Priority counties",
      notes: "South Texas",
    });

    expect(created.label).toBe("Priority counties");
    expect(created.itemCount).toBe(0);

    const listed = await persistence.listWatchlists();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.id);

    const detail = await persistence.getWatchlistDetail(created.id);
    expect(detail?.workspaceId).toBe(created.workspaceId);
    expect(detail?.items).toEqual([]);
  });

  it("adds and removes normalized items and rejects duplicates", async () => {
    const persistence = await import("@/lib/watchlists/persistence");
    const created = await persistence.createWatchlist({ label: "Operators" });

    const item = await persistence.addWatchlistItem({
      watchlistId: created.id,
      itemType: "operator",
      itemKey: "  ACME Midstream  ",
      displayLabel: "ACME Midstream",
      notes: "Track permit activity",
    });

    expect(item.itemKey).toBe("acme midstream");

    await expect(
      persistence.addWatchlistItem({
        watchlistId: created.id,
        itemType: "operator",
        itemKey: "acme midstream",
      }),
    ).rejects.toMatchObject({ name: "DuplicateWatchlistItemError" });

    const detail = await persistence.getWatchlistDetail(created.id);
    expect(detail?.itemCount).toBe(1);
    expect(detail?.items[0]?.displayLabel).toBe("ACME Midstream");

    const removed = await persistence.removeWatchlistItem(created.id, item.id);
    expect(removed?.id).toBe(item.id);

    const afterRemove = await persistence.getWatchlistDetail(created.id);
    expect(afterRemove?.itemCount).toBe(0);
    expect(afterRemove?.items).toEqual([]);
  });
});
