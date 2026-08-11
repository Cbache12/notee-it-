"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateActivityPlan } from "@/lib/plan";
import type { Goal } from "@/lib/types";

export default function PlanPage() {
  const [goal, setGoal] = useState<Goal>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/goal")
      .then((r) => r.json())
      .then((g) => {
        setGoal(g);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  if (!goal) {
    return (
      <p className="text-sm text-slate-400">
        Set a goal first on the{" "}
        <Link href="/goals" className="text-emerald-400">
          Goals page
        </Link>
        .
      </p>
    );
  }

  const weeks = generateActivityPlan(goal.planWeeks);
  const toLoseKg =
    goal.startWeightKg != null && goal.goalWeightKg != null
      ? Math.max(0, goal.startWeightKg - goal.goalWeightKg)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{goal.planWeeks}-week activity plan</h1>
      {toLoseKg != null && (
        <p className="text-sm text-slate-400">
          {goal.startWeightKg}kg &rarr; {goal.goalWeightKg}kg ({toLoseKg.toFixed(1)}kg to go)
        </p>
      )}
      <p className="text-sm text-slate-400">
        Daily step target ramps up toward 12,000/day. The final 3 weeks add an incline treadmill walk on top,
        starting at 15 minutes and building to 30.
      </p>
      <ul className="divide-y divide-slate-800 rounded border border-slate-800">
        {weeks.map((w) => (
          <li key={w.week} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">Week {w.week}</span>
            <span className="flex items-center gap-4 text-sm text-slate-300">
              <span>{w.stepsTarget.toLocaleString()} steps/day</span>
              {w.treadmill && (
                <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-400">
                  +{w.treadmill.minutes} min incline treadmill
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
