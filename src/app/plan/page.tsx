"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateActivityPlan, projectedWeightForWeek } from "@/lib/plan";
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
  const hasWeightPlan = goal.startWeightKg != null && goal.goalWeightKg != null;
  const toLoseKg = hasWeightPlan ? Math.abs(goal.startWeightKg! - goal.goalWeightKg!) : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{goal.planWeeks}-week plan</h1>
      {hasWeightPlan ? (
        <p className="text-sm text-slate-400">
          {goal.startWeightKg}kg &rarr; {goal.goalWeightKg}kg ({toLoseKg!.toFixed(1)}kg over {goal.planWeeks} weeks)
        </p>
      ) : (
        <p className="text-sm text-amber-400">
          Set your current weight and goal weight on the{" "}
          <Link href="/goals" className="text-emerald-400">
            Goals page
          </Link>{" "}
          to see a projected weight line here.
        </p>
      )}
      <p className="text-sm text-slate-400">
        Daily step target ramps up toward 12,000/day. The final 3 weeks add an incline treadmill walk on top,
        starting at 15 minutes and building to 30. Calorie target and projected weight are shown alongside so the
        whole plan moves together.
      </p>
      <div className="overflow-x-auto rounded border border-slate-800">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-400">
              <th className="px-4 py-2 font-medium">Week</th>
              <th className="px-4 py-2 font-medium">Calories</th>
              <th className="px-4 py-2 font-medium">Steps/day</th>
              <th className="px-4 py-2 font-medium">Treadmill</th>
              <th className="px-4 py-2 font-medium">Est. weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {weeks.map((w) => (
              <tr key={w.week}>
                <td className="px-4 py-3 font-medium">{w.week}</td>
                <td className="px-4 py-3 text-slate-300">{goal.calories.toLocaleString()} kcal</td>
                <td className="px-4 py-3 text-slate-300">{w.stepsTarget.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {w.treadmill ? (
                    <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-400">
                      +{w.treadmill.minutes} min incline
                    </span>
                  ) : (
                    <span className="text-slate-600">&mdash;</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {hasWeightPlan
                    ? `${projectedWeightForWeek({
                        week: w.week,
                        startWeightKg: goal.startWeightKg!,
                        goalWeightKg: goal.goalWeightKg!,
                        totalWeeks: goal.planWeeks,
                      }).toFixed(1)}kg`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
