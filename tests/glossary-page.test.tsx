import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import GlossaryPage from "@/app/glossary/page";

describe("Glossary page", () => {
  it("renders a dedicated glossary of Atlas TX acronyms and plain-English definitions", () => {
    const html = renderToStaticMarkup(<GlossaryPage />);

    expect(html).toContain("Atlas TX glossary");
    expect(html).toContain("Texas Commission on Environmental Quality");
    expect(html).toContain("TCEQ");
    expect(html).toContain("Drinking Water Risk Score");
    expect(html).toContain("DWRS");
    expect(html).toContain("Commissioners’ Integrated Database");
    expect(html).toContain("CID");
    expect(html).toContain("Hydrologic Unit Code");
    expect(html).toContain("HUC");
    expect(html).toContain('href="/education"');
    expect(html).toContain('href="/water"');
    expect(html).toContain('href="/permits"');
  });
});
