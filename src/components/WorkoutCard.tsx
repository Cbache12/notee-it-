import type { WorkoutRecommendation } from "@/lib/coach";

export function WorkoutCard({ recommendation }: { recommendation: WorkoutRecommendation }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 p-5">
      <div className="text-xs uppercase tracking-wide text-slate-400">Today&apos;s recommendation</div>
      <div className="mt-1 text-xl font-semibold text-slate-50">{recommendation.title}</div>
      <div className="mt-1 text-sm text-slate-400">
        {recommendation.durationMin > 0 ? `${recommendation.durationMin} min · ` : ""}
        {recommendation.intensity}
      </div>
      <p className="mt-3 text-sm text-slate-300">{recommendation.rationale}</p>
    </div>
  );
}
