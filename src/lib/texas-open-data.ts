import { normalizeCountyName } from "@/lib/counties";
import { MVP_DATASETS } from "@/lib/mvp-datasets";

const SOCRATA_BASE_URL = "https://data.texas.gov/resource";
const COUNTY_QUERY_FIELDS: Record<string, string> = {
  "7fq8-wig2": "facility_county",
  "hr84-s96f": "county",
  "waxz-c9q5": "county",
  "ctj5-pypw": "county_name",
  "tmhs-ahbh": "county_name",
};

function uppercaseCountyBaseName(input: string): string {
  return normalizeCountyName(input).replace(/ County$/, "").toUpperCase();
}

export function getDatasetById(id: string) {
  return MVP_DATASETS.find((dataset) => dataset.id === id);
}

export function getTabularDatasetIds(): string[] {
  return MVP_DATASETS.filter((dataset) => dataset.accessType === "dataset").map((dataset) => dataset.id);
}

export function datasetResourceUrl(id: string): string | undefined {
  const dataset = getDatasetById(id);
  if (!dataset || dataset.accessType !== "dataset") {
    return undefined;
  }

  return `${SOCRATA_BASE_URL}/${dataset.id}.json`;
}

export function buildCountyDatasetUrl(id: string, county: string): string | undefined {
  const base = datasetResourceUrl(id);
  const countyField = COUNTY_QUERY_FIELDS[id];
  if (!base || !countyField) {
    return undefined;
  }

  const url = new URL(base);
  url.searchParams.set(countyField, uppercaseCountyBaseName(county));
  return url.toString();
}
