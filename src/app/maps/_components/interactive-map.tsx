"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  COUNTY_VIEW_IDS,
  bucketFillFor,
  type CountyViewId,
  type CountyViewPayload,
} from "@/lib/maps/county-views.types";

type LayerKey = "counties" | "permits" | "gauges";
const ALL_LAYERS: LayerKey[] = ["counties", "permits", "gauges"];

type BasemapKey = "street" | "satellite";
const BASEMAP_KEYS: BasemapKey[] = ["street", "satellite"];

const VIEW_NONE = "none" as const;
type ViewSelection = typeof VIEW_NONE | CountyViewId;

const BASEMAP_DEFS: Record<
  BasemapKey,
  { tiles: string[]; tileSize: number; maxzoom: number; attribution: string; label: string }
> = {
  street: {
    tiles: ["/api/tiles/{z}/{x}/{y}"],
    tileSize: 256,
    maxzoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: "Street",
  },
  satellite: {
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution:
      "Imagery &copy; Esri, Maxar, Earthstar Geographics, USDA FSA, USGS, AeroGRID, IGN, and the GIS User Community",
    label: "Satellite",
  },
};

const LAYER_TO_IDS: Record<LayerKey, string[]> = {
  counties: ["counties-fill", "counties-outline"],
  permits: ["permits-points"],
  gauges: ["gauges-points"],
};

type PermitProps = {
  permitNumber: string;
  applicant: string;
  authorizationType: string;
  authorizationStatus: string;
  county: string | null;
  countySlug: string | null;
  nearestCity: string | null;
};
type GaugeProps = {
  siteNumber: string;
  stationName: string;
  countyName: string | null;
};
type CountyProps = {
  name: string;
  _value?: number | null;
  _fill?: string | null;
  _context?: string | null;
};

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };
const COUNTY_DEFAULT_FILL = "#22d3ee";
const COUNTY_DEFAULT_OPACITY = 0.06;
const COUNTY_VIEW_OPACITY = 0.7;

function slugifyCounty(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

function escapeHtml(input: string | null | undefined): string {
  if (input == null) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function permitPopupHtml(p: PermitProps): string {
  const link = p.countySlug
    ? `<a href="/permits?county=${escapeHtml(p.countySlug)}" style="display:inline-block;margin-top:4px;font-size:11px;font-weight:600;color:#0e7490;text-decoration:underline;">Open county permits →</a>`
    : "";
  return `
    <div style="font-family:inherit;color:#0f172a;line-height:1.35;font-size:12px;min-width:180px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#c2410c;">TCEQ permit · ${escapeHtml(p.authorizationStatus)}</div>
      <div style="font-size:13px;font-weight:600;margin-top:2px;">${escapeHtml(p.applicant) || "Unknown applicant"}</div>
      <div style="margin-top:1px;">${escapeHtml(p.authorizationType)}</div>
      <div style="color:#475569;margin-top:1px;">${escapeHtml(p.nearestCity ? p.nearestCity + ", " : "")}${escapeHtml(p.county ?? "")}</div>
      <div style="font-size:11px;color:#64748b;margin-top:1px;">#${escapeHtml(p.permitNumber)}</div>
      ${link}
    </div>
  `;
}

function gaugePopupHtml(g: GaugeProps): string {
  return `
    <div style="font-family:inherit;color:#0f172a;line-height:1.35;font-size:12px;min-width:180px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#0284c7;">USGS stream gauge</div>
      <div style="font-size:13px;font-weight:600;margin-top:2px;">${escapeHtml(g.stationName)}</div>
      ${g.countyName ? `<div style="color:#475569;margin-top:1px;">${escapeHtml(g.countyName)} County</div>` : ""}
      <div style="font-size:11px;color:#64748b;margin-top:1px;">Site #${escapeHtml(g.siteNumber)}</div>
      <a href="https://waterdata.usgs.gov/nwis/uv?site_no=${escapeHtml(g.siteNumber)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:4px;font-size:11px;font-weight:600;color:#0e7490;text-decoration:underline;">Open USGS data →</a>
    </div>
  `;
}

function countyPopupHtml(c: CountyProps, viewLabel: string | null, valueLabel: string | null): string {
  const slug = slugifyCounty(c.name);
  const valueLine =
    viewLabel && c._value != null
      ? `<div style="margin-top:2px;font-size:12px;"><span style="color:#0891b2;font-weight:600;">${escapeHtml(viewLabel)}:</span> ${c._value.toLocaleString()}${valueLabel ? ` ${escapeHtml(valueLabel)}` : ""}</div>`
      : "";
  const ctx =
    c._context
      ? `<div style="color:#475569;margin-top:1px;">${escapeHtml(c._context)}</div>`
      : "";
  return `
    <div style="font-family:inherit;color:#0f172a;line-height:1.35;font-size:12px;min-width:160px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#0891b2;">County</div>
      <div style="font-size:13px;font-weight:600;margin-top:2px;">${escapeHtml(c.name)} County</div>
      ${valueLine}
      ${ctx}
      <a href="/counties/${escapeHtml(slug)}" style="display:inline-block;margin-top:4px;font-size:11px;font-weight:600;color:#0e7490;text-decoration:underline;">Open county page →</a>
    </div>
  `;
}

function parseLayersFromQuery(value: string | null): Set<LayerKey> {
  if (!value) return new Set(ALL_LAYERS);
  const parts = value
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is LayerKey => (ALL_LAYERS as string[]).includes(p));
  return new Set(parts.length ? parts : ALL_LAYERS);
}

function parseViewFromQuery(value: string | null): ViewSelection {
  if (!value || value === VIEW_NONE) return VIEW_NONE;
  if ((COUNTY_VIEW_IDS as readonly string[]).includes(value)) return value as CountyViewId;
  return VIEW_NONE;
}

function parseBasemapFromQuery(value: string | null): BasemapKey {
  if (value && (BASEMAP_KEYS as string[]).includes(value)) return value as BasemapKey;
  return "street";
}

function buildBaseStyle(basemap: BasemapKey): maplibregl.StyleSpecification {
  const def = BASEMAP_DEFS[basemap];
  return {
    version: 8,
    sources: {
      "basemap-raster": {
        type: "raster",
        tiles: def.tiles,
        tileSize: def.tileSize,
        maxzoom: def.maxzoom,
        attribution: def.attribution,
      },
    },
    layers: [{ id: "basemap", type: "raster", source: "basemap-raster" }],
  } as maplibregl.StyleSpecification;
}

export default function InteractiveMap() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialLayers = useMemo(() => parseLayersFromQuery(searchParams.get("layers")), [searchParams]);
  const initialView = useMemo<ViewSelection>(() => parseViewFromQuery(searchParams.get("view")), [searchParams]);
  const initialBasemap = useMemo<BasemapKey>(
    () => parseBasemapFromQuery(searchParams.get("basemap")),
    [searchParams],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const styleLoadedRef = useRef(false);
  const countiesFcRef = useRef<FeatureCollection | null>(null);
  const viewSelectionRef = useRef<ViewSelection>(initialView);

  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(initialLayers);
  const [view, setView] = useState<ViewSelection>(initialView);
  const [basemap, setBasemap] = useState<BasemapKey>(initialBasemap);
  const [counts, setCounts] = useState<Record<LayerKey, number | null>>({
    counties: null,
    permits: null,
    gauges: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [viewPayload, setViewPayload] = useState<CountyViewPayload | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildBaseStyle(initialBasemap),
      center: [-99.3, 31.4],
      zoom: 5.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "imperial" }), "bottom-left");

    const installLayers = () => {
      styleLoadedRef.current = true;
      setErrors((prev) => {
        if (!prev.map) return prev;
        const next = { ...prev };
        delete next.map;
        return next;
      });

      if (!map.getSource("counties")) {
        map.addSource("counties", { type: "geojson", data: EMPTY_FC });
        map.addLayer({
          id: "counties-fill",
          type: "fill",
          source: "counties",
          paint: {
            "fill-color": ["coalesce", ["get", "_fill"], COUNTY_DEFAULT_FILL],
            "fill-opacity": COUNTY_DEFAULT_OPACITY,
          },
        });
        map.addLayer({
          id: "counties-outline",
          type: "line",
          source: "counties",
          paint: { "line-color": "#22d3ee", "line-opacity": 0.5, "line-width": 0.6 },
        });
      }
      if (!map.getSource("permits")) {
        map.addSource("permits", { type: "geojson", data: EMPTY_FC });
        map.addLayer({
          id: "permits-points",
          type: "circle",
          source: "permits",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 10, 6, 14, 9],
            "circle-color": "#f97316",
            "circle-stroke-color": "#fff7ed",
            "circle-stroke-width": 1,
            "circle-opacity": 0.9,
          },
        });
      }
      if (!map.getSource("gauges")) {
        map.addSource("gauges", { type: "geojson", data: EMPTY_FC });
        map.addLayer({
          id: "gauges-points",
          type: "circle",
          source: "gauges",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 2, 10, 4, 14, 7],
            "circle-color": "#38bdf8",
            "circle-stroke-color": "#082f49",
            "circle-stroke-width": 0.8,
            "circle-opacity": 0.85,
          },
        });
      }

      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 12,
        maxWidth: "280px",
      });
      const cursor = (id: string) => {
        map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
      };
      map.on("click", "permits-points", (e) => {
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const coords = f.geometry.coordinates as [number, number];
        popup.setLngLat(coords).setHTML(permitPopupHtml(f.properties as unknown as PermitProps)).addTo(map);
      });
      cursor("permits-points");
      map.on("click", "gauges-points", (e) => {
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const coords = f.geometry.coordinates as [number, number];
        popup.setLngLat(coords).setHTML(gaugePopupHtml(f.properties as unknown as GaugeProps)).addTo(map);
      });
      cursor("gauges-points");
      map.on("click", "counties-fill", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const sel = viewSelectionRef.current;
        const payload = viewPayloadRef.current;
        const label = sel !== VIEW_NONE && payload ? payload.title : null;
        const valueLabel = sel !== VIEW_NONE && payload ? payload.valueLabel : null;
        popup
          .setLngLat(e.lngLat)
          .setHTML(countyPopupHtml(f.properties as unknown as CountyProps, label, valueLabel))
          .addTo(map);
      });
      cursor("counties-fill");

      setLoaded(true);
    };

    map.on("load", installLayers);
    map.on("style.load", () => {
      if (styleLoadedRef.current) {
        // basemap swap path: re-install layers/sources after style change
        styleLoadedRef.current = false;
        installLayers();
      }
    });
    map.on("error", (e) => {
      const msg = e.error?.message ?? String(e.error ?? "Map error");
      const src = (e as { sourceId?: string }).sourceId;
      setErrors((prev) => ({ ...prev, map: src ? `${src}: ${msg}` : msg }));
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      styleLoadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep view-payload ref in sync (popup needs current values)
  const viewPayloadRef = useRef<CountyViewPayload | null>(null);
  useEffect(() => {
    viewPayloadRef.current = viewPayload;
  }, [viewPayload]);
  useEffect(() => {
    viewSelectionRef.current = view;
  }, [view]);

  // Basemap swap: rebuild style; loaders re-fire from "style.load".
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(buildBaseStyle(basemap));
  }, [basemap]);

  // Layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    for (const key of ALL_LAYERS) {
      const visible = activeLayers.has(key);
      for (const id of LAYER_TO_IDS[key]) {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
        }
      }
    }
  }, [activeLayers, loaded]);

  // Counties topojson load (once per map session). Re-runs after basemap swap.
  useEffect(() => {
    if (!loaded) return;
    if (countiesFcRef.current) {
      // Already loaded, just push back to the source after style swap.
      const src = mapRef.current?.getSource("counties") as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(countiesFcRef.current);
      return;
    }
    let cancelled = false;
    fetch("/cache/tx-counties-topo.json")
      .then((r) => r.json())
      .then((topo: Topology) => {
        if (cancelled) return;
        const obj = topo.objects?.counties as GeometryCollection | undefined;
        if (!obj) throw new Error("counties object missing in topojson");
        const fc = feature(topo, obj) as unknown as FeatureCollection;
        countiesFcRef.current = fc;
        const src = mapRef.current?.getSource("counties") as maplibregl.GeoJSONSource | undefined;
        src?.setData(fc);
        setCounts((c) => ({ ...c, counties: fc.features.length }));
      })
      .catch((err) => !cancelled && setErrors((e) => ({ ...e, counties: String(err) })));
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  // Permits
  useEffect(() => {
    if (!loaded || !activeLayers.has("permits") || counts.permits !== null) return;
    let cancelled = false;
    fetch("/api/permits/locations")
      .then((r) => r.json())
      .then((fc: FeatureCollection) => {
        if (cancelled) return;
        const src = mapRef.current?.getSource("permits") as maplibregl.GeoJSONSource | undefined;
        src?.setData(fc);
        setCounts((c) => ({ ...c, permits: fc.features.length }));
      })
      .catch((err) => !cancelled && setErrors((e) => ({ ...e, permits: String(err) })));
    return () => {
      cancelled = true;
    };
  }, [loaded, activeLayers, counts.permits]);

  // Gauges
  useEffect(() => {
    if (!loaded || !activeLayers.has("gauges") || counts.gauges !== null) return;
    let cancelled = false;
    fetch("/api/water/gauges")
      .then((r) => r.json())
      .then(
        (data: {
          gauges: Array<{
            siteNumber: string;
            stationName: string;
            countyName: string | null;
            latitude: number;
            longitude: number;
          }>;
        }) => {
          if (cancelled) return;
          const features: Feature<Point, GaugeProps>[] = data.gauges
            .filter((g) => Number.isFinite(g.latitude) && Number.isFinite(g.longitude))
            .map((g) => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: [g.longitude, g.latitude] },
              properties: {
                siteNumber: g.siteNumber,
                stationName: g.stationName,
                countyName: g.countyName,
              },
            }));
          const fc: FeatureCollection = { type: "FeatureCollection", features };
          const src = mapRef.current?.getSource("gauges") as maplibregl.GeoJSONSource | undefined;
          src?.setData(fc);
          setCounts((c) => ({ ...c, gauges: features.length }));
        },
      )
      .catch((err) => !cancelled && setErrors((e) => ({ ...e, gauges: String(err) })));
    return () => {
      cancelled = true;
    };
  }, [loaded, activeLayers, counts.gauges]);

  // View payload load (or clear when "none")
  useEffect(() => {
    let cancelled = false;
    if (view === VIEW_NONE) {
      setViewPayload(null);
      return;
    }
    setViewLoading(true);
    fetch(`/api/maps/views/${view}`)
      .then((r) => r.json())
      .then((p: CountyViewPayload) => {
        if (cancelled) return;
        setViewPayload(p);
      })
      .catch((err) => !cancelled && setErrors((e) => ({ ...e, view: String(err) })))
      .finally(() => !cancelled && setViewLoading(false));
    return () => {
      cancelled = true;
    };
  }, [view]);

  // Apply choropleth: mutate county feature props and re-set source data.
  useEffect(() => {
    const map = mapRef.current;
    const fc = countiesFcRef.current;
    if (!map || !fc || !loaded) return;
    if (view === VIEW_NONE || !viewPayload) {
      // clear per-feature fill, fall back to default cyan tint
      for (const f of fc.features) {
        const props = (f.properties ?? {}) as CountyProps;
        delete props._value;
        delete props._fill;
        delete props._context;
      }
      const src = map.getSource("counties") as maplibregl.GeoJSONSource | undefined;
      src?.setData(fc);
      if (map.getLayer("counties-fill")) {
        map.setPaintProperty("counties-fill", "fill-opacity", COUNTY_DEFAULT_OPACITY);
      }
      return;
    }
    const byName = new Map<string, { value: number; fill: string; context?: string }>();
    for (const r of viewPayload.rows) {
      byName.set(r.name, {
        value: r.value,
        fill: bucketFillFor(view, r.value),
        context: r.context,
      });
    }
    for (const f of fc.features) {
      const props = (f.properties ?? {}) as CountyProps;
      const fullName = `${props.name} County`;
      const hit = byName.get(fullName) ?? byName.get(props.name);
      if (hit) {
        props._value = hit.value;
        props._fill = hit.fill;
        props._context = hit.context ?? null;
      } else {
        props._value = 0;
        props._fill = bucketFillFor(view, 0);
        delete props._context;
      }
    }
    const src = map.getSource("counties") as maplibregl.GeoJSONSource | undefined;
    src?.setData(fc);
    if (map.getLayer("counties-fill")) {
      map.setPaintProperty("counties-fill", "fill-opacity", COUNTY_VIEW_OPACITY);
    }
  }, [view, viewPayload, loaded]);

  // Persist sidebar state in URL
  const replaceQuery = useCallback(
    (
      partial: Partial<{ layers: Set<LayerKey>; view: ViewSelection; basemap: BasemapKey }>,
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const layers = partial.layers ?? activeLayers;
      const v = partial.view ?? view;
      const b = partial.basemap ?? basemap;
      if (layers.size === ALL_LAYERS.length) params.delete("layers");
      else params.set("layers", Array.from(layers).join(","));
      if (v === VIEW_NONE) params.delete("view");
      else params.set("view", v);
      if (b === "street") params.delete("basemap");
      else params.set("basemap", b);
      const qs = params.toString();
      router.replace(qs ? `/maps?${qs}` : "/maps", { scroll: false });
    },
    [router, searchParams, activeLayers, view, basemap],
  );

  const toggleLayer = useCallback(
    (key: LayerKey) => {
      setActiveLayers((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        replaceQuery({ layers: next });
        return next;
      });
    },
    [replaceQuery],
  );

  const onSelectView = useCallback(
    (next: ViewSelection) => {
      setView(next);
      replaceQuery({ view: next });
    },
    [replaceQuery],
  );

  const onSelectBasemap = useCallback(
    (next: BasemapKey) => {
      setBasemap(next);
      replaceQuery({ basemap: next });
    },
    [replaceQuery],
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <Sidebar
        activeLayers={activeLayers}
        toggleLayer={toggleLayer}
        view={view}
        onSelectView={onSelectView}
        basemap={basemap}
        onSelectBasemap={onSelectBasemap}
        viewPayload={viewPayload}
        viewLoading={viewLoading}
        counts={counts}
        errors={errors}
      />
      {errors.map && (
        <div className="absolute right-3 top-3 z-10 max-w-md rounded-lg border border-rose-500/30 bg-rose-950/90 px-3 py-2 text-xs text-rose-100 shadow-xl backdrop-blur">
          <div className="font-semibold">Map error</div>
          <div className="mt-1 break-all font-mono text-[10px]">{errors.map}</div>
        </div>
      )}
    </div>
  );
}

const VIEW_LABELS: Record<ViewSelection, string> = {
  none: "None",
  ej: "Drinking-water risk",
  operators: "Operator pressure",
  swq: "Surface water",
  citizen: "Citizen activity",
};

function Sidebar({
  activeLayers,
  toggleLayer,
  view,
  onSelectView,
  basemap,
  onSelectBasemap,
  viewPayload,
  viewLoading,
  counts,
  errors,
}: {
  activeLayers: Set<LayerKey>;
  toggleLayer: (key: LayerKey) => void;
  view: ViewSelection;
  onSelectView: (next: ViewSelection) => void;
  basemap: BasemapKey;
  onSelectBasemap: (next: BasemapKey) => void;
  viewPayload: CountyViewPayload | null;
  viewLoading: boolean;
  counts: Record<LayerKey, number | null>;
  errors: Record<string, string>;
}) {
  const layerRows: Array<{ key: LayerKey; label: string; swatch: string; sub: string }> = [
    {
      key: "counties",
      label: "Counties",
      swatch: "bg-cyan-400/60",
      sub: counts.counties !== null ? `${counts.counties}` : "",
    },
    {
      key: "permits",
      label: "TCEQ permits",
      swatch: "bg-orange-500",
      sub: counts.permits !== null ? `${counts.permits}` : "",
    },
    {
      key: "gauges",
      label: "USGS gauges",
      swatch: "bg-sky-400",
      sub: counts.gauges !== null ? `${counts.gauges}` : "",
    },
  ];

  const viewOptions: ViewSelection[] = [VIEW_NONE, ...COUNTY_VIEW_IDS];

  return (
    <div className="absolute left-3 top-3 z-10 w-[268px] rounded-xl border border-white/10 bg-slate-950/85 p-3 text-sm text-slate-100 shadow-xl backdrop-blur">
      {/* Basemap */}
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Basemap
      </div>
      <div className="mb-3 flex gap-1.5 rounded-lg border border-white/5 bg-white/5 p-1">
        {BASEMAP_KEYS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => onSelectBasemap(b)}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              basemap === b
                ? "bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/40"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            {BASEMAP_DEFS[b].label}
          </button>
        ))}
      </div>

      {/* View mode */}
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        County view
      </div>
      <select
        value={view}
        onChange={(e) => onSelectView(e.target.value as ViewSelection)}
        className="mb-2 w-full rounded-md border border-white/10 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-400/50"
      >
        {viewOptions.map((v) => (
          <option key={v} value={v}>
            {VIEW_LABELS[v]}
          </option>
        ))}
      </select>
      {view !== VIEW_NONE && (
        <div className="mb-3 rounded-lg border border-white/5 bg-white/5 p-2">
          <div className="text-[11px] text-slate-300">
            {viewPayload?.description ?? (viewLoading ? "Loading…" : "—")}
          </div>
          {viewPayload && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {viewPayload.buckets.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/60 px-1.5 py-0.5 text-[10px] text-slate-300"
                >
                  <span aria-hidden className="size-2 rounded-sm" style={{ background: b.fill }} />
                  {b.label}
                </span>
              ))}
            </div>
          )}
          {errors.view && <div className="mt-1 text-[10px] text-rose-400">{errors.view}</div>}
          {(["ej", "operators", "swq", "citizen"] as const).includes(view as CountyViewId) && (
            <a
              href={`/maps/${legacyThemeFor(view as CountyViewId)}`}
              className="mt-2 inline-block text-[11px] font-medium text-cyan-300 underline-offset-2 hover:underline"
            >
              Open detail page →
            </a>
          )}
        </div>
      )}

      {/* Layers */}
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Layers
      </div>
      <ul className="space-y-1.5">
        {layerRows.map((row) => {
          const isActive = activeLayers.has(row.key);
          const err = errors[row.key];
          return (
            <li key={row.key}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleLayer(row.key)}
                  className="size-3.5 accent-cyan-400"
                />
                <span aria-hidden className={`inline-block size-2.5 rounded-full ${row.swatch}`} />
                <span className="flex-1 text-xs font-medium">{row.label}</span>
                {row.sub && <span className="text-[10px] text-slate-400">{row.sub}</span>}
              </label>
              {err && <div className="ml-6 mt-0.5 text-[10px] text-rose-400">{err}</div>}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 border-t border-white/5 pt-2 text-[10px] leading-snug text-slate-500">
        Click a feature for detail. Selection persists in the URL.
      </div>
    </div>
  );
}

function legacyThemeFor(view: CountyViewId): string {
  switch (view) {
    case "ej":
      return "ej";
    case "operators":
      return "operators";
    case "swq":
      return "weather"; // surface-water-quality lives at /maps/weather currently
    case "citizen":
      return "citizen";
  }
}
