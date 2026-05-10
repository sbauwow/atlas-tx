"use client";

import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("./interactive-map"), {
  ssr: false,
  loading: () => (
    <div className="flex w-full items-center justify-center text-sm text-slate-400" style={{ height: "100%" }}>
      Loading map…
    </div>
  ),
});

export default function InteractiveShell() {
  return <InteractiveMap />;
}
