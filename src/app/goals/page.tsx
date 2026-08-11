"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { estimateTdee, suggestGoal, type ActivityLevel, type Sex } from "@/lib/nutrition";
import type { Goal } from "@/lib/types";

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary (little/no exercise)" },
  { value: "light", label: "Light (1-3 days/week)" },
  { value: "moderate", label: "Moderate (3-5 days/week)" },
  { value: "active", label: "Active (6-7 days/week)" },
  { value: "very_active", label: "Very active (physical job / 2x/day)" },
];

export default function GoalsPage() {
  const [calories, setCalories] = useState("2000");
  const [proteinG, setProteinG] = useState("150");
  const [carbsG, setCarbsG] = useState("200");
  const [fatG, setFatG] = useState("60");
  const [startWeightKg, setStartWeightKg] = useState("");
  const [goalWeightKg, setGoalWeightKg] = useState("");
  const [planWeeks, setPlanWeeks] = useState(6);
  const [saved, setSaved] = useState(false);

  // TDEE calculator inputs
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("30");
  const [heightCm, setHeightCm] = useState("175");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [weeklyChangeKg, setWeeklyChangeKg] = useState("-0.5");
  const [calculatorError, setCalculatorError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/goal")
      .then((r) => r.json())
      .then((goal: Goal) => {
        if (!goal) return;
        setCalories(String(goal.calories));
        setProteinG(String(goal.proteinG));
        setCarbsG(String(goal.carbsG));
        setFatG(String(goal.fatG));
        if (goal.startWeightKg) setStartWeightKg(String(goal.startWeightKg));
        if (goal.goalWeightKg) setGoalWeightKg(String(goal.goalWeightKg));
        setPlanWeeks(goal.planWeeks);
      });
  }, []);

  function applyCalculator() {
    const missing: string[] = [];
    if (!startWeightKg) missing.push("Weight");
    if (!heightCm) missing.push("Height");
    if (!age) missing.push("Age");
    if (!weeklyChangeKg) missing.push("Weekly weight change");
    if (missing.length > 0) {
      setCalculatorError(`Fill in ${missing.join(", ")} first.`);
      return;
    }

    setCalculatorError(null);
    const tdee = estimateTdee(
      { sex, weightKg: Number(startWeightKg), heightCm: Number(heightCm), age: Number(age) },
      activity
    );
    const suggestion = suggestGoal({
      tdee,
      weightKg: Number(startWeightKg),
      weeklyChangeKg: Number(weeklyChangeKg),
    });
    setCalories(String(suggestion.calories));
    setProteinG(String(suggestion.proteinG));
    setCarbsG(String(suggestion.carbsG));
    setFatG(String(suggestion.fatG));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    await fetch("/api/goal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calories: Number(calories),
        proteinG: Number(proteinG),
        carbsG: Number(carbsG),
        fatG: Number(fatG),
        startWeightKg: startWeightKg ? Number(startWeightKg) : undefined,
        goalWeightKg: goalWeightKg ? Number(goalWeightKg) : undefined,
        planWeeks,
      }),
    });
    setSaved(true);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <div>
        <h1 className="mb-4 text-xl font-semibold">TDEE calculator</h1>
        <div className="flex flex-col gap-3 rounded border border-slate-800 p-4">
          <div className="flex gap-2">
            <label className="flex-1 text-sm text-slate-400">
              Sex
              <select value={sex} onChange={(e) => setSex(e.target.value as Sex)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="flex-1 text-sm text-slate-400">
              Age
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" />
            </label>
          </div>
          <div className="flex gap-2">
            <label className="flex-1 text-sm text-slate-400">
              Height (cm)
              <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" />
            </label>
            <label className="flex-1 text-sm text-slate-400">
              Weight (kg)
              <input
                type="number"
                step="any"
                placeholder="Required"
                value={startWeightKg}
                onChange={(e) => setStartWeightKg(e.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100"
              />
            </label>
          </div>
          <label className="text-sm text-slate-400">
            Activity level
            <select value={activity} onChange={(e) => setActivity(e.target.value as ActivityLevel)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100">
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-400">
            Weekly weight change (kg, negative to lose)
            <input type="number" step="any" value={weeklyChangeKg} onChange={(e) => setWeeklyChangeKg(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" />
          </label>
          {calculatorError && <p className="text-sm text-red-400">{calculatorError}</p>}
          <button type="button" onClick={applyCalculator} className="rounded border border-slate-700 px-3 py-2 text-sm hover:border-slate-500">
            Calculate & fill in below
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Daily targets</h2>
        <label className="text-sm text-slate-400">
          Calories
          <input type="number" required value={calories} onChange={(e) => setCalories(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
        </label>
        <div className="flex gap-2">
          <label className="flex-1 text-sm text-slate-400">
            Protein (g)
            <input type="number" required value={proteinG} onChange={(e) => setProteinG(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
          </label>
          <label className="flex-1 text-sm text-slate-400">
            Carbs (g)
            <input type="number" required value={carbsG} onChange={(e) => setCarbsG(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
          </label>
          <label className="flex-1 text-sm text-slate-400">
            Fat (g)
            <input type="number" required value={fatG} onChange={(e) => setFatG(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
          </label>
        </div>

        <h2 className="text-lg font-semibold">Weight goal & activity plan</h2>
        <div className="flex gap-2">
          <label className="flex-1 text-sm text-slate-400">
            Goal weight (kg)
            <input type="number" step="any" value={goalWeightKg} onChange={(e) => setGoalWeightKg(e.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
          </label>
          <label className="flex-1 text-sm text-slate-400">
            Plan length (weeks)
            <select value={planWeeks} onChange={(e) => setPlanWeeks(Number(e.target.value))} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
              {[4, 5, 6, 7, 8].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        </div>

        {saved && <p className="text-sm text-emerald-400">Saved.</p>}
        <button type="submit" className="rounded bg-emerald-500 px-3 py-2 font-medium text-slate-950 hover:bg-emerald-400">
          Save goals
        </button>
      </form>

      <p className="text-sm text-slate-400">
        See your step + treadmill ramp on the{" "}
        <Link href="/plan" className="text-emerald-400">
          activity plan
        </Link>
        .
      </p>
    </div>
  );
}
