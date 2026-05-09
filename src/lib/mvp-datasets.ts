export type MvpDataset = {
  id: string;
  name: string;
  category: "environment" | "infrastructure" | "social" | "fiscal" | "debt";
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
];
