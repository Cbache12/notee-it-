import type { StravaActivity } from "./strava";

/** Time constants (days) for the Banister-style impulse-response model, as popularized by Coggan's PMC (CTL/ATL/TSB). */
const CTL_TIME_CONSTANT = 42;
const ATL_TIME_CONSTANT = 7;

const DEFAULT_TYPE_INTENSITY: Record<string, number> = {
  Run: 3,
  TrailRun: 3.2,
  Ride: 2.5,
  VirtualRide: 2.5,
  Swim: 3,
  Walk: 1,
  Hike: 1.5,
  WeightTraining: 2,
  Workout: 2.2,
  Yoga: 1,
  Rowing: 2.8,
};
const DEFAULT_INTENSITY_FALLBACK = 2;

export interface AthleteHrProfile {
  restingHr?: number;
  maxHr?: number;
}

/**
 * Estimates a single training-load "impulse" for one activity.
 * Prefers Strava's own Relative Effort (suffer_score); falls back to a
 * Banister TRIMP-style heart-rate-reserve calculation, then to a flat
 * duration x per-sport intensity estimate when no HR data exists at all.
 */
export function estimateActivityLoad(
  activity: StravaActivity,
  hrProfile: AthleteHrProfile = {}
): number {
  if (typeof activity.suffer_score === "number" && activity.suffer_score > 0) {
    return activity.suffer_score;
  }

  const durationMin = activity.moving_time / 60;
  const { restingHr, maxHr } = hrProfile;

  if (activity.average_heartrate && restingHr && maxHr && maxHr > restingHr) {
    const hrReserveFraction = Math.min(
      1,
      Math.max(0, (activity.average_heartrate - restingHr) / (maxHr - restingHr))
    );
    // Banister TRIMP: duration * HRr * 0.64 * e^(1.92 * HRr) (male exponential weighting constant; used here as a
    // reasonable default absent sex data).
    const weighting = 0.64 * Math.exp(1.92 * hrReserveFraction);
    return durationMin * hrReserveFraction * weighting;
  }

  const intensity = DEFAULT_TYPE_INTENSITY[activity.type] ?? DEFAULT_INTENSITY_FALLBACK;
  return durationMin * intensity;
}

export interface DailyLoadPoint {
  date: string;
  load: number;
  ctl: number;
  atl: number;
  tsb: number;
}

export type RiskBand = "low" | "sweet-spot" | "caution" | "high-risk";
export type FormBand = "fresh" | "neutral" | "fatigued" | "overreaching";

export interface LoadSummary {
  series: DailyLoadPoint[];
  ctl: number;
  atl: number;
  tsb: number;
  acwr: number;
  riskBand: RiskBand;
  formBand: FormBand;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Buckets activities into daily load totals, then runs the CTL/ATL EWMA
 * recursion across a continuous trailing window ending today (rest days
 * count as zero load, which is what drives fatigue/fitness decay).
 */
export function buildLoadSeries(
  activities: StravaActivity[],
  hrProfile: AthleteHrProfile = {},
  days = 90
): LoadSummary {
  const loadByDate = new Map<string, number>();
  for (const activity of activities) {
    const key = toDateKey(activity.start_date);
    const load = estimateActivityLoad(activity, hrProfile);
    loadByDate.set(key, (loadByDate.get(key) ?? 0) + load);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const series: DailyLoadPoint[] = [];
  let ctl = 0;
  let atl = 0;

  const ctlAlpha = 1 - Math.exp(-1 / CTL_TIME_CONSTANT);
  const atlAlpha = 1 - Math.exp(-1 / ATL_TIME_CONSTANT);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const load = loadByDate.get(key) ?? 0;

    const tsb = ctl - atl; // form heading into today, before today's session is applied
    ctl = ctl + (load - ctl) * ctlAlpha;
    atl = atl + (load - atl) * atlAlpha;

    series.push({ date: key, load, ctl, atl, tsb });
  }

  const last7 = series.slice(-7).reduce((sum, p) => sum + p.load, 0) / 7;
  const last28 = series.slice(-28).reduce((sum, p) => sum + p.load, 0) / 28;
  const acwr = last28 > 0 ? last7 / last28 : 0;

  const latest = series[series.length - 1];

  return {
    series,
    ctl: latest.ctl,
    atl: latest.atl,
    tsb: latest.tsb,
    acwr,
    riskBand: classifyRisk(acwr),
    formBand: classifyForm(latest.tsb),
  };
}

/** Acute:chronic workload ratio banding, per Gabbett's "sweet spot" model (0.8-1.3 = safest injury-risk zone). */
export function classifyRisk(acwr: number): RiskBand {
  if (acwr <= 0) return "low";
  if (acwr < 0.8) return "low";
  if (acwr <= 1.3) return "sweet-spot";
  if (acwr <= 1.5) return "caution";
  return "high-risk";
}

/** Training Stress Balance banding, per the Performance Management Chart convention. */
export function classifyForm(tsb: number): FormBand {
  if (tsb > 5) return "fresh";
  if (tsb >= -10) return "neutral";
  if (tsb >= -30) return "fatigued";
  return "overreaching";
}
