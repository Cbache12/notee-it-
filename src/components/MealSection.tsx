"use client";

import { useState } from "react";
import FoodPicker from "@/components/FoodPicker";
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
  const calories = entries.reduce((sum, e) => sum + e.food.calories * e.servings, 0);

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
      <div className="p-3">
        {picking ? (
          <FoodPicker
            onAdd={(foodId, servings) => {
              onAdd(foodId, servings);
              setPicking(false);
            }}
          />
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
