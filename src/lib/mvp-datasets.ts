export type MvpDataset = {
  id: string;
  name: string;
  category:
    | "environment"
    | "infrastructure"
    | "social"
    | "fiscal"
    | "debt"
    | "demographic"
    | "compliance";
  publisher: string;
  summary: string;
  keyFields: string[];
  useCase: string;
  accessType: "dataset" | "external";
};

export const MVP_DATASETS: MvpDataset[] = [
  {
    id: "7fq8-wig2",
    name: "TCEQ Water Quality Individual Permits Active/Pending",
    category: "environment",
    publisher: "Office of Water",
    summary:
      "Stormwater and wastewater permit records with county and location fields for regulated facilities.",
    keyFields: ["facility_county", "authorization_type", "authorization_status", "permittee_name", "latitude", "longitude"],
    useCase: "Environmental burden and regulated-facility density by county.",
    accessType: "dataset",
  },
  {
    id: "hr84-s96f",
    name: "Texas Water Districts",
    category: "infrastructure",
    publisher: "Office of Water",
    summary:
      "Water district registry with county, district type, status, and organization details.",
    keyFields: ["county", "district_type", "activity_status", "district_number", "distict_name"],
    useCase: "Public-systems and water-governance coverage by county.",
    accessType: "dataset",
  },
  {
    id: "tceq-swq-segments",
    name: "TCEQ Surface Water Quality Segments Viewer",
    category: "environment",
    publisher: "Texas Commission on Environmental Quality",
    summary:
      "Segment and reservoir viewer for Texas surface-water quality status, including impairment / use-support context for water bodies.",
    keyFields: ["segmentId", "segmentName", "assessmentUnit", "waterBodyType", "status", "designatedUse"],
    useCase: "Surface-water burden-indicator overlay and probabilistic environmental-burden inference input; impaired segments are a legal-use-support warning, not a direct harm measure.",
    accessType: "external",
  },
  {
    id: "waxz-c9q5",
    name: "CPI Completed Abuse/Neglect Investigations by County and Region FY2016-FY2025",
    category: "social",
    publisher: "TX DFPS Data and Decision Support",
    summary:
      "County-level completed child abuse and neglect investigations across fiscal years.",
    keyFields: ["fiscal_year", "county", "region", "completed_investigations"],
    useCase: "Social strain and vulnerability trend proxy by county.",
    accessType: "dataset",
  },
  {
    id: "u3nh-2phm",
    name: "Local Government Debt Report (HB 1378) FY 2023",
    category: "debt",
    publisher: "Texas Comptroller of Public Accounts",
    summary:
      "Issuer-level debt report index for local governments with debt report links and entity types.",
    keyFields: ["entity_type", "entity_name", "fiscal_year", "fiscal_year_end", "debt_report_url"],
    useCase: "Debt-report discovery and county fiscal-capacity expansion path.",
    accessType: "dataset",
  },
  {
    id: "ctj5-pypw",
    name: "County Returns",
    category: "fiscal",
    publisher: "Texas Comptroller of Public Accounts",
    summary:
      "County-level tax/remittance returns by tax type, period, and taxpayer count.",
    keyFields: ["county_name", "tax_description", "period_yyyy", "taxpayers", "total_due"],
    useCase: "Fiscal activity context for county comparison.",
    accessType: "dataset",
  },
  {
    id: "tmhs-ahbh",
    name: "Sales Tax Allocation, Tax Rates",
    category: "fiscal",
    publisher: "Texas Comptroller of Public Accounts",
    summary:
      "Jurisdiction-level sales tax rate changes and effective dates.",
    keyFields: ["county_name", "city_name", "old_rate", "new_rate", "effective_date"],
    useCase: "Local tax-rate context and change tracking.",
    accessType: "dataset",
  },
  {
    id: "xdwx-843n",
    name: "Debt Outstanding by Local Government",
    category: "debt",
    publisher: "Texas Bond Review Board",
    summary:
      "Bond Review Board debt-outstanding experience for local government issuers with broader debt context and caveats.",
    keyFields: ["issuer", "issuer_type", "debt_outstanding"],
    useCase: "Future issuer drill-through for municipal debt analysis.",
    accessType: "external",
  },
  {
    id: "djkj-euda",
    name: "Local Debt Bond Election Results",
    category: "debt",
    publisher: "Texas Bond Review Board",
    summary:
      "Local bond election results for issuers including amount, purpose, proposition, votes, and result.",
    keyFields: ["issuer", "bond_amount", "bond_purpose", "result"],
    useCase: "Debt authorization context and civic decision trail.",
    accessType: "external",
  },
  {
    id: "epa-sdwis-violations",
    name: "EPA SDWIS Drinking Water Violations",
    category: "environment",
    publisher: "U.S. EPA Office of Water",
    summary:
      "Public Water System health-based and monitoring violations from the federal Safe Drinking Water Information System.",
    keyFields: ["pwsid", "violation_id", "violation_code", "is_health_based_ind", "compl_per_begin_date", "population_served_count"],
    useCase: "Drinking Water Risk Score input — per-PWS violation severity, recency, population served.",
    accessType: "external",
  },
  {
    id: "epa-ejscreen-2024",
    name: "EPA EJScreen Environmental Justice Indicators",
    category: "demographic",
    publisher: "U.S. EPA",
    summary:
      "Block-group-level demographic and environmental burden indicators (percentile rankings, state-relative).",
    keyFields: ["geoid", "acstotpop", "minorpct", "lowincpct", "p_d2_pm25", "p_d2_o3", "p_d2_lead", "p_d2_water"],
    useCase: "EJ Burden Overlap input — joins demographic burden percentiles to TCEQ permit-buffer density.",
    accessType: "external",
  },
  {
    id: "epa-echo-violations",
    name: "EPA ECHO Enforcement & Compliance History",
    category: "compliance",
    publisher: "U.S. EPA Office of Enforcement and Compliance Assurance",
    summary:
      "Federal enforcement and compliance history for permitted facilities, joinable to TCEQ permits via FRS ID or lat/long.",
    keyFields: ["frs_id", "facility_name", "permit_id", "violation_count_3yr", "informal_count_3yr", "formal_count_3yr"],
    useCase: "Compliance Gap input — pairs with TCEQ permits to surface under-enforced regulated activity.",
    accessType: "external",
  },
  {
    id: "census-acs5-2023-county",
    name: "Census ACS 5-year (county + block group)",
    category: "demographic",
    publisher: "U.S. Census Bureau",
    summary:
      "American Community Survey 5-year estimates for population, race/ethnicity, income, and age by county and block group.",
    keyFields: ["geoid", "name", "B01003_001E", "B19013_001E", "B02001_002E", "B03002_012E"],
    useCase: "Population denominators and demographic context for DWRS, EJ overlay, and per-capita normalization.",
    accessType: "external",
  },
  {
    id: "twdb-major-aquifers",
    name: "TWDB Major Aquifers",
    category: "environment",
    publisher: "Texas Water Development Board",
    summary:
      "Statewide major aquifer polygons published by TWDB as GIS downloads.",
    keyFields: ["AQUIFER", "AQ_NAME", "bbox", "geometryType"],
    useCase: "Hydrologic context layer for groundwater source regions, aquifer adjacency, and water-risk storytelling.",
    accessType: "external",
  },
  {
    id: "twdb-river-basins",
    name: "TWDB Major River Basins",
    category: "environment",
    publisher: "Texas Water Development Board",
    summary:
      "Statewide major river basin polygons published by TWDB as GIS downloads.",
    keyFields: ["basin_num", "basin_name", "bbox", "geometryType"],
    useCase: "Watershed and basin overlays for county, facility, and Public Water System context.",
    accessType: "external",
  },
  {
    id: "twdb-huc8",
    name: "TWDB HUC 8 Hydrologic Units",
    category: "environment",
    publisher: "Texas Water Development Board",
    summary:
      "Texas hydrologic unit (HUC 8) polygons from the TWDB GIS download catalog.",
    keyFields: ["HUC_8", "SUBBASIN", "BASIN", "REGION", "SUBREGION", "bbox", "geometryType"],
    useCase: "Sub-basin hydrology joins and watershed-oriented aggregation for Atlas TX overlays.",
    accessType: "external",
  },
  {
    id: "tceq-cid-search-one",
    name: "TCEQ Commissioners' Integrated Database — Pending Cases",
    category: "compliance",
    publisher: "TCEQ Office of the Chief Clerk",
    summary:
      "Pending and recently-closed permit applications across all TCEQ program areas (APO, Air Quality, Water Quality, PWS, IHWHL, MSW, Water Rights, UIC, Water Districts), including SOAH docket cross-reference.",
    keyFields: ["tceqId", "applicantName", "county", "programArea", "itemStatus", "tceqDocketNumber", "soahDocketNumber", "regulatedEntityNumber"],
    useCase: "Active Protest Density input — case metadata and SOAH-referral signal per pending permit.",
    accessType: "external",
  },
  {
    id: "tceq-cid-search-two",
    name: "TCEQ Commissioners' Integrated Database — Comments & Hearing Requests",
    category: "compliance",
    publisher: "TCEQ Office of the Chief Clerk",
    summary:
      "Public comments, hearing requests, and public-meeting requests filed against pending TCEQ permit applications.",
    keyFields: ["tceqId", "filingType", "filerOrganization", "filedAt"],
    useCase: "Active Protest Density input — counts of community filings per pending permit. PII guardrail: do not surface individual filer names; aggregate counts and named filing orgs only.",
    accessType: "external",
  },
];
