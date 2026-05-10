"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { feature } from "topojson-client";
import type { FeatureCollection, Feature, Point } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import "maplibre-gl/dist/maplibre-gl.css";

type LayerKey = "counties" | "permits" | "gauges";
const ALL_LAYERS: LayerKey[] = ["counties", "permits", "gauges"];

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    "osm-proxied": {
      type: "raster" as const,
      tiles: ["/api/tiles/{z}/{x}/{y}"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm-bg", type: "raster" as const, source: "osm-proxied" }],
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
type CountyProps = { name: string };

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

function countyPopupHtml(c: CountyProps): string {
  const slug = slugifyCounty(c.name);
  return `
    <div style="font-family:inherit;color:#0f172a;line-height:1.35;font-size:12px;min-width:140px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#0891b2;">County</div>
      <div style="font-size:13px;font-weight:600;margin-top:2px;">${escapeHtml(c.name)} County</div>
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

const EMPTY_FC: FeatureCollection = { type: "FeatureCollection", features: [] };

export default function MapClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLayers = useMemo(
    () => parseLayersFromQuery(searchParams.get("layers")),
    [searchParams]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const styleLoadedRef = useRef(false);

  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(initialLayers);
  const [counts, setCounts] = useState<Record<LayerKey, number | null>>({
    counties: null,
    permits: null,
    gauges: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE as maplibregl.StyleSpecification,
      center: [-99.3, 31.4],
      zoom: 5.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "imperial" }), "bottom-left");

    map.on("load", () => {
      styleLoadedRef.current = true;
      setErrors((prev) => {
        if (!prev.map) return prev;
        const next = { ...prev };
        delete next.map;
        return next;
      });

      // Empty sources up-front so layer order is stable
      map.addSource("counties", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "counties-fill",
        type: "fill",
        source: "counties",
        paint: { "fill-color": "#22d3ee", "fill-opacity": 0.06 },
      });
      map.addLayer({
        id: "counties-outline",
        type: "line",
        source: "counties",
        paint: { "line-color": "#22d3ee", "line-opacity": 0.5, "line-width": 0.6 },
      });

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

      // Click handlers
      const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 12, maxWidth: "260px" });
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
        popup.setLngLat(e.lngLat).setHTML(countyPopupHtml(f.properties as unknown as CountyProps)).addTo(map);
      });
      cursor("counties-fill");

      setLoaded(true);
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
  }, []);

  // Apply layer visibility
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

  // Counties data
  useEffect(() => {
    if (!loaded || !activeLayers.has("counties") || counts.counties !== null) return;
    let cancelled = false;
    fetch("/cache/tx-counties-topo.json")
      .then((r) => r.json())
      .then((topo: Topology) => {
        if (cancelled) return;
        const obj = topo.objects?.counties as GeometryCollection | undefined;
        if (!obj) throw new Error("counties object missing in topojson");
        const fc = feature(topo, obj) as unknown as FeatureCollection;
        const src = mapRef.current?.getSource("counties") as maplibregl.GeoJSONSource | undefined;
        src?.setData(fc);
        setCounts((c) => ({ ...c, counties: fc.features.length }));
      })
      .catch((err) => !cancelled && setErrors((e) => ({ ...e, counties: String(err) })));
    return () => {
      cancelled = true;
    };
  }, [loaded, activeLayers, counts.counties]);

  // Permits data
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

  // Gauges data
  useEffect(() => {
    if (!loaded || !activeLayers.has("gauges") || counts.gauges !== null) return;
    let cancelled = false;
    fetch("/api/water/gauges")
      .then((r) => r.json())
      .then((data: { gauges: Array<{ siteNumber: string; stationName: string; countyName: string | null; latitude: number; longitude: number }> }) => {
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
      })
      .catch((err) => !cancelled && setErrors((e) => ({ ...e, gauges: String(err) })));
    return () => {
      cancelled = true;
    };
  }, [loaded, activeLayers, counts.gauges]);

  const toggleLayer = useCallback(
    (key: LayerKey) => {
      setActiveLayers((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        const params = new URLSearchParams(searchParams.toString());
        if (next.size === ALL_LAYERS.length) {
          params.delete("layers");
        } else {
          params.set("layers", Array.from(next).join(","));
        }
        const qs = params.toString();
        router.replace(qs ? `/map?${qs}` : "/map", { scroll: false });
        return next;
      });
    },
    [router, searchParams]
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <LayerPanel active={activeLayers} onToggle={toggleLayer} counts={counts} errors={errors} />
      {errors.map && (
        <div className="absolute right-3 top-3 z-10 max-w-md rounded-lg border border-rose-500/30 bg-rose-950/90 px-3 py-2 text-xs text-rose-100 shadow-xl backdrop-blur">
          <div className="font-semibold">Map error</div>
          <div className="mt-1 break-all font-mono text-[10px]">{errors.map}</div>
        </div>
      )}
    </div>
  );
}

function LayerPanel({
  active,
  onToggle,
  counts,
  errors,
}: {
  active: Set<LayerKey>;
  onToggle: (key: LayerKey) => void;
  counts: Record<LayerKey, number | null>;
  errors: Record<string, string>;
}) {
  const rows: Array<{ key: LayerKey; label: string; swatch: string; sub: string }> = [
    {
      key: "counties",
      label: "Counties",
      swatch: "bg-cyan-400/60",
      sub: counts.counties !== null ? `${counts.counties} counties` : "",
    },
    {
      key: "permits",
      label: "TCEQ permits",
      swatch: "bg-orange-500",
      sub: counts.permits !== null ? `${counts.permits} permits` : "",
    },
    {
      key: "gauges",
      label: "USGS gauges",
      swatch: "bg-sky-400",
      sub: counts.gauges !== null ? `${counts.gauges} gauges` : "",
    },
  ];

  return (
    <div className="absolute left-3 top-3 z-10 w-[230px] rounded-xl border border-white/10 bg-slate-950/85 p-3 text-sm text-slate-100 shadow-xl backdrop-blur">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Layers
      </div>
      <ul className="space-y-1.5">
        {rows.map((row) => {
          const isActive = active.has(row.key);
          const err = errors[row.key];
          return (
            <li key={row.key}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => onToggle(row.key)}
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
        Click a feature for details. Toggle layers to filter; selection persists in the URL.
      </div>
    </div>
  );
}
