"use client";

import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("./map-client"), {
  ssr: false,
  loading: () => (
    <div
      className="flex w-full items-center justify-center text-sm text-slate-400"
      style={{ height: "100%" }}
    >
      Loading map…
    </div>
  ),
});

export default function MapShell() {
  return <MapClient />;
}
