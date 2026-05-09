import "server-only";

import { prisma } from "../db";
import type {
  ClientReading,
  LlmReading,
  ObservationKind,
  ObservationRow,
  ObservationStatus,
  QaFlag,
} from "./types";

/**
 * Prisma DAL for water observations. JSON columns are serialized at the boundary
 * so the rest of the app deals in typed objects.
 */

export interface CreateObservationInput {
  readonly kind: ObservationKind;
  readonly countySlug?: string | null;
  readonly imagePath?: string | null;
  readonly imageHash?: string | null;
  readonly stripBrand?: string | null;
  readonly clientReading: ClientReading;
  readonly qaFlags: readonly QaFlag[];
}

export async function createObservation(
  input: CreateObservationInput,
): Promise<ObservationRow> {
  const row = await prisma.waterObservation.create({
    data: {
      kind: input.kind,
      countySlug: input.countySlug ?? null,
      imagePath: input.imagePath ?? null,
      imageHash: input.imageHash ?? null,
      stripBrand: input.stripBrand ?? null,
      clientReading: JSON.stringify(input.clientReading),
      qaFlags: JSON.stringify(input.qaFlags),
      status: "pending",
    },
  });
  return rehydrate(row);
}

export interface UpdateAfterAnalysisInput {
  readonly id: string;
  readonly llmReading: LlmReading | null;
  readonly llmModel: string | null;
  readonly agreement: number | null;
  readonly qaFlags: readonly QaFlag[];
  readonly status: ObservationStatus;
}

export async function updateAfterAnalysis(
  input: UpdateAfterAnalysisInput,
): Promise<ObservationRow> {
  const row = await prisma.waterObservation.update({
    where: { id: input.id },
    data: {
      llmReading: input.llmReading ? JSON.stringify(input.llmReading) : null,
      llmModel: input.llmModel,
      agreement: input.agreement,
      qaFlags: JSON.stringify(input.qaFlags),
      status: input.status,
    },
  });
  return rehydrate(row);
}

export async function findByImageHash(
  hash: string,
): Promise<ObservationRow | null> {
  const row = await prisma.waterObservation.findUnique({
    where: { imageHash: hash },
  });
  return row ? rehydrate(row) : null;
}

export async function findById(id: string): Promise<ObservationRow | null> {
  const row = await prisma.waterObservation.findUnique({ where: { id } });
  return row ? rehydrate(row) : null;
}

export async function listRecent(limit = 100): Promise<readonly ObservationRow[]> {
  const rows = await prisma.waterObservation.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(500, limit)),
  });
  return rows.map(rehydrate);
}

type DbRow = Awaited<ReturnType<typeof prisma.waterObservation.findUnique>>;

function rehydrate(row: NonNullable<DbRow>): ObservationRow {
  return {
    id: row.id,
    createdAt: row.createdAt,
    kind: row.kind as ObservationKind,
    countySlug: row.countySlug,
    imagePath: row.imagePath,
    imageHash: row.imageHash,
    stripBrand: row.stripBrand,
    clientReading: JSON.parse(row.clientReading) as ClientReading,
    llmReading: row.llmReading ? (JSON.parse(row.llmReading) as LlmReading) : null,
    llmModel: row.llmModel,
    agreement: row.agreement,
    qaFlags: row.qaFlags ? (JSON.parse(row.qaFlags) as QaFlag[]) : [],
    status: row.status as ObservationStatus,
  };
}

export const __TEST_ONLY__ = { rehydrate };
