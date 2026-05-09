import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
}));

vi.mock("@/app/components/page-view-beacon", () => ({
  default: () => <span data-testid="page-view-beacon" />,
}));

describe("RootLayout telemetry", () => {
  it("mounts the page-view beacon once for route-level telemetry", async () => {
    const { default: RootLayout } = await import("@/app/layout");
    const html = renderToStaticMarkup(<RootLayout><main>hello</main></RootLayout>);

    expect(html).toContain('data-testid="page-view-beacon"');
    expect(html).toContain("hello");
    expect(html).toContain('href="/glossary"');
    expect(html).toContain("Atlas TX public-interest county intelligence");
  });
});
