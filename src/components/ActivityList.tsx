import type { StravaActivity } from "@/lib/strava";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDistance(meters: number): string {
  if (meters <= 0) return "";
  return `${(meters / 1000).toFixed(1)} km`;
}

export function ActivityList({ activities }: { activities: StravaActivity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-400">No activities in the last 90 days.</p>;
  }

  return (
    <ul className="divide-y divide-white/10">
      {activities.map((a) => (
        <li key={a.id} className="flex items-center justify-between py-2 text-sm">
          <div>
            <div className="font-medium text-slate-100">{a.name}</div>
            <div className="text-xs text-slate-400">
              {a.type} · {new Date(a.start_date).toLocaleDateString()}
            </div>
          </div>
          <div className="text-right text-xs tabular-nums text-slate-400">
            <div>{formatDuration(a.moving_time)}</div>
            <div>{formatDistance(a.distance)}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
