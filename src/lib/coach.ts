import type { StravaActivity } from "./strava";
import { estimateActivityLoad, LoadSummary } from "./training-load";

export type WorkoutType =
  | "rest"
  | "recovery"
  | "endurance"
  | "tempo"
  | "intervals"
  | "long"
  | "strength";

export interface WorkoutRecommendation {
  type: WorkoutType;
  title: string;
  rationale: string;
  durationMin: number;
  intensity: string;
}

function isHardSessionTitle(title: string): boolean {
  return /interval|tempo|threshold|vo2|race|long run|hard/i.test(title);
}

/**
 * Deterministic rule engine for "what should I do today". Prioritizes safety
 * (rest/recovery) when load risk or fatigue is elevated, otherwise defers to
 * whatever hard session is already on today's calendar, and otherwise pushes
 * for high-output sessions (intervals/tempo) when the athlete is fresh.
 */
export function recommendNextWorkout(
  summary: LoadSummary,
  recentActivities: StravaActivity[],
  todaysCalendarTitles: string[] = []
): WorkoutRecommendation {
  const { riskBand, formBand, ctl, tsb, acwr } = summary;

  if (riskBand === "high-risk" || formBand === "overreaching") {
    return {
      type: "rest",
      title: "Full rest day",
      rationale: `ACWR is ${acwr.toFixed(2)} and TSB is ${tsb.toFixed(0)} — both signal a high overreaching/injury risk. Take a complete rest day before the next session.`,
      durationMin: 0,
      intensity: "none",
    };
  }

  const lastActivity = recentActivities[0];
  const lastWasHard = lastActivity
    ? estimateActivityLoad(lastActivity) > Math.max(ctl, 1) * 1.3
    : false;

  if (riskBand === "caution" || formBand === "fatigued" || lastWasHard) {
    return {
      type: "recovery",
      title: "Easy recovery session",
      rationale:
        "Recent load is elevated relative to your baseline fitness. Keep today conversational so fatigue clears before your next hard effort.",
      durationMin: 30,
      intensity: "Zone 1-2, easy conversational pace",
    };
  }

  const scheduledHardTitle = todaysCalendarTitles.find(isHardSessionTitle);
  if (scheduledHardTitle) {
    return {
      type: "intervals",
      title: `Stick with today's plan: ${scheduledHardTitle}`,
      rationale:
        "You already have a hard session on today's calendar — load and form allow it, so no need to add anything on top of it.",
      durationMin: 0,
      intensity: "as scheduled",
    };
  }

  if (formBand === "fresh" && (riskBand === "low" || riskBand === "sweet-spot")) {
    const recentlyDidIntervals = recentActivities
      .slice(0, 7)
      .some((a) => /interval|vo2|track/i.test(a.name));

    if (!recentlyDidIntervals) {
      return {
        type: "intervals",
        title: "High-intensity intervals",
        rationale: `You're fresh (TSB ${tsb.toFixed(0)}) and load is in a safe range (ACWR ${acwr.toFixed(2)}) — a good day to push output with a hard interval session.`,
        durationMin: 60,
        intensity: "Zone 4-5 intervals, e.g. 6x3min hard / 3min easy",
      };
    }

    return {
      type: "tempo",
      title: "Tempo effort",
      rationale:
        "You're fresh but already did intervals recently — build sustained-effort fitness with tempo instead of stacking more high intensity.",
      durationMin: 50,
      intensity: "Zone 3-4 sustained tempo",
    };
  }

  if (ctl < 20 && riskBand === "low") {
    return {
      type: "endurance",
      title: "Aerobic base builder",
      rationale:
        "Fitness (CTL) is still low — prioritize easy aerobic volume to build a base before adding intensity.",
      durationMin: 45,
      intensity: "Zone 2 easy aerobic",
    };
  }

  return {
    type: "endurance",
    title: "Steady endurance session",
    rationale: "Load and form are balanced — a moderate aerobic session maintains fitness without adding risk.",
    durationMin: 50,
    intensity: "Zone 2-3 steady aerobic",
  };
}

// --- Structured multi-week training plan generator ---

export type Phase = "base" | "build" | "peak" | "taper";

export interface PlannedSession {
  dayOffset: number; // 0 = Monday .. 6 = Sunday
  /** ISO date (YYYY-MM-DD) this session falls on. */
  date: string;
  type: WorkoutType;
  title: string;
  durationMin: number;
}

export interface PlanWeek {
  weekNumber: number;
  phase: Phase;
  targetHours: number;
  isRecoveryWeek: boolean;
  /** ISO date (YYYY-MM-DD) of the Monday this week starts on. */
  startDate: string;
  sessions: PlannedSession[];
}

export interface TrainingPlan {
  totalWeeks: number;
  weeks: PlanWeek[];
}

export interface PlanInput {
  totalWeeks: number;
  /** Baseline weekly training volume, in hours, to build the plan around (e.g. recent average). */
  currentWeeklyHours: number;
  /** ISO date (YYYY-MM-DD) for the Monday week 1 starts on. Defaults to the most recent Monday. */
  startDate?: string;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mostRecentMonday(from: Date): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function titleFor(type: WorkoutType): string {
  switch (type) {
    case "rest":
      return "Rest day";
    case "recovery":
      return "Recovery spin/jog";
    case "endurance":
      return "Easy endurance";
    case "tempo":
      return "Tempo effort";
    case "intervals":
      return "High-intensity intervals";
    case "long":
      return "Long session";
    case "strength":
      return "Strength & mobility";
  }
}

interface SessionTemplate {
  dayOffset: number;
  type: WorkoutType;
  /** Fraction of the week's total minutes this session takes; 0 for rest days. */
  weight: number;
}

const PHASE_TEMPLATES: Record<Phase, SessionTemplate[]> = {
  base: [
    { dayOffset: 0, type: "rest", weight: 0 },
    { dayOffset: 1, type: "endurance", weight: 0.2 },
    { dayOffset: 2, type: "endurance", weight: 0.15 },
    { dayOffset: 3, type: "strength", weight: 0.1 },
    { dayOffset: 4, type: "endurance", weight: 0.15 },
    { dayOffset: 5, type: "long", weight: 0.3 },
    { dayOffset: 6, type: "recovery", weight: 0.1 },
  ],
  build: [
    { dayOffset: 0, type: "rest", weight: 0 },
    { dayOffset: 1, type: "intervals", weight: 0.18 },
    { dayOffset: 2, type: "recovery", weight: 0.1 },
    { dayOffset: 3, type: "tempo", weight: 0.17 },
    { dayOffset: 4, type: "endurance", weight: 0.15 },
    { dayOffset: 5, type: "long", weight: 0.3 },
    { dayOffset: 6, type: "recovery", weight: 0.1 },
  ],
  peak: [
    { dayOffset: 0, type: "rest", weight: 0 },
    { dayOffset: 1, type: "intervals", weight: 0.2 },
    { dayOffset: 2, type: "rest", weight: 0 },
    { dayOffset: 3, type: "tempo", weight: 0.2 },
    { dayOffset: 4, type: "recovery", weight: 0.1 },
    { dayOffset: 5, type: "long", weight: 0.35 },
    { dayOffset: 6, type: "recovery", weight: 0.15 },
  ],
  taper: [
    { dayOffset: 0, type: "rest", weight: 0 },
    { dayOffset: 1, type: "endurance", weight: 0.25 },
    { dayOffset: 2, type: "rest", weight: 0 },
    { dayOffset: 3, type: "tempo", weight: 0.25 },
    { dayOffset: 4, type: "rest", weight: 0 },
    { dayOffset: 5, type: "recovery", weight: 0.2 },
    { dayOffset: 6, type: "long", weight: 0.3 },
  ],
};

function sessionsFor(phase: Phase, weeklyHours: number, weekStart: Date): PlannedSession[] {
  const totalMinutes = weeklyHours * 60;
  return PHASE_TEMPLATES[phase].map((t) => ({
    dayOffset: t.dayOffset,
    date: toIsoDate(addDays(weekStart, t.dayOffset)),
    type: t.type,
    title: titleFor(t.type),
    durationMin: t.weight > 0 ? Math.round(totalMinutes * t.weight) : 0,
  }));
}

function splitPhases(totalWeeks: number): {
  baseWeeks: number;
  buildWeeks: number;
  peakWeeks: number;
  taperWeeks: number;
} {
  let baseWeeks = Math.max(1, Math.round(totalWeeks * 0.4));
  let buildWeeks = Math.max(1, Math.round(totalWeeks * 0.35));
  const taperWeeks = Math.max(1, Math.round(totalWeeks * 0.1));
  let peakWeeks = totalWeeks - baseWeeks - buildWeeks - taperWeeks;

  if (peakWeeks < 1) {
    buildWeeks = Math.max(1, buildWeeks - (1 - peakWeeks));
    peakWeeks = totalWeeks - baseWeeks - buildWeeks - taperWeeks;
  }
  if (peakWeeks < 1) {
    baseWeeks = Math.max(1, baseWeeks - (1 - peakWeeks));
    peakWeeks = totalWeeks - baseWeeks - buildWeeks - taperWeeks;
  }
  peakWeeks = Math.max(1, peakWeeks);

  return { baseWeeks, buildWeeks, peakWeeks, taperWeeks };
}

function phaseFor(week: number, baseWeeks: number, buildWeeks: number, peakWeeks: number): Phase {
  if (week <= baseWeeks) return "base";
  if (week <= baseWeeks + buildWeeks) return "build";
  if (week <= baseWeeks + buildWeeks + peakWeeks) return "peak";
  return "taper";
}

/**
 * Generates a periodized base -> build -> peak -> taper plan (roughly a
 * 40/35/15/10 split), progressively overloading weekly volume with a cutback
 * every 4th week, then linearly tapering volume before the final week.
 */
export function generateTrainingPlan(input: PlanInput): TrainingPlan {
  const totalWeeks = Math.max(4, Math.round(input.totalWeeks));
  const { baseWeeks, buildWeeks, peakWeeks, taperWeeks } = splitPhases(totalWeeks);
  const taperStartWeek = totalWeeks - taperWeeks + 1;
  const planStart = input.startDate
    ? new Date(`${input.startDate}T00:00:00Z`)
    : mostRecentMonday(new Date());

  const weeks: PlanWeek[] = [];
  let volume = input.currentWeeklyHours;
  let preTaperVolume = volume;

  for (let w = 1; w <= totalWeeks; w++) {
    const phase = phaseFor(w, baseWeeks, buildWeeks, peakWeeks);
    const isRecoveryWeek = phase !== "taper" && w % 4 === 0;
    const weekStart = addDays(planStart, (w - 1) * 7);

    if (phase === "taper") {
      const weekIntoTaper = w - taperStartWeek + 1;
      volume = preTaperVolume * (1 - 0.5 * (weekIntoTaper / taperWeeks));
    } else if (isRecoveryWeek) {
      volume = volume * 0.75;
    } else if (w > 1) {
      volume = volume * (phase === "base" ? 1.06 : phase === "build" ? 1.04 : 1.0);
    }

    if (phase !== "taper") preTaperVolume = volume;

    weeks.push({
      weekNumber: w,
      phase,
      targetHours: Math.round(volume * 10) / 10,
      isRecoveryWeek,
      startDate: toIsoDate(weekStart),
      sessions: sessionsFor(phase, volume, weekStart),
    });
  }

  return { totalWeeks, weeks };
}
