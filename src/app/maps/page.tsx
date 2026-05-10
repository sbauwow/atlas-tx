import InteractiveShell from "./_components/interactive-shell";

export const metadata = {
  title: "Atlas TX — Maps",
  description:
    "Interactive Texas water-risk map. Toggle TCEQ permits, USGS gauges, basemap, and per-county choropleth views.",
};

export default function MapsPage() {
  return (
    <main className="relative w-full" style={{ height: "calc(100vh - 3.5rem)" }}>
      <InteractiveShell />
      <p className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] text-slate-300 backdrop-blur">
        Sources: TIGER counties · TCEQ permits · USGS gauges · OpenStreetMap / CARTO · Esri Imagery
      </p>
    </main>
  );
}
