export type PlanWeek = {
  week: number;
  stepsTarget: number;
  treadmill: { minutes: number } | null;
};

const MAX_STEPS = 12000;
const BASE_STEPS = 6000;
const TREADMILL_WEEKS = 3;
const TREADMILL_MINUTES = [15, 20, 30];

/**
 * Generates a weekly activity plan: a daily step target that ramps from
 * BASE_STEPS up to MAX_STEPS over the plan, then holds at MAX_STEPS. The
 * final TREADMILL_WEEKS weeks additionally layer on an incline treadmill
 * walk of increasing duration (15 / 20 / 30 min).
 */
export function generateActivityPlan(weeks: number): PlanWeek[] {
  const rampWeeks = Math.max(1, weeks - TREADMILL_WEEKS);

  const result: PlanWeek[] = [];
  for (let week = 1; week <= weeks; week++) {
    const progress = rampWeeks <= 1 ? 0 : (week - 1) / (rampWeeks - 1);
    const stepsTarget =
      week <= rampWeeks ? Math.round(BASE_STEPS + (MAX_STEPS - BASE_STEPS) * progress) : MAX_STEPS;

    const weeksFromEnd = weeks - week;
    const treadmill =
      weeksFromEnd < TREADMILL_WEEKS
        ? { minutes: TREADMILL_MINUTES[TREADMILL_MINUTES.length - 1 - weeksFromEnd] }
        : null;

    result.push({ week, stepsTarget, treadmill });
  }
  return result;
}

/**
 * Projects body weight for a given week along a straight-line glide path
 * from startWeightKg to goalWeightKg over totalWeeks, reaching goalWeightKg
 * exactly at the end of the plan. Clamped so weeks beyond the plan length
 * don't overshoot the goal.
 */
export function projectedWeightForWeek(params: {
  week: number;
  startWeightKg: number;
  goalWeightKg: number;
  totalWeeks: number;
}): number {
  const { week, startWeightKg, goalWeightKg, totalWeeks } = params;
  if (totalWeeks <= 0) return startWeightKg;
  const progress = Math.min(1, Math.max(0, week) / totalWeeks);
  return startWeightKg + (goalWeightKg - startWeightKg) * progress;
}
