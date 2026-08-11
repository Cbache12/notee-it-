"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhotoScan from "@/components/PhotoScan";
import type { VisionNutritionResult } from "@/lib/vision-nutrition";

const FIELDS = [
  { name: "servingSize", label: "Serving size" },
  { name: "calories", label: "Calories" },
  { name: "proteinG", label: "Protein (g)" },
  { name: "carbsG", label: "Carbs (g)" },
  { name: "fatG", label: "Fat (g)" },
] as const;

export default function NewFoodPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingUnit, setServingUnit] = useState("g");
  const [values, setValues] = useState<Record<(typeof FIELDS)[number]["name"], string>>({
    servingSize: "100",
    calories: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);

  function handleScanResult(result: VisionNutritionResult) {
    const round1 = (n: number) => Math.round(n * 10) / 10;
    setName(result.name);
    setServingUnit(result.servingUnit);
    setValues({
      servingSize: String(round1(result.servingSize)),
      calories: String(Math.round(result.calories)),
      proteinG: String(round1(result.proteinG)),
      carbsG: String(round1(result.carbsG)),
      fatG: String(round1(result.fatG)),
    });
    setScanNote(result.note ?? "Filled in from a photo scan — double-check before saving.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        brand: brand || undefined,
        servingUnit,
        servingSize: Number(values.servingSize),
        calories: Number(values.calories),
        proteinG: Number(values.proteinG),
        carbsG: Number(values.carbsG),
        fatG: Number(values.fatG),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    router.push("/foods");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold">New food</h1>
      <div className="mb-6">
        <PhotoScan onResult={handleScanResult} />
        {scanNote && <p className="mt-2 text-sm text-amber-400">{scanNote}</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
        />
        <input
          type="text"
          placeholder="Brand (optional)"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
        />
        <div className="flex gap-2">
          <label className="flex-1 text-sm text-slate-400">
            Serving size
            <input
              type="number"
              required
              min={0}
              step="any"
              value={values.servingSize}
              onChange={(e) => setValues((v) => ({ ...v, servingSize: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="flex-1 text-sm text-slate-400">
            Unit
            <input
              type="text"
              required
              value={servingUnit}
              onChange={(e) => setServingUnit(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
        </div>
        {FIELDS.slice(1).map((field) => (
          <label key={field.name} className="text-sm text-slate-400">
            {field.label}
            <input
              type="number"
              required
              min={0}
              step="any"
              value={values[field.name]}
              onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>
        ))}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-emerald-500 px-3 py-2 font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save food"}
        </button>
      </form>
    </div>
  );
}
