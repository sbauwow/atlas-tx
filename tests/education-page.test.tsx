import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import EducationPage from "@/app/education/page";

describe("Education page", () => {
  it("explains the Texas water system with Atlas TX framing", () => {
    const html = renderToStaticMarkup(<EducationPage />);

    expect(html).toContain("Texas water system guide.");
    expect(html).toContain("where Texas water comes from, how it moves, who governs it");
    expect(html).toContain("Texas Commission on Environmental Quality");
    expect(html).toContain("Texas Water Development Board");
    expect(html).toContain("Public Water System");
    expect(html).toContain("The four core questions");
    expect(html).toContain("Texas water system at a glance");
    expect(html).toContain("Rain + recharge");
    expect(html).toContain("Treatment + delivery");
    expect(html).toContain("Wastewater + reuse");
    expect(html).toContain("Surface water");
    expect(html).toContain("Groundwater");
    expect(html).toContain("How water moves through Texas");
    expect(html).toContain("Who governs it");
    expect(html).toContain("Why county water risk is uneven");
    expect(html).toContain('title="Texas Commission on Environmental Quality"');
    expect(html).toContain('title="Texas Water Development Board"');
  });

  it("links the education experience back into the main product surfaces", () => {
    const html = renderToStaticMarkup(<EducationPage />);

    expect(html).toContain('href="/water"');
    expect(html).toContain('href="/"');
    expect(html).toContain("Texas water system at a glance");
    expect(html).toContain("Surface water");
    expect(html).toContain("Groundwater");
  });
});
