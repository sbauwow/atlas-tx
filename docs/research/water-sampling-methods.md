# Water Sampling & Analysis Methods — Survey

> Status: research note. Not a contract. Not a plan. Background reference for anyone
> wondering *how* the contaminants behind SDWIS violations and EJScreen exposure
> indicators are actually measured — and where consumer-grade direct measurement
> could ever plausibly slot into Atlas TX.
>
> Written: 2026-05-08. Synthesized from working knowledge; specific instrument
> models, EPA method numbers, and consumer-product capabilities should be
> spot-checked before being cited in a published artifact.

Atlas TX joins regulatory data (SDWIS violations, EJScreen indicators, TCEQ
permits) — every number in the pipeline ultimately came out of a lab method
applied to a physical water sample at some point. This doc explains the chain
from sample bottle to data point so the project's outputs can be reasoned about
honestly.

For the consumer-device / citizen-science angle specifically, see
[`smartphone-colorimetry.md`](smartphone-colorimetry.md).

---

## 1. Sample collection

How the sample is collected determines what the lab can measure. Wrong
collection → numbers are noise regardless of instrument quality.

### Grab samples
Single point in time, sterile or acid-washed bottle, headspace minimized for
volatiles. Cheap, fast, but a snapshot only — misses diurnal and event-driven
variation. This is what most regulatory monitoring uses.

### Composite samples
Multiple grabs blended into one sample, either time-proportional (every N
minutes) or flow-proportional (volume proportional to instantaneous flow).
Gives an average over the compositing window. Common for wastewater discharge
permits.

### Autosamplers (e.g., ISCO, Teledyne)
Programmable refrigerated carousels triggered by time, flow rate, or sensor
event (e.g., turbidity spike). Used for permit-required continuous monitoring,
storm event capture, and source-trace investigations.

### Passive samplers
Devices left in water for days or weeks; contaminants accumulate by diffusion.
- **DGT** (Diffusive Gradients in Thin films) — metals, time-weighted average
- **POCIS** (Polar Organic Chemical Integrative Sampler) — pesticides, pharma
- **SPMD** (Semipermeable Membrane Device) — hydrophobic organics like PCBs

Useful when contaminants are episodic or below grab-sample detection.

### Preservation
Match the matrix to the analyte. Wrong preservation = invalidated sample:

| Analyte class | Preservation |
|---|---|
| Metals | Filter (0.45 µm) on-site, acidify with HNO₃ to pH < 2 |
| Nutrients (NH₃, NO₃, PO₄) | H₂SO₄ to pH < 2, refrigerate ≤ 4 °C |
| VOCs | Zero headspace, HCl, refrigerate, dark |
| Microbes | Sterile bottle with Na₂S₂O₃ (dechlorinator), ≤ 6 hr to lab on ice |
| Cyanide | NaOH to pH > 12, refrigerate, dark |
| BOD/COD | Refrigerate, ≤ 24 hr |

### Chain of custody
For regulatory and legal samples: every transfer documented, tamper-evident
seals, signatures. SDWIS-feeding samples follow this chain — that is part of
why those numbers are trustworthy enough to ground Atlas TX scoring.

---

## 2. Lab analytical methods

The instrument depends on what is being looked for, what concentration matters,
and what regulatory method (e.g., EPA 200.8, EPA 537.1) is required.

### Inorganics

| Target | Instrument | Typical detection | Notes |
|---|---|---|---|
| Heavy metals (Pb, As, Cd, Cu, etc.) | ICP-MS (EPA 200.8) | ppt – ppb | Workhorse for SDWIS metals |
| Bulk metals | ICP-OES (EPA 200.7) | ppb – ppm | Cheaper, less sensitive than ICP-MS |
| Mercury | Cold-vapor AAS (EPA 245.1) | ng/L | Mercury needs its own digestion |
| Major anions (Cl⁻, SO₄²⁻, NO₃⁻, NO₂⁻, F⁻) | Ion chromatography (EPA 300.0) | mg/L |  |
| Hardness, alkalinity | Titration | mg/L as CaCO₃ |  |
| pH, conductivity, DO | Electrode | direct | Field-capable |

### Organics

| Target | Instrument | Typical detection |
|---|---|---|
| VOCs (TCE, benzene, MTBE) | GC-MS w/ purge-and-trap (EPA 524.2) | ppb |
| Semi-volatiles (pesticides, PAHs) | GC-MS (EPA 525.2) | ppt – ppb |
| Pesticides — polar | LC-MS/MS | ppt |
| Pharmaceuticals, hormones | LC-MS/MS | ppt |
| **PFAS** | LC-MS/MS (EPA 537.1, 533, 1633) | ng/L |
| Disinfection byproducts (THMs, HAA5) | GC-ECD / LC-MS/MS (EPA 552.3, 524.3) | ppb |

PFAS is worth calling out: regulatory MCLs are now in the single-digit ng/L
range. Detection requires LC-MS/MS with isotope-dilution standards. There is
no shortcut, no field equivalent, and no consumer-grade analog.

### Microbiological

| Target | Method |
|---|---|
| Total coliforms / E. coli | Membrane filtration + culture (EPA 1604), or IDEXX Colilert MPN |
| Heterotrophic plate count | Pour plate, R2A medium |
| Specific pathogens (Legionella, Crypto, Giardia) | qPCR or immunofluorescence |
| Cyanotoxins (microcystin, cylindrospermopsin) | ELISA, LC-MS/MS |

Microbes drive a meaningful fraction of acute SDWIS violations — particularly
in small rural systems.

### Field instruments
- Multi-parameter sondes (YSI EXO, Hach HQ40D) — pH, conductivity, DO, ORP,
  turbidity, sometimes nitrate / ammonium ISE
- Spectrophotometric field kits (Hach DR series, LaMotte SMART3) — colorimetric
  reagents read by portable photometer; nutrients, residual chlorine, iron,
  copper, etc.

These produce regulator-acceptable numbers for some parameters (pH, residual
Cl, turbidity) but are **not** a substitute for lab analysis on metals, organics,
or microbes.

---

## 3. Consumer / DIY measurement

What a non-professional can actually measure today, in rough order of useful:

### Test strips ($10 – $30)
Colorimetric strips (pH, hardness, alkalinity, free + total Cl, NO₃⁻, NO₂⁻).
Read against a printed color chart. Semi-quantitative, ±20 % typical. Adequate
for pool / aquarium / general well-water sanity check. Useless for heavy metals
at EPA action-level concentrations.

### Photometers ($50 – $400)
Hanna Checker series, LaMotte SMART, Hach Pocket Colorimeter. Reagent + LED +
photodiode in a cuvette; gives a real number. Solid for nutrients, chlorine,
iron, copper, phosphate, ammonia. Some can match lab accuracy for nutrient
work; not for trace metals.

### TDS / EC meter ($15)
Measures bulk dissolved-ion conductivity. Tells you nothing about *which* ions.
Useful only as a "did something change" signal.

### pH / ORP / DO probes ($20 – $200)
Reliable for what they measure if calibrated; ORP and DO probes drift.

### Bacterial home kits
Coliscan / Easygel petri films, Watercheck pour plates. Room-temperature
incubate 24 – 48 h, count colonies. Genuinely useful presence/absence and
order-of-magnitude count.

### Heavy-metal home strips (Watersafe, First Alert, etc.)
Threshold-style immunoassay around the EPA 15 ppb action level for lead.
Pass/fail only, false negatives are common, sensitivity at the borderline is
poor. Better than nothing, worse than ICP-MS by orders of magnitude.

### Mail-in lab kits
Tap Score / SimpleLab, MyTapScore, Watercheck, Cyclopure (PFAS). User collects
a sample, ships it in a preserved bottle, lab runs ICP-MS and/or LC-MS/MS, returns
a full-panel report. **This is the only consumer route to real heavy-metal,
VOC, and PFAS numbers.** Cost: $150 – $600.

### Smartphone colorimetry
Camera + reagent + reference card → concentration. Active research area with a
mix of true smartphone-colorimetry tools and adjacent digital field-testing
platforms. Current examples worth separating carefully: AKVO Caddisfly
(official striptest/app workflow), WaterScope (official app/dashboard-connected
bacterial testing platform), and Hach portable colorimeters (officially
verified here as portable photometers, but not yet as a clearly documented
smartphone-colorimetry workflow). Detailed in
[`smartphone-colorimetry.md`](smartphone-colorimetry.md).

### Consumer dead zones — no DIY exists
| Class | Why |
|---|---|
| PFAS at ng/L | Requires LC-MS/MS isotope dilution |
| VOCs (TCE, benzene) | Requires GC-MS purge-and-trap |
| Heavy metals at EPA action levels | Strips miss low-ppb; ICP-MS only |
| Specific pathogens (Legionella) | Requires qPCR / culture identification |
| Disinfection byproducts | Requires GC-ECD or LC-MS/MS |

---

## 4. What this means for Atlas TX

Two things matter for how Atlas TX presents its outputs:

1. **The numbers feeding our scoring functions came from EPA-method lab
   analysis on properly preserved chain-of-custody samples.** SDWIS violations
   are derived from regulator-validated methods. Our scoring inherits that
   provenance — and our caveats inherit those methods' detection limits and
   sampling cadence. Some PWSs are sampled quarterly, some yearly; our DWRS
   should weight recency accordingly (already in the contract spec).

2. **Direct consumer measurement is not a substitute for the regulatory
   feed.** The journalism use case is well-served by surfacing existing
   regulatory data better, not by inviting reporters to take their own
   readings. Any future "community-collected overlay" must be framed as
   *exposure / observation* data, not as compliance or harm data — same EJ
   guardrail we apply to EJScreen.

A v2 angle to consider — but not promise — is integrating mail-in lab results
or smartphone-colorimetry-derived community readings as a separate layer
behind a clear "non-regulatory data, not compliance" disclaimer. See the
smartphone doc for what that would actually take.

---

## 5. References to verify before citing

- EPA drinking-water analytical methods index: <https://www.epa.gov/dwanalyticalmethods>
- SDWIS Federal Reporting Services: <https://www.epa.gov/ground-water-and-drinking-water/safe-drinking-water-information-system-sdwis-federal-reporting>
- EPA PFAS NPDWR + methods 537.1 / 533 / 1633
- USGS National Field Manual for the Collection of Water-Quality Data
- TCEQ Surface Water Quality Monitoring Procedures (Vol. 1 & 2)

URLs/method numbers above are stable enough to be reasonable starting points
but should be re-fetched at citation time.
