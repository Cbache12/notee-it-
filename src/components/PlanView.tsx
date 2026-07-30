"use client";

import { useState } from "react";
import type { PlanWeek, TrainingPlan, WorkoutType } from "@/lib/coach";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TYPE_COLOR: Record<WorkoutType, string> = {
  rest: "#898781",
  recovery: "#2a78d6",
  endurance: "#1baf7a",
  tempo: "#eda100",
  intervals: "#e34948",
  long: "#4a3aa7",
  strength: "#008300",
};

const PHASE_LABEL: Record<PlanWeek["phase"], string> = {
  base: "Base",
  build: "Build",
  peak: "Peak",
  taper: "Taper",
};

function WeekRow({ week, defaultOpen }: { week: PlanWeek; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="font-medium text-slate-100">Week {week.weekNumber}</span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {PHASE_LABEL[week.phase]}
          </span>
          {week.isRecoveryWeek && (
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">Cutback</span>
          )}
        </span>
        <span className="text-sm tabular-nums text-slate-400">{week.targetHours.toFixed(1)} h</span>
      </button>

      {open && (
        <ul className="divide-y divide-white/10 border-t border-white/10 px-4">
          {week.sessions.map((s, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: TYPE_COLOR[s.type] }}
                  aria-hidden="true"
                />
                <span className="w-10 text-slate-400">{DAY_LABELS[s.dayOffset]}</span>
                <span className="text-slate-100">{s.title}</span>
              </span>
              <span className="tabular-nums text-slate-400">
                {s.durationMin > 0 ? `${s.durationMin} min` : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PlanView({ plan }: { plan: TrainingPlan }) {
  return (
    <div className="space-y-2">
      {plan.weeks.map((week) => (
        <WeekRow key={week.weekNumber} week={week} defaultOpen={week.weekNumber === 1} />
      ))}
    </div>
  );
}
