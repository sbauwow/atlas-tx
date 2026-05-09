import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { runImageQa } from "@/lib/observations/qa";

/**
 * QA fixtures are synthesized programmatically with sharp so we don't have to
 * commit binary fixtures. The thresholds in qa.ts are tuned against typical
 * 512px-wide phone photos; the synthetic images below need to be challenging
 * enough to cross them.
 */

async function makeChecker(opts: {
  width: number;
  height: number;
  block?: number;
  blur?: number;
  brightness?: number;
}): Promise<Buffer> {
  const { width, height, block = 32, blur = 0, brightness = 1 } = opts;
  // Build a high-contrast checker so a non-blurry version has plenty of edges.
  const channels = 3;
  const pixels = Buffer.alloc(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const on = ((Math.floor(x / block) + Math.floor(y / block)) & 1) === 0;
      const v = on ? 240 : 16;
      const o = (y * width + x) * channels;
      pixels[o] = Math.round(v * brightness);
      pixels[o + 1] = Math.round(v * brightness);
      pixels[o + 2] = Math.round(v * brightness);
    }
  }
  let img = sharp(pixels, { raw: { width, height, channels } });
  if (blur > 0) img = img.blur(blur);
  return await img.jpeg({ quality: 90 }).toBuffer();
}

describe("runImageQa", () => {
  it("does not flag a sharp, well-lit image", async () => {
    const buf = await makeChecker({ width: 800, height: 800 });
    const qa = await runImageQa(buf);
    expect(qa.flags).not.toContain("blur");
    expect(qa.flags).not.toContain("low-light");
    expect(qa.metrics.laplacianVariance).toBeGreaterThan(100);
  });

  it("flags a heavily blurred image", async () => {
    const buf = await makeChecker({ width: 800, height: 800, blur: 12 });
    const qa = await runImageQa(buf);
    expect(qa.flags).toContain("blur");
  });

  it("flags a dark image", async () => {
    const buf = await makeChecker({ width: 800, height: 800, brightness: 0.1 });
    const qa = await runImageQa(buf);
    expect(qa.flags).toContain("low-light");
  });
});
