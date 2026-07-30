import { cookies } from "next/headers";
import { GOAL_COOKIE, GoalSettings, decryptGoal } from "./goal";

export function getGoalFromCookies(): GoalSettings | null {
  const raw = cookies().get(GOAL_COOKIE)?.value;
  if (!raw) return null;
  return decryptGoal(raw);
}
