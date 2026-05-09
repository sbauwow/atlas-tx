import Link from "next/link";

import { StripCapture } from "./_components/StripCapture";

export const metadata = {
  title: "Citizen water observations · Atlas TX",
  description:
    "Non-regulatory prototype layer for citizen-submitted water test-strip photos. Bands only, never compliance readings.",
};

export default function CitizenPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="space-y-4">
        <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-wide text-amber-200">
          Prototype · non-regulatory observation layer
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          Citizen water observations
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Atlas TX&apos;s public-record stack (SDWIS, TCEQ, EJScreen, ACS) remains the authoritative
          water-risk source. This lane is a separate community-observation layer for prototyping
          smartphone-strip submissions. It does not feed the Drinking Water Risk Score and is not
          a compliance or diagnostic instrument.
        </p>
        <p className="text-sm text-slate-400">
          See{" "}
          <Link
            href="https://github.com/sbauwow/atlas-tx/blob/main/docs/research/smartphone-colorimetry.md"
            className="underline underline-offset-2 hover:text-slate-200"
          >
            docs/research/smartphone-colorimetry.md
          </Link>
          {" "}for the project&apos;s framing and the non-negotiables that govern this layer.
        </p>
      </header>

      <section>
        <StripCapture />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <MethodCard
          name="Color test strips"
          summary="9-pad freshwater strip — pH, chlorine, hardness, alkalinity, nitrate, nitrite, iron, copper."
          enabled
        />
        <MethodCard
          name="TDS / pH meter (OCR)"
          summary="Photograph a digital meter readout; vision OCRs the digits."
        />
        <MethodCard
          name="Tap-water visual self-report"
          summary="Photo of a glass plus structured smell/taste form. No equipment required."
        />
        <MethodCard
          name="Plumbing-age proxy form"
          summary="Year-built / pipe-material questionnaire. Surfaces lead-risk context."
        />
      </section>
    </main>
  );
}

function MethodCard({
  name,
  summary,
  enabled = false,
}: {
  name: string;
  summary: string;
  enabled?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        enabled ? "border-cyan-400/40 bg-cyan-400/5" : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">{name}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
            enabled ? "bg-cyan-400/20 text-cyan-200" : "bg-slate-800 text-slate-500"
          }`}
        >
          {enabled ? "v1" : "soon"}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-400">{summary}</p>
    </div>
  );
}
