"use client";

import { useCallback, useRef, useState } from "react";

import { sampleAndBuildReading, type StripRoi } from "@/lib/observations/strips/sampling.client";
import { GENERIC_9PAD_CHART } from "@/lib/observations/strips/reference-chart-9pad";
import type { ClientReading } from "@/lib/observations/types";

import { ResultsCard, type ObservationView } from "./ResultsCard";

type Phase = "pick" | "frame" | "submitting" | "result";

interface CanvasDims {
  readonly width: number;
  readonly height: number;
}

export function StripCapture() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [observation, setObservation] = useState<ObservationView | null>(null);
  const [roi, setRoi] = useState<StripRoi | null>(null);
  const [canvasDims, setCanvasDims] = useState<CanvasDims | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgUrlRef = useRef<string | null>(null);

  const onFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    if (!f) return;
    if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current);
    const url = URL.createObjectURL(f);
    imgUrlRef.current = url;
    setFile(f);
    setError(null);
    setRoi(null);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const targetW = Math.min(1024, img.naturalWidth);
      const scale = targetW / img.naturalWidth;
      const width = targetW;
      const height = Math.round(img.naturalHeight * scale);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, width, height);
      setCanvasDims({ width, height });
      setRoi({
        x: Math.round(width * 0.4),
        y: Math.round(height * 0.15),
        width: Math.round(width * 0.2),
        height: Math.round(height * 0.7),
      });
      setPhase("frame");
    };
    img.onerror = () => setError("Could not decode image — try a JPEG or PNG.");
    img.src = url;
  }, []);

  const onSubmit = useCallback(async () => {
    if (!file || !roi) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    setPhase("submitting");
    setError(null);

    let clientReading: ClientReading;
    try {
      clientReading = sampleAndBuildReading(ctx, roi, GENERIC_9PAD_CHART);
    } catch (e) {
      setError(`Sampling failed: ${(e as Error).message}`);
      setPhase("frame");
      return;
    }

    const fd = new FormData();
    fd.append("image", file);
    fd.append("clientReading", JSON.stringify(clientReading));

    try {
      const res = await fetch("/api/citizen/observations", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? `Server error ${res.status}`);
        setPhase("frame");
        return;
      }
      setObservation(json.observation as ObservationView);
      setPhase("result");
    } catch (e) {
      setError(`Network error: ${(e as Error).message}`);
      setPhase("frame");
    }
  }, [file, roi]);

  const reset = useCallback(() => {
    setFile(null);
    setObservation(null);
    setRoi(null);
    setCanvasDims(null);
    setError(null);
    setPhase("pick");
    if (imgUrlRef.current) {
      URL.revokeObjectURL(imgUrlRef.current);
      imgUrlRef.current = null;
    }
  }, []);

  return (
    <div className="space-y-6">
      {phase === "pick" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Capture a strip</h2>
          <ol className="text-sm text-slate-300 list-decimal pl-5 space-y-1">
            <li>Dip your strip per the kit instructions and wait the full incubation time.</li>
            <li>Lay the strip <strong>next to its bottle&apos;s color chart</strong> in the same frame.</li>
            <li>Photograph in daylight, flat surface, no flash, no shadows on the strip.</li>
          </ol>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={onFileChange}
            className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-medium file:text-slate-950 hover:file:bg-cyan-300"
          />
        </div>
      )}

      {(phase === "frame" || phase === "submitting") && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Frame the strip</h2>
            <button
              onClick={reset}
              className="text-xs text-slate-400 underline-offset-2 hover:underline"
              type="button"
            >
              Use a different photo
            </button>
          </div>
          <p className="text-sm text-slate-400">
            Drag the box to cover the column of test pads. The bottle&apos;s color chart can stay visible elsewhere in the frame — the server vision pass uses it.
          </p>
          <CanvasFrame
            canvasRef={canvasRef}
            dims={canvasDims}
            roi={roi}
            setRoi={setRoi}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={onSubmit}
              disabled={phase === "submitting" || !roi}
              type="button"
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {phase === "submitting" ? "Analyzing…" : "Submit for analysis"}
            </button>
            <span className="text-xs text-slate-500">
              Anonymous. Photo stored server-side; not displayed publicly.
            </span>
          </div>
        </div>
      )}

      {phase === "result" && observation && (
        <ResultsCard observation={observation} onReset={reset} />
      )}

      {error && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
          {error}
        </div>
      )}
    </div>
  );
}

interface CanvasFrameProps {
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  readonly dims: CanvasDims | null;
  readonly roi: StripRoi | null;
  readonly setRoi: (r: StripRoi) => void;
}

function CanvasFrame({ canvasRef, dims, roi, setRoi }: CanvasFrameProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    kind: "move" | "resize";
    startX: number;
    startY: number;
    orig: StripRoi;
  } | null>(null);

  const toCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const wrapper = wrapperRef.current;
      if (!wrapper || !dims) return { x: 0, y: 0 };
      const rect = wrapper.getBoundingClientRect();
      const sx = dims.width / rect.width;
      const sy = dims.height / rect.height;
      return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
    },
    [dims],
  );

  const onPointerDownMove = useCallback(
    (e: React.PointerEvent) => {
      if (!roi) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const { x, y } = toCanvasCoords(e.clientX, e.clientY);
      dragState.current = { kind: "move", startX: x, startY: y, orig: roi };
    },
    [roi, toCanvasCoords],
  );

  const onPointerDownResize = useCallback(
    (e: React.PointerEvent) => {
      if (!roi) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const { x, y } = toCanvasCoords(e.clientX, e.clientY);
      dragState.current = { kind: "resize", startX: x, startY: y, orig: roi };
    },
    [roi, toCanvasCoords],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragState.current;
      if (!ds || !dims) return;
      const { x, y } = toCanvasCoords(e.clientX, e.clientY);
      const dx = x - ds.startX;
      const dy = y - ds.startY;
      if (ds.kind === "move") {
        setRoi({
          x: clamp(ds.orig.x + dx, 0, dims.width - ds.orig.width),
          y: clamp(ds.orig.y + dy, 0, dims.height - ds.orig.height),
          width: ds.orig.width,
          height: ds.orig.height,
        });
      } else {
        setRoi({
          x: ds.orig.x,
          y: ds.orig.y,
          width: clamp(ds.orig.width + dx, 12, dims.width - ds.orig.x),
          height: clamp(ds.orig.height + dy, 24, dims.height - ds.orig.y),
        });
      }
    },
    [dims, setRoi, toCanvasCoords],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragState.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const showOverlay = roi && dims;

  return (
    <div ref={wrapperRef} className="relative inline-block w-full max-w-2xl">
      <canvas ref={canvasRef} className="block w-full rounded-lg border border-slate-700" />
      {showOverlay && (
        <div
          className="absolute border-2 border-cyan-400 bg-cyan-400/10"
          style={{
            left: `${(roi.x / dims.width) * 100}%`,
            top: `${(roi.y / dims.height) * 100}%`,
            width: `${(roi.width / dims.width) * 100}%`,
            height: `${(roi.height / dims.height) * 100}%`,
          }}
        >
          <div
            className="absolute inset-0 cursor-move"
            onPointerDown={onPointerDownMove}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          <div
            className="absolute -bottom-2 -right-2 size-4 cursor-nwse-resize rounded-sm bg-cyan-400"
            onPointerDown={onPointerDownResize}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col">
            {Array.from({ length: GENERIC_9PAD_CHART.analytes.length }).map((_, i) => (
              <div key={i} className="flex-1 border-b border-cyan-400/30 last:border-b-0" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}
