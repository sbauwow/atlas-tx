import { beforeEach, describe, expect, it, vi } from "vitest";

const listWatchlists = vi.fn();
const createWatchlist = vi.fn();
const getWatchlistDetail = vi.fn();
const addWatchlistItem = vi.fn();
const removeWatchlistItem = vi.fn();

vi.mock("@/lib/watchlists/persistence", () => ({
  listWatchlists,
  createWatchlist,
  getWatchlistDetail,
  addWatchlistItem,
  removeWatchlistItem,
}));

describe("watchlist API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists watchlists", async () => {
    listWatchlists.mockResolvedValueOnce([
      {
        id: "wl_1",
        workspaceId: "ws_1",
        label: "Priority counties",
        notes: null,
        createdAt: new Date("2026-05-09T19:00:00Z"),
        updatedAt: new Date("2026-05-09T19:05:00Z"),
        itemCount: 2,
      },
    ]);

    const { GET } = await import("@/app/api/watchlists/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].itemCount).toBe(2);
    expect(body.workspace.slug).toBe("default");
  });

  it("creates a watchlist", async () => {
    createWatchlist.mockResolvedValueOnce({
      id: "wl_2",
      workspaceId: "ws_1",
      label: "Operators",
      notes: "Top emitters",
      createdAt: new Date("2026-05-09T19:00:00Z"),
      updatedAt: new Date("2026-05-09T19:00:00Z"),
      itemCount: 0,
    });

    const { POST } = await import("@/app/api/watchlists/route");
    const res = await POST(
      new Request("http://localhost/api/watchlists", {
        method: "POST",
        body: JSON.stringify({ label: " Operators ", notes: "Top emitters" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(res.status).toBe(201);
    expect(createWatchlist).toHaveBeenCalledWith({ label: "Operators", notes: "Top emitters" });
  });

  it("returns watchlist detail", async () => {
    getWatchlistDetail.mockResolvedValueOnce({
      id: "wl_3",
      workspaceId: "ws_1",
      label: "Mixed",
      notes: null,
      createdAt: new Date("2026-05-09T19:00:00Z"),
      updatedAt: new Date("2026-05-09T19:00:00Z"),
      itemCount: 1,
      items: [
        {
          id: "item_1",
          watchlistId: "wl_3",
          itemType: "county",
          itemKey: "travis",
          displayLabel: "Travis County",
          notes: null,
          createdAt: new Date("2026-05-09T19:00:00Z"),
          updatedAt: new Date("2026-05-09T19:00:00Z"),
        },
      ],
    });

    const { GET } = await import("@/app/api/watchlists/[id]/route");
    const res = await GET(new Request("http://localhost/api/watchlists/wl_3") as never, {
      params: Promise.resolve({ id: "wl_3" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.watchlist.items[0].itemType).toBe("county");
  });

  it("adds items and maps duplicate conflicts to 409", async () => {
    addWatchlistItem.mockResolvedValueOnce({
      id: "item_2",
      watchlistId: "wl_4",
      itemType: "operator",
      itemKey: "acme midstream",
      displayLabel: "ACME Midstream",
      notes: null,
      createdAt: new Date("2026-05-09T19:00:00Z"),
      updatedAt: new Date("2026-05-09T19:00:00Z"),
    });

    const { POST } = await import("@/app/api/watchlists/[id]/items/route");
    const createdRes = await POST(
      new Request("http://localhost/api/watchlists/wl_4/items", {
        method: "POST",
        body: JSON.stringify({ itemType: "operator", itemKey: "ACME Midstream" }),
        headers: { "content-type": "application/json" },
      }) as never,
      { params: Promise.resolve({ id: "wl_4" }) },
    );

    expect(createdRes.status).toBe(201);
    expect(addWatchlistItem).toHaveBeenCalledWith({
      watchlistId: "wl_4",
      itemType: "operator",
      itemKey: "ACME Midstream",
      displayLabel: null,
      notes: null,
    });

    addWatchlistItem.mockRejectedValueOnce({ name: "DuplicateWatchlistItemError", message: "watchlist item already exists" });

    const conflictRes = await POST(
      new Request("http://localhost/api/watchlists/wl_4/items", {
        method: "POST",
        body: JSON.stringify({ itemType: "operator", itemKey: "ACME Midstream" }),
        headers: { "content-type": "application/json" },
      }) as never,
      { params: Promise.resolve({ id: "wl_4" }) },
    );

    expect(conflictRes.status).toBe(409);
  });

  it("removes items", async () => {
    removeWatchlistItem.mockResolvedValueOnce({ id: "item_3", watchlistId: "wl_5" });

    const { DELETE } = await import("@/app/api/watchlists/[id]/items/[itemId]/route");
    const res = await DELETE(new Request("http://localhost/api/watchlists/wl_5/items/item_3") as never, {
      params: Promise.resolve({ id: "wl_5", itemId: "item_3" }),
    });

    expect(res.status).toBe(200);
    expect(removeWatchlistItem).toHaveBeenCalledWith("wl_5", "item_3");
  });
});
