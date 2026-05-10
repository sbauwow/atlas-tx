import "server-only";

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { computeObservationComparison } from "@/lib/observations/comparison";
import {
  createObservation,
  findByImageHash,
  listRecent,
  updateAfterAnalysis,
} from "@/lib/observations/persistence";
import { runImageQa } from "@/lib/observations/qa";
import { decideStatus } from "@/lib/observations/status";
import { getReferenceChart } from "@/lib/observations/strips/chart-registry";
import type { ClientReading, ObservationRow, QaFlag } from "@/lib/observations/types";
import { OBSERVATION_SCHEMA_VERSION } from "@/lib/observations/types";
import { analyzeStripImage } from "@/lib/observations/vision";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"] as const);
const UPLOAD_DIR = path.join(process.cwd(), "data", "citizen-strips");

type AllowedMime = "image/jpeg" | "image/png" | "image/webp";

export async function GET() {
  const rows = await listRecent(100);
  return NextResponse.json({
    items: rows.map(toPublicView),
    notice: "Citizen-submitted observations. Non-regulatory. Bands only, never numeric measurements.",
  });
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }

  const image = form.get("image");
  const readingRaw = form.get("clientReading");
  const stripBrand = stringOrNull(form.get("stripBrand"));
  const countySlug = stringOrNull(form.get("countySlug"));

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "missing image" }, { status: 400 });
  }
  if (image.size === 0 || image.size > MAX_BYTES) {
    return NextResponse.json({ error: "image too large or empty" }, { status: 400 });
  }
  const mime = image.type;
  if (!ALLOWED_MIME.has(mime as AllowedMime)) {
    return NextResponse.json({ error: `unsupported mime: ${mime}` }, { status: 415 });
  }

  if (typeof readingRaw !== "string") {
    return NextResponse.json({ error: "missing clientReading" }, { status: 400 });
  }
  const clientReading = parseClientReading(readingRaw);
  if (!clientReading) {
    return NextResponse.json({ error: "invalid clientReading json" }, { status: 400 });
  }
  const chart = getReferenceChart(clientReading.chartId);

  const buffer = Buffer.from(await image.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex");

  const existing = await findByImageHash(hash);
  if (existing) {
    return NextResponse.json({ observation: toPublicView(existing), deduped: true });
  }

  const qa = await runImageQa(buffer);

  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  await mkdir(UPLOAD_DIR, { recursive: true });

  const created = await createObservation({
    kind: "strip",
    countySlug,
    stripBrand,
    imageHash: hash,
    clientReading,
    qaFlags: qa.flags,
    // imagePath is set after we know the row id
  });

  const imagePath = path.join(UPLOAD_DIR, `${created.id}.${ext}`);
  await writeFile(imagePath, buffer);

  const analysis = await analyzeStripImage({
    imageBase64: buffer.toString("base64"),
    mediaType: mime as AllowedMime,
    chart,
  }).catch(() => null);
  const llmReading = analysis?.reading ?? null;

  const decision = decideStatus({
    chart,
    clientReading,
    llmReading,
    serverQaFlags: qa.flags,
  });

  const updated = await updateAfterAnalysis({
    id: created.id,
    llmReading,
    llmModel: analysis?.modelLabel ?? null,
    agreement: decision.agreement,
    qaFlags: decision.mergedQaFlags,
    status: decision.status,
  });

  const comparison = llmReading
    ? await computeObservationComparison({
        observationId: updated.id,
        chart,
        llmReading,
        countySlug,
      }).catch(() => null)
    : null;

  return NextResponse.json(
    { observation: toPublicView(updated), comparison },
    { status: 201 },
  );
}

function stringOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function parseClientReading(raw: string): ClientReading | null {
  try {
    const parsed = JSON.parse(raw) as ClientReading;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.schemaVersion !== OBSERVATION_SCHEMA_VERSION ||
      typeof parsed.chartId !== "string" ||
      !Array.isArray(parsed.perAnalyte)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Public-safe projection: drop server filesystem path. */
function toPublicView(row: ObservationRow) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    kind: row.kind,
    countySlug: row.countySlug,
    stripBrand: row.stripBrand,
    clientReading: row.clientReading,
    llmReading: row.llmReading,
    llmModel: row.llmModel,
    agreement: row.agreement,
    qaFlags: row.qaFlags as readonly QaFlag[],
    status: row.status,
  };
}

export const __TEST_ONLY__ = { toPublicView, parseClientReading };
