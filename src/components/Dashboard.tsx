"use client";

import { useEffect, useState } from "react";
import type { StravaActivity } from "@/lib/strava";
import type { LoadSummary } from "@/lib/training-load";
import type { TrainingPlan, WorkoutRecommendation } from "@/lib/coach";
import { LoadChart } from "./LoadChart";
import { StatusTile } from "./StatusTile";
import type { Status } from "./StatusTile";
import { WorkoutCard } from "./WorkoutCard";
import { PlanView } from "./PlanView";
import { ActivityList } from "./ActivityList";

interface DashboardData {
  athlete: { name: string; avatar: string | null };
  summary: LoadSummary;
  recommendation: WorkoutRecommendation;
  plan: TrainingPlan;
  activities: StravaActivity[];
}

const RISK_STATUS: Record<LoadSummary["riskBand"], { status: Status; label: string; description: string }> = {
  low: { status: "good", label: "Low load", description: "Below the typical training range — safe, but watch for detraining." },
  "sweet-spot": { status: "good", label: "Sweet spot", description: "Acute and chronic load are well balanced." },
  caution: { status: "warning", label: "Caution", description: "Load is rising faster than your base fitness can absorb yet." },
  "high-risk": { status: "critical", label: "High risk", description: "Injury/overreaching risk is elevated — back off." },
};

const FORM_STATUS: Record<LoadSummary["formBand"], { status: Status; label: string; description: string }> = {
  fresh: { status: "good", label: "Fresh", description: "Well recovered — a good day to go hard." },
  neutral: { status: "good", label: "Neutral", description: "Normal training state." },
  fatigued: { status: "warning", label: "Fatigued", description: "Accumulating fatigue — expected during a build block." },
  overreaching: { status: "critical", label: "Overreaching", description: "Fatigue is well beyond fitness — prioritize recovery." },
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load dashboard");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-slate-300">
        <p>Couldn&apos;t load your training data: {error}</p>
        <a href="/api/strava/login" className="mt-4 inline-block underline">
          Reconnect Strava
        </a>
      </div>
    );
  }

  if (!data) {
    return <div className="py-16 text-center text-slate-400">Loading your training data…</div>;
  }

  const risk = RISK_STATUS[data.summary.riskBand];
  const form = FORM_STATUS[data.summary.formBand];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {data.athlete.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.athlete.avatar} alt="" className="h-10 w-10 rounded-full" />
          )}
          <div>
            <div className="font-semibold text-slate-50">{data.athlete.name}</div>
            <div className="text-xs text-slate-400">Training Coach</div>
          </div>
        </div>
        <a href="/api/strava/logout" className="text-sm text-slate-400 underline">
          Disconnect
        </a>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatusTile
          label="Acute:chronic workload ratio"
          value={data.summary.acwr.toFixed(2)}
          status={risk.status}
          statusLabel={risk.label}
          description={risk.description}
        />
        <StatusTile
          label="Training stress balance"
          value={data.summary.tsb.toFixed(0)}
          status={form.status}
          statusLabel={form.label}
          description={form.description}
        />
      </section>

      <WorkoutCard recommendation={data.recommendation} />

      <LoadChart series={data.summary.series} />

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-50">12-week training plan</h2>
        <PlanView plan={data.plan} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-50">Recent activities</h2>
        <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
          <ActivityList activities={data.activities} />
        </div>
      </section>
    </div>
  );
}
