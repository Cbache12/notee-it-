import { decryptJson, encryptJson } from "./crypto-cookie";

export interface GoalSettings {
  raceName: string;
  /** ISO date string, e.g. "2026-08-23". */
  raceDate: string;
}

export const GOAL_COOKIE = "coach_goal";

export function encryptGoal(goal: GoalSettings): string {
  return encryptJson(goal);
}

export function decryptGoal(value: string): GoalSettings | null {
  return decryptJson<GoalSettings>(value);
}

/** Weeks remaining until the race, rounded up, or null if there's no valid goal. */
export function weeksUntilRace(goal: GoalSettings | null, now: Date = new Date()): number | null {
  if (!goal) return null;
  const raceDate = new Date(`${goal.raceDate}T00:00:00Z`);
  if (Number.isNaN(raceDate.getTime())) return null;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diff = raceDate.getTime() - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(1, Math.ceil(diff / msPerWeek));
}
