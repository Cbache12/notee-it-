"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { todayDateOnly } from "@/lib/date";
import type { Goal, WeightEntry } from "@/lib/types";

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goal, setGoal] = useState<Goal>(null);
  const [date, setDate] = useState(todayDateOnly());
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [entriesRes, goalRes] = await Promise.all([fetch("/api/weight"), fetch("/api/goal")]);
    setEntries(await entriesRes.json());
    setGoal(await goalRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    const res = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, weightKg: Number(weight) }),
    });
    if (res.ok) {
      setWeight("");
      load();
    }
  }

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/weight/${id}`, { method: "DELETE" });
  }

  const chartData = entries.map((e) => ({ date: e.date.slice(0, 10), weightKg: e.weightKg }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Weight</h1>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <label className="text-sm text-slate-400">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="text-sm text-slate-400">
          Weight (kg)
          <input
            type="number"
            step="any"
            min={0}
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-1 block w-28 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>
        <button type="submit" className="rounded bg-emerald-500 px-3 py-2 font-medium text-slate-950 hover:bg-emerald-400">
          Log
        </button>
      </form>

      {!loading && chartData.length > 1 && (
        <div className="h-64 rounded border border-slate-800 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
              {goal?.goalWeightKg && (
                <ReferenceLine y={goal.goalWeightKg} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Goal", fill: "#22c55e", fontSize: 11 }} />
              )}
              <Line type="monotone" dataKey="weightKg" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && (
        <ul className="divide-y divide-slate-800 rounded border border-slate-800">
          {[...entries].reverse().map((entry) => (
            <li key={entry.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>{entry.date.slice(0, 10)}</span>
              <span className="flex items-center gap-3">
                <span>{entry.weightKg} kg</span>
                <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-300">
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
