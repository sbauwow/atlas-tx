import { beforeEach, describe, expect, it, vi } from "vitest";

const listWatchlists = vi.fn();
const createWatchlist = vi.fn();
const getWatchlistDetail = vi.fn();
const updateWatchlist = vi.fn();
const deleteWatchlist = vi.fn();
const addWatchlistItem = vi.fn();
const removeWatchlistItem = vi.fn();

vi.mock("@/lib/watchlists/persistence", () => ({
  listWatchlists,
  createWatchlist,
  getWatchlistDetail,
  updateWatchlist,
  deleteWatchlist,
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

  it("updates a watchlist label and notes", async () => {
    updateWatchlist.mockResolvedValueOnce({
      id: "wl_3",
      workspaceId: "ws_1",
      label: "Permits",
      notes: "Fresh queue",
      createdAt: new Date("2026-05-09T19:00:00Z"),
      updatedAt: new Date("2026-05-09T19:06:00Z"),
      itemCount: 1,
    });

    const { PATCH } = await import("@/app/api/watchlists/[id]/route");
    const res = await PATCH(
      new Request("http://localhost/api/watchlists/wl_3", {
        method: "PATCH",
        body: JSON.stringify({ label: " Permits ", notes: "Fresh queue" }),
        headers: { "content-type": "application/json" },
      }) as never,
      { params: Promise.resolve({ id: "wl_3" }) },
    );

    expect(res.status).toBe(200);
    expect(updateWatchlist).toHaveBeenCalledWith("wl_3", { label: "Permits", notes: "Fresh queue" });
  });

  it("deletes a watchlist", async () => {
    deleteWatchlist.mockResolvedValueOnce({
      id: "wl_6",
      workspaceId: "ws_1",
      label: "Retired queue",
      notes: null,
      createdAt: new Date("2026-05-09T19:00:00Z"),
      updatedAt: new Date("2026-05-09T19:06:00Z"),
      itemCount: 0,
    });

    const { DELETE } = await import("@/app/api/watchlists/[id]/route");
    const res = await DELETE(new Request("http://localhost/api/watchlists/wl_6") as never, {
      params: Promise.resolve({ id: "wl_6" }),
    });

    expect(res.status).toBe(200);
    expect(deleteWatchlist).toHaveBeenCalledWith("wl_6");
    expect(await res.json()).toEqual({ deleted: { id: "wl_6", workspaceId: "ws_1" } });
  });

  it("adds permit items and maps duplicate conflicts to 409", async () => {
    addWatchlistItem.mockResolvedValueOnce({
      id: "item_2",
      watchlistId: "wl_4",
      itemType: "permit",
      itemKey: "wq0001",
      displayLabel: "WQ0001",
      notes: null,
      createdAt: new Date("2026-05-09T19:00:00Z"),
      updatedAt: new Date("2026-05-09T19:00:00Z"),
    });

    const { POST } = await import("@/app/api/watchlists/[id]/items/route");
    const createdRes = await POST(
      new Request("http://localhost/api/watchlists/wl_4/items", {
        method: "POST",
        body: JSON.stringify({ itemType: "permit", itemKey: "WQ0001", displayLabel: "WQ0001" }),
        headers: { "content-type": "application/json" },
      }) as never,
      { params: Promise.resolve({ id: "wl_4" }) },
    );

    expect(createdRes.status).toBe(201);
    expect(addWatchlistItem).toHaveBeenCalledWith({
      watchlistId: "wl_4",
      itemType: "permit",
      itemKey: "WQ0001",
      displayLabel: "WQ0001",
      notes: null,
    });

    addWatchlistItem.mockRejectedValueOnce({ name: "DuplicateWatchlistItemError", message: "watchlist item already exists" });

    const conflictRes = await POST(
      new Request("http://localhost/api/watchlists/wl_4/items", {
        method: "POST",
        body: JSON.stringify({ itemType: "permit", itemKey: "WQ0001" }),
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
