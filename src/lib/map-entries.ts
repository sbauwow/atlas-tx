export type MapEntryStatus = "live" | "scaffold" | "coming-soon";

export type MapEntry = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  liveLayer: string;
  status: MapEntryStatus;
};

export const MAP_ENTRIES: MapEntry[] = [
  {
    slug: "weather",
    title: "Weather context",
    eyebrow: "NWS · drought · precip · temp",
    description: "Active hazard footprint, drought class, short-term rainfall, and temperature anomaly per county.",
    liveLayer: "Surface water assessment context (cached)",
    status: "scaffold",
  },
  {
    slug: "ej",
    title: "Environmental-justice burden",
    eyebrow: "SDWIS · DWRS proxy · ACS",
    description: "Drinking-water health-based violations and population-served burden across Texas counties.",
    liveLayer: "SDWIS health-based violations per county (11,686 rows cached)",
    status: "live",
  },
  {
    slug: "operators",
    title: "Operator footprint",
    eyebrow: "TCEQ · CID concentration",
    description: "Where pending TCEQ permits and CID procedural pressure concentrate per operator and per county.",
    liveLayer: "Pending-permit county counts + top operator share",
    status: "live",
  },
  {
    slug: "citizen",
    title: "Citizen observations",
    eyebrow: "Grassroots strip submissions",
    description: "Recent citizen-submitted water-strip readings aggregated to county footprints.",
    liveLayer: "Observations table joined to county geometry",
    status: "scaffold",
  },
  {
    slug: "energy",
    title: "Energy footprint",
    eyebrow: "ERCOT · EIA-860 · RRC wells",
    description: "Where Texas energy infrastructure sits — power plants, oil and gas wells, grid-region edges.",
    liveLayer: "Coming soon — EIA-860 + RRC well snapshots not yet cached",
    status: "coming-soon",
  },
  {
    slug: "open-data",
    title: "Open-data discovery",
    eyebrow: "Austin · Dallas · Houston · San Antonio",
    description: "What Texas city portals publish in water, permits, and infrastructure themes.",
    liveLayer: "Curated city catalog (897 themed datasets across 4 portals)",
    status: "live",
  },
  {
    slug: "satellite",
    title: "Satellite imagery",
    eyebrow: "Esri · NAIP",
    description: "Aerial basemap with Atlas county overlays for quick visual context.",
    liveLayer: "Esri World Imagery basemap + TX county outline overlay",
    status: "live",
  },
];

export const MAP_STATUS_CHIP: Record<MapEntryStatus, { label: string; classes: string }> = {
  live: {
    label: "Live layer",
    classes: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  },
  scaffold: {
    label: "Scaffold + 1 layer",
    classes: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  },
  "coming-soon": {
    label: "Coming soon",
    classes: "border-white/15 bg-white/5 text-slate-300",
  },
};
