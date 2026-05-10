import MapShell from "./map-shell";

export const metadata = {
  title: "Map · Atlas TX",
  description:
    "Interactive Texas map with counties, TCEQ pending permits, and USGS stream gauges.",
};

export default function MapPage() {
  return (
    <main className="relative w-full" style={{ height: "calc(100vh - 3.5rem)" }}>
      <MapShell />
      <p className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] text-slate-300 backdrop-blur">
        Sources: TIGER county boundaries · TCEQ permits · USGS stream sites · OpenFreeMap / OSM
      </p>
    </main>
  );
}
