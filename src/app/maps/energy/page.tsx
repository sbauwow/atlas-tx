import MapScaffoldPage from "@/app/components/map-scaffold-page";

export const metadata = {
  title: "Atlas TX — Maps · Energy footprint",
  description: "Where Texas energy infrastructure sits — a planned overlay on the water-risk surface.",
};

export default function EnergyMapPage() {
  return (
    <MapScaffoldPage
      volumeLabel="Atlas TX · Map · Energy footprint"
      title="Texas energy footprint"
      oneLiner="Where Texas energy infrastructure intersects water-risk: power plants, oil and gas wells, ERCOT regions, and the water-cooling lanes that bind the two grids."
      status="coming-soon"
      eta="Cached EIA-860 + Texas RRC snapshots"
      plannedDatasets={[
        { label: "EIA-860 utility-scale generators", source: "U.S. Energy Information Administration" },
        { label: "Texas Railroad Commission well exports", source: "Texas Railroad Commission (RRC)" },
        { label: "ERCOT grid weather zones + region polygons", source: "ERCOT public data" },
        { label: "EPA emissions facility registry (FRS)", source: "EPA Facility Registry Service" },
        { label: "Cooling-water withdrawals + thermoelectric layer", source: "USGS / EIA-923" },
      ]}
      plannedSignals={[
        { label: "Power-plant density per county", description: "Operating utility-scale generators with fuel-type breakdown." },
        { label: "Active well count per county", description: "RRC-permitted producing oil and gas wells, refreshed from the public RRC export." },
        { label: "Water-stressed cooling load", description: "Counties where thermoelectric cooling demand overlaps drinking-water risk and drought class." },
        { label: "Renewable share by county", description: "Wind and solar generator capacity as a share of total county capacity." },
      ]}
      planLink={{ href: "/docs/plans/2026-05-08-water-risk-refocus.md", label: "Read the water-risk plan" }}
      contractAnchor={{ href: "/docs/contracts/dataset-registry.md", label: "Dataset registry" }}
    />
  );
}
