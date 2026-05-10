import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("watchlists page", () => {
  it("renders the local/shared watchlists workspace with graceful empty states", async () => {
    const pageModule = await import("@/app/watchlists/page");
    const page = pageModule.default();
    const text = renderToStaticMarkup(page);

    expect(text).toContain("Saved watchlists");
    expect(text).toContain("Local/shared until auth exists");
    expect(text).toContain("Create watchlist");
    expect(text).toContain("Shared triage");
    expect(text).toContain("Nothing is saved in this watchlist yet.");
    expect(text).toContain("analytics");
    expect(text).toContain("operators");
    expect(text).toContain('href="/analytics"');
    expect(text).toContain('href="/operators"');
  });
});
