"use client";

import { useRef, useState } from "react";
import type { PhotoMode, VisionNutritionResult } from "@/lib/vision-nutrition";

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [prefix, base64] = result.split(",");
      const mediaType = prefix.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
      resolve({ base64, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoScan({ onResult }: { onResult: (result: VisionNutritionResult) => void }) {
  const [mode, setMode] = useState<PhotoMode>("label");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setLoading(true);
    try {
      const { base64, mediaType } = await fileToBase64(file);
      const res = await fetch("/api/photo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image: base64, mediaType, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Photo analysis failed");
      onResult(data as VisionNutritionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded border border-slate-800 p-3">
      <div className="mb-2 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("label")}
          className={`rounded px-2 py-1 ${mode === "label" ? "bg-emerald-500 text-slate-950" : "border border-slate-700 text-slate-300"}`}
        >
          Nutrition label
        </button>
        <button
          type="button"
          onClick={() => setMode("meal")}
          className={`rounded px-2 py-1 ${mode === "meal" ? "bg-emerald-500 text-slate-950" : "border border-slate-700 text-slate-300"}`}
        >
          Meal/plate
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full rounded border border-slate-700 px-3 py-2 text-sm hover:border-slate-500 disabled:opacity-50"
      >
        {loading ? "Analyzing photo..." : mode === "label" ? "Take/upload photo of label" : "Take/upload photo of meal"}
      </button>
      {mode === "meal" && (
        <p className="mt-2 text-xs text-slate-500">
          Meal photos give an estimate, not exact numbers &mdash; review before saving.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
