type UncertaintyLevel = "measured" | "seeded" | "modeled" | "sparse";

const LEVEL_CLASS: Record<UncertaintyLevel, string> = {
  measured: "border-emerald-300/40 bg-emerald-500/15 text-emerald-200",
  seeded: "border-cyan-300/40 bg-cyan-500/15 text-cyan-200",
  modeled: "border-amber-300/40 bg-amber-500/15 text-amber-200",
  sparse: "border-fuchsia-300/40 bg-fuchsia-500/15 text-fuchsia-200",
};

const LEVEL_LABEL: Record<UncertaintyLevel, string> = {
  measured: "Measured",
  seeded: "Seeded",
  modeled: "Modeled",
  sparse: "Sparse",
};

export default function UncertaintyBadge({ level }: { level: UncertaintyLevel }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${LEVEL_CLASS[level]}`}>
      {LEVEL_LABEL[level]}
    </span>
  );
}
