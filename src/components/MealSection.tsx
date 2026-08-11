"use client";

import { useState } from "react";
import FoodPicker from "@/components/FoodPicker";
import SavedMealPicker from "@/components/SavedMealPicker";
import type { LogEntry, MealType } from "@/lib/types";

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snacks",
};

export default function MealSection({
  meal,
  entries,
  onAdd,
  onDelete,
}: {
  meal: MealType;
  entries: LogEntry[];
  onAdd: (foodId: string, servings: number) => void;
  onDelete: (id: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  const [pickerTab, setPickerTab] = useState<"search" | "saved">("search");
  const [savingMeal, setSavingMeal] = useState(false);
  const [saveMealName, setSaveMealName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const calories = entries.reduce((sum, e) => sum + e.food.calories * e.servings, 0);

  async function handleSaveAsMeal(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const res = await fetch("/api/saved-meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: saveMealName,
        items: entries.map((entry) => ({ foodId: entry.foodId, servings: entry.servings })),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSaveError(data.error ?? "Couldn't save this meal");
      return;
    }
    setSavingMeal(false);
    setSaveMealName("");
  }

  return (
    <div className="rounded border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <h3 className="font-medium">{MEAL_LABELS[meal]}</h3>
        <span className="text-sm text-slate-400">{Math.round(calories)} kcal</span>
      </div>
      {entries.length > 0 && (
        <ul className="divide-y divide-slate-800">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>
                {entry.food.name}
                <span className="text-slate-400">
                  {" "}
                  &middot; {entry.servings} &times; {entry.food.servingSize}
                  {entry.food.servingUnit}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-slate-400">{Math.round(entry.food.calories * entry.servings)} kcal</span>
                <button onClick={() => onDelete(entry.id)} className="text-red-400 hover:text-red-300">
                  &times;
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {entries.length > 0 && (
        <div className="border-t border-slate-800 px-3 py-2">
          {savingMeal ? (
            <form onSubmit={handleSaveAsMeal} className="flex items-center gap-2">
              <input
                type="text"
                required
                autoFocus
                placeholder="Meal name (e.g. Chicken & rice)"
                value={saveMealName}
                onChange={(e) => setSaveMealName(e.target.value)}
                className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
              />
              <button type="submit" className="rounded bg-emerald-500 px-2 py-1 text-sm font-medium text-slate-950 hover:bg-emerald-400">
                Save
              </button>
              <button type="button" onClick={() => setSavingMeal(false)} className="text-sm text-slate-400 hover:text-white">
                Cancel
              </button>
            </form>
          ) : (
            <button onClick={() => setSavingMeal(true)} className="text-sm text-slate-400 hover:text-white">
              Save as meal
            </button>
          )}
          {saveError && <p className="mt-1 text-sm text-red-400">{saveError}</p>}
        </div>
      )}

      <div className="p-3">
        {picking ? (
          <div>
            <div className="mb-2 flex gap-2 text-sm">
              <button
                onClick={() => setPickerTab("search")}
                className={`rounded px-2 py-1 ${pickerTab === "search" ? "bg-emerald-500 text-slate-950" : "border border-slate-700 text-slate-300"}`}
              >
                Search
              </button>
              <button
                onClick={() => setPickerTab("saved")}
                className={`rounded px-2 py-1 ${pickerTab === "saved" ? "bg-emerald-500 text-slate-950" : "border border-slate-700 text-slate-300"}`}
              >
                My meals
              </button>
            </div>
            {pickerTab === "search" ? (
              <FoodPicker
                onAdd={(foodId, servings) => {
                  onAdd(foodId, servings);
                  setPicking(false);
                }}
              />
            ) : (
              <SavedMealPicker
                onAddMany={(items) => {
                  for (const item of items) onAdd(item.foodId, item.servings);
                  setPicking(false);
                }}
              />
            )}
          </div>
        ) : (
          <button
            onClick={() => setPicking(true)}
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            + Add food
          </button>
        )}
      </div>
    </div>
  );
}
