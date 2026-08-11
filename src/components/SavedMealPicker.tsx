"use client";

import { useEffect, useState } from "react";
import type { SavedMeal } from "@/lib/types";

export default function SavedMealPicker({
  onAddMany,
}: {
  onAddMany: (items: { foodId: string; servings: number }[]) => void;
}) {
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SavedMeal | null>(null);
  const [servings, setServings] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/saved-meals")
      .then((r) => r.json())
      .then((data) => {
        setSavedMeals(data);
        setLoading(false);
      });
  }, []);

  function selectMeal(meal: SavedMeal) {
    setSelected(meal);
    setServings(Object.fromEntries(meal.items.map((i) => [i.id, i.servings])));
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSavedMeals((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/saved-meals/${id}`, { method: "DELETE" });
  }

  function handleAdd() {
    if (!selected) return;
    onAddMany(selected.items.map((i) => ({ foodId: i.foodId, servings: servings[i.id] ?? i.servings })));
    setSelected(null);
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  if (savedMeals.length === 0) {
    return <p className="text-sm text-slate-500">No saved meals yet. Log some foods, then &quot;Save as meal&quot;.</p>;
  }

  if (selected) {
    return (
      <div className="rounded border border-slate-700 bg-slate-900 p-3">
        <p className="mb-2 font-medium">{selected.name}</p>
        <ul className="flex flex-col gap-2">
          {selected.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{item.food.name}</span>
              <input
                type="number"
                min={0.25}
                step="any"
                value={servings[item.id] ?? item.servings}
                onChange={(e) => setServings((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1"
              />
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleAdd}
            className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Add all
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
    <ul className="max-h-64 divide-y divide-slate-800 overflow-y-auto rounded border border-slate-700">
      {savedMeals.map((meal) => (
        <li key={meal.id}>
          <button
            onClick={() => selectMeal(meal)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-800"
          >
            <span>
              <span className="font-medium">{meal.name}</span>
              <span className="text-slate-400"> &middot; {meal.items.length} items</span>
            </span>
            <span onClick={(e) => handleDelete(meal.id, e)} className="text-red-400 hover:text-red-300">
              Delete
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
