import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import Home from "@/app/page";

describe("Home landing page", () => {
  it("frames Atlas TX as a Texas drinking-water-risk and EJ explorer", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Atlas TX · Texas water risk explorer");
    expect(html).toContain("Surface Texas drinking-water risk and environmental-justice burden.");
    expect(html).toContain("Atlas TX joins Texas permit and water-system context with federal SDWIS, EJScreen, and ACS data");
    expect(html).toContain("Journalists, policy analysts, and civic-tech teams");
  });

  it("describes the refocused product thesis and signals", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Water-risk thesis");
    expect(html).toContain("Start with DWRS + EJ overlap + cited permit context.");
    expect(html).toContain("Primary user: Texas county-newsroom journalists");
    expect(html).toContain("Headline signals: DWRS, EJ overlap, protest density");
    expect(html).toContain("Atlas TX dataset registry");
  });
});
