const COUNTY_SUFFIX = /\s+county$/i;

function titleCaseSegment(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeBaseCountyName(input: string): string {
  return input
    .trim()
    .replace(/\./g, "")
    .replace(/\bst\b/gi, "saint")
    .replace(/\s+/g, " ")
    .replace(COUNTY_SUFFIX, "")
    .trim();
}

export function normalizeCountyName(input: string): string {
  const base = normalizeBaseCountyName(input);
  return `${titleCaseSegment(base)} County`;
}

export function countySlug(input: string): string {
  return normalizeCountyName(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sameCounty(left: string, right: string): boolean {
  return normalizeCountyName(left) === normalizeCountyName(right);
}
