import Link from "next/link";
import { notFound } from "next/navigation";

import { findById } from "@/lib/observations/persistence";

import { ResultsCard, type ObservationView } from "../_components/ResultsCard";

export const dynamic = "force-dynamic";

export default async function ObservationDetail(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const row = await findById(id);
  if (!row) notFound();

  const view: ObservationView = {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
    agreement: row.agreement,
    clientReading: row.clientReading,
    llmReading: row.llmReading,
    llmModel: row.llmModel,
    qaFlags: row.qaFlags,
    stripBrand: row.stripBrand,
    countySlug: row.countySlug,
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="space-y-2">
        <Link href="/citizen" className="text-xs text-slate-400 hover:text-slate-200">
          ← Submit another
        </Link>
        <h1 className="text-3xl font-semibold text-white">Observation {row.id.slice(0, 8)}</h1>
        <p className="text-xs text-slate-500">
          {row.createdAt.toISOString()} · kind: {row.kind}
        </p>
      </div>
      <ResultsCard observation={view} />
    </main>
  );
}
