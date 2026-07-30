"use client";

import { useState } from "react";
import type { GoalSettings } from "@/lib/goal";

interface Props {
  goal: GoalSettings | null;
  planWeeks: number;
  onSaved: (goal: GoalSettings | null) => void;
}

export function GoalForm({ goal, planWeeks, onSaved }: Props) {
  const [raceName, setRaceName] = useState(goal?.raceName ?? "");
  const [raceDate, setRaceDate] = useState(goal?.raceDate ?? "");
  const [editing, setEditing] = useState(!goal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raceName, raceDate }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save goal");
      onSaved(json.goal);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goal");
    } finally {
      setSaving(false);
    }
  }

  async function clearGoal() {
    setSaving(true);
    try {
      await fetch("/api/goal", { method: "DELETE" });
      setRaceName("");
      setRaceDate("");
      onSaved(null);
      setEditing(true);
    } finally {
      setSaving(false);
    }
  }

  if (!editing && goal) {
    return (
      <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Race goal</div>
            <div className="mt-1 font-medium text-slate-50">{goal.raceName}</div>
            <div className="text-sm text-slate-400">
              {new Date(`${goal.raceDate}T00:00:00Z`).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}{" "}
              · {planWeeks}-week plan
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-slate-400 underline"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="rounded-lg border border-white/10 bg-slate-900 p-4">
      <div className="mb-3 text-xs uppercase tracking-wide text-slate-400">
        {goal ? "Edit race goal" : "Set a race goal"}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Race name (e.g. Barossa Half Marathon)"
          value={raceName}
          onChange={(e) => setRaceName(e.target.value)}
          required
          className="flex-1 rounded border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100"
        />
        <input
          type="date"
          value={raceDate}
          onChange={(e) => setRaceDate(e.target.value)}
          required
          className="rounded border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
        >
          Save
        </button>
        {goal && (
          <button
            type="button"
            onClick={clearGoal}
            disabled={saving}
            className="rounded border border-white/10 px-4 py-2 text-sm text-slate-400"
          >
            Clear
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {!goal && (
        <p className="mt-2 text-xs text-slate-500">
          No goal set — the plan defaults to a generic 12-week rolling block.
        </p>
      )}
    </form>
  );
}
