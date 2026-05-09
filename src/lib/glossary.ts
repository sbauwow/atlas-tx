export const GLOSSARY = {
  ACS: {
    short: "ACS",
    long: "American Community Survey",
  },
  APO: {
    short: "APO",
    long: "Aggregate Production Operation",
  },
  CID: {
    short: "CID",
    long: "Commissioners’ Integrated Database",
  },
  DWRS: {
    short: "DWRS",
    long: "Drinking Water Risk Score",
  },
  EJ: {
    short: "EJ",
    long: "environmental justice",
  },
  EJScreen: {
    short: "EJScreen",
    long: "EPA Environmental Justice Screening and Mapping Tool",
  },
  EPA: {
    short: "EPA",
    long: "Environmental Protection Agency",
  },
  FEMA: {
    short: "FEMA",
    long: "Federal Emergency Management Agency",
  },
  GBRA: {
    short: "GBRA",
    long: "Guadalupe-Blanco River Authority",
  },
  HUC: {
    short: "HUC",
    long: "Hydrologic Unit Code",
  },
  LCRA: {
    short: "LCRA",
    long: "Lower Colorado River Authority",
  },
  NFHL: {
    short: "NFHL",
    long: "National Flood Hazard Layer",
  },
  PWS: {
    short: "PWS",
    long: "Public Water System",
  },
  SDWIS: {
    short: "SDWIS",
    long: "Safe Drinking Water Information System",
  },
  SOAH: {
    short: "SOAH",
    long: "State Office of Administrative Hearings",
  },
  TCEQ: {
    short: "TCEQ",
    long: "Texas Commission on Environmental Quality",
  },
  TWDB: {
    short: "TWDB",
    long: "Texas Water Development Board",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
