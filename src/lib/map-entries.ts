export type MapEntry = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
};

export const MAP_ENTRIES: MapEntry[] = [
  {
    slug: "weather",
    title: "Weather context",
    eyebrow: "NWS · drought · precip · temp",
    description: "Active hazard footprint, drought class, short-term rainfall, and temperature anomaly per county.",
  },
  {
    slug: "ej",
    title: "Environmental-justice burden",
    eyebrow: "SDWIS · DWRS proxy · ACS",
    description: "Drinking-water health-based violations and population-served burden across Texas counties.",
  },
  {
    slug: "operators",
    title: "Operator footprint",
    eyebrow: "TCEQ · CID concentration",
    description: "Where pending TCEQ permits and CID procedural pressure concentrate per operator and per county.",
  },
  {
    slug: "citizen",
    title: "Citizen observations",
    eyebrow: "Grassroots strip submissions",
    description: "Recent citizen-submitted water-strip readings aggregated to county footprints.",
  },
  {
    slug: "energy",
    title: "Energy footprint",
    eyebrow: "ERCOT · EIA-860 · RRC wells",
    description: "Where Texas energy infrastructure sits — power plants, oil and gas wells, grid-region edges.",
  },
  {
    slug: "open-data",
    title: "Open-data discovery",
    eyebrow: "Austin · Dallas · Houston · San Antonio",
    description: "What Texas city portals publish in water, permits, and infrastructure themes.",
  },
  {
    slug: "satellite",
    title: "Satellite imagery",
    eyebrow: "Esri · NAIP",
    description: "Aerial basemap with Atlas county overlays for quick visual context.",
  },
];
