"use client";

import { useEffect, useState } from "react";
import type { Food, SearchFood } from "@/lib/types";

export default function FoodPicker({ onAdd }: { onAdd: (foodId: string, servings: number) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SearchFood | null>(null);
  const [servings, setServings] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  async function resolveFoodId(food: SearchFood): Promise<string | null> {
    if (food.id) return food.id;
    if (!food.barcode) return null;
    const res = await fetch(`/api/foods/barcode/${encodeURIComponent(food.barcode)}`);
    if (!res.ok) return null;
    const materialized: Food = await res.json();
    return materialized.id;
  }

  async function handleAdd() {
    if (!selected) return;
    setError(null);
    const foodId = await resolveFoodId(selected);
    if (!foodId) {
      setError("Couldn't add this food, try again");
      return;
    }
    onAdd(foodId, servings);
    setSelected(null);
    setQuery("");
    setResults([]);
    setServings(1);
  }

  if (selected) {
    const cals = Math.round(selected.calories * servings);
    return (
      <div className="rounded border border-slate-700 bg-slate-900 p-3">
        <p className="font-medium">{selected.name}</p>
        {selected.brand && <p className="text-xs text-slate-400">{selected.brand}</p>}
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1"
          />
          <span className="text-sm text-slate-400">
            servings ({selected.servingSize}
            {selected.servingUnit} each) &middot; {cals} kcal
          </span>
        </div>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleAdd}
            className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Add
          </button>
          <button
            onClick={() => setSelected(null)}
            className="rounded border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search foods or scan a barcode number..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        autoFocus
      />
      {loading && <p className="mt-2 text-xs text-slate-500">Searching...</p>}
      {results.length > 0 && (
        <ul className="mt-2 max-h-64 divide-y divide-slate-800 overflow-y-auto rounded border border-slate-700">
          {results.map((food) => (
            <li key={food.id ?? food.barcode}>
              <button
                onClick={() => setSelected(food)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-800"
              >
                <span>
                  <span className="font-medium">{food.name}</span>
                  {food.brand && <span className="text-slate-400"> &middot; {food.brand}</span>}
                </span>
                <span className="text-slate-400">{Math.round(food.calories)} kcal</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
