export const waterPrimerCards = [
  {
    title: "Where Texas water comes from",
    body:
      "Texas runs on two main sources: surface water from rivers and reservoirs, and groundwater from aquifers like the Edwards, Trinity, Carrizo-Wilcox, Gulf Coast, and Ogallala.",
    glyph: "◉",
    token: 1,
  },
  {
    title: "How water moves",
    body:
      "Rain refills rivers, lakes, and aquifers. Utilities and districts withdraw, treat, deliver, collect wastewater, then either discharge treated water back to rivers or reuse it.",
    glyph: "→",
    token: 2,
  },
  {
    title: "Who manages it",
    body:
      "Texas has no single statewide water system. TWDB plans, TCEQ regulates, and river authorities, groundwater districts, utilities, and water districts run the local supply chain.",
    glyph: "⌘",
    token: 4,
  },
  {
    title: "Why risk varies by county",
    body:
      "Water stress depends on drought, reservoir storage, aquifer levels, flood damage, treatment capacity, infrastructure age, growth, and upstream-downstream dependence — not just whether water is nearby.",
    glyph: "△",
    token: 5,
  },
] as const;

export const texasWaterFlow = [
  "Rainfall and recharge refill rivers, reservoirs, wetlands, and aquifers.",
  "Water rights, pumping access, and district rules determine who can withdraw it.",
  "Utilities, districts, and authorities treat and deliver water to homes, farms, and businesses.",
  "Wastewater systems collect used water, treat it, then discharge or reuse it.",
] as const;

export const governanceLayers = [
  {
    title: "State planning",
    body: "TWDB handles long-range supply planning, drought strategy, and infrastructure funding.",
  },
  {
    title: "State regulation",
    body: "TCEQ oversees permits, water quality, and public-water-system regulation.",
  },
  {
    title: "Regional control",
    body: "River authorities and groundwater conservation districts manage basin and aquifer realities on the ground.",
  },
  {
    title: "Local delivery",
    body: "Cities, utilities, water districts, and private operators treat and move the water people actually use.",
  },
] as const;

export const countyRiskSignals = [
  "surface-water dependence vs aquifer dependence",
  "reservoir storage and drought exposure",
  "treatment and distribution capacity",
  "flood damage and infrastructure fragility",
  "population growth and demand pressure",
  "upstream / downstream dependence",
] as const;
