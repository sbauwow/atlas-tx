export type HydrologySeedEdge = {
  upstreamCountySlug: string;
  downstreamCountySlug: string;
  weight: number;
  evidence: string;
};

export const TEXAS_HYDROLOGY_SEED_EDGES: HydrologySeedEdge[] = [
  { upstreamCountySlug: "travis-county", downstreamCountySlug: "bastrop-county", weight: 1, evidence: "colorado-river" },
  { upstreamCountySlug: "burnet-county", downstreamCountySlug: "travis-county", weight: 1, evidence: "colorado-river" },
  { upstreamCountySlug: "llano-county", downstreamCountySlug: "burnet-county", weight: 1, evidence: "colorado-river" },
  { upstreamCountySlug: "bastrop-county", downstreamCountySlug: "fayette-county", weight: 1, evidence: "colorado-river" },
  { upstreamCountySlug: "fayette-county", downstreamCountySlug: "colorado-county", weight: 1, evidence: "colorado-river" },
  { upstreamCountySlug: "colorado-county", downstreamCountySlug: "wharton-county", weight: 1, evidence: "colorado-river" },
  { upstreamCountySlug: "wharton-county", downstreamCountySlug: "matagorda-county", weight: 1, evidence: "colorado-river" },
  { upstreamCountySlug: "hays-county", downstreamCountySlug: "caldwell-county", weight: 1, evidence: "san-marcos-river" },
  { upstreamCountySlug: "caldwell-county", downstreamCountySlug: "gonzales-county", weight: 1, evidence: "guadalupe-river" },
  { upstreamCountySlug: "gonzales-county", downstreamCountySlug: "dewitt-county", weight: 1, evidence: "guadalupe-river" },
  { upstreamCountySlug: "dewitt-county", downstreamCountySlug: "victoria-county", weight: 1, evidence: "guadalupe-river" },
  { upstreamCountySlug: "victoria-county", downstreamCountySlug: "calhoun-county", weight: 1, evidence: "guadalupe-river" },
];
