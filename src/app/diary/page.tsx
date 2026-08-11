"use client";

import { useEffect, useMemo, useState } from "react";
import MealSection from "@/components/MealSection";
import MacroBar from "@/components/MacroBar";
import { sumMacros, scaleNutrition } from "@/lib/nutrition";
import { todayDateOnly } from "@/lib/date";
import type { Goal, LogEntry, MealType } from "@/lib/types";

const MEALS: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function DiaryPage() {
  const [date, setDate] = useState(todayDateOnly());
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [goal, setGoal] = useState<Goal>(null);
  const [loading, setLoading] = useState(true);

  async function loadEntries(forDate: string) {
    setLoading(true);
    const res = await fetch(`/api/log?date=${forDate}`);
    setEntries(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadEntries(date);
  }, [date]);

  useEffect(() => {
    fetch("/api/goal")
      .then((r) => r.json())
      .then(setGoal);
  }, []);

  const totals = useMemo(
    () => sumMacros(entries.map((e) => scaleNutrition(e.food, e.servings))),
    [entries]
  );

  async function handleAdd(meal: MealType, foodId: string, servings: number) {
    const res = await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodId, meal, servings, date }),
    });
    if (res.ok) {
      const entry = await res.json();
      setEntries((prev) => [...prev, entry]);
    }
  }

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/log/${id}`, { method: "DELETE" });
  }

  const isToday = date === todayDateOnly();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setDate((d) => shiftDate(d, -1))} className="rounded border border-slate-700 px-3 py-1.5 hover:border-slate-500">
          &larr;
        </button>
        <div className="text-center">
          <p className="font-medium">{isToday ? "Today" : date}</p>
          {!isToday && (
            <button onClick={() => setDate(todayDateOnly())} className="text-xs text-emerald-400">
              Back to today
            </button>
          )}
        </div>
        <button onClick={() => setDate((d) => shiftDate(d, 1))} className="rounded border border-slate-700 px-3 py-1.5 hover:border-slate-500">
          &rarr;
        </button>
      </div>

      <div className="rounded border border-slate-800 p-4">
        {goal ? (
          <div className="flex flex-col gap-3">
            <MacroBar label="Calories" value={totals.calories} target={goal.calories} unit=" kcal" colorClass="bg-emerald-500" />
            <MacroBar label="Protein" value={totals.proteinG} target={goal.proteinG} colorClass="bg-sky-500" />
            <MacroBar label="Carbs" value={totals.carbsG} target={goal.carbsG} colorClass="bg-amber-500" />
            <MacroBar label="Fat" value={totals.fatG} target={goal.fatG} colorClass="bg-rose-500" />
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No goal set yet.{" "}
            <a href="/goals" className="text-emerald-400">
              Set a calorie & macro goal
            </a>
            .
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {MEALS.map((meal) => (
            <MealSection
              key={meal}
              meal={meal}
              entries={entries.filter((e) => e.meal === meal)}
              onAdd={(foodId, servings) => handleAdd(meal, foodId, servings)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
