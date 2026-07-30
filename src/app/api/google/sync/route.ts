import { NextResponse } from "next/server";
import { getGoogleSessionFromCookies } from "@/lib/google-session-server";
import { GOOGLE_SESSION_COOKIE } from "@/lib/google-session";
import { ensureFreshGoogleSession, upsertPlanSessionEvent } from "@/lib/google-calendar";
import { getGoalFromCookies } from "@/lib/goal-server";
import { getSessionFromCookies } from "@/lib/session-server";
import { SESSION_COOKIE } from "@/lib/session";
import { generateTrainingPlan } from "@/lib/coach";
import { weeksUntilRace } from "@/lib/goal";
import { buildWeeklyHours } from "@/lib/plan-inputs";

const DEFAULT_PLAN_WEEKS = 12;

export async function POST() {
  const googleSession = getGoogleSessionFromCookies();
  if (!googleSession) {
    return NextResponse.json({ error: "google_not_authenticated" }, { status: 401 });
  }
  const stravaSession = getSessionFromCookies();
  if (!stravaSession) {
    return NextResponse.json({ error: "strava_not_authenticated" }, { status: 401 });
  }

  try {
    const { session: freshGoogle, refreshedCookie } = await ensureFreshGoogleSession(googleSession);
    const goal = getGoalFromCookies();
    const totalWeeks = weeksUntilRace(goal) ?? DEFAULT_PLAN_WEEKS;
    const { currentWeeklyHours, refreshedStravaCookie } = await buildWeeklyHours(stravaSession);
    const plan = generateTrainingPlan({ totalWeeks, currentWeeklyHours });

    let synced = 0;
    for (const week of plan.weeks) {
      for (const session of week.sessions) {
        if (session.durationMin <= 0) continue;
        await upsertPlanSessionEvent(freshGoogle.accessToken, {
          key: `w${week.weekNumber}d${session.dayOffset}`,
          date: session.date,
          title: session.title,
          durationMin: session.durationMin,
          description: `${week.phase} phase, week ${week.weekNumber} of ${plan.totalWeeks}${
            goal ? ` — building toward ${goal.raceName}` : ""
          }`,
        });
        synced++;
      }
    }

    const response = NextResponse.json({ synced });
    if (refreshedCookie) {
      response.cookies.set(GOOGLE_SESSION_COOKIE, refreshedCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
    }
    if (refreshedStravaCookie) {
      response.cookies.set(SESSION_COOKIE, refreshedStravaCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
    }
    return response;
  } catch (err) {
    console.error("Google Calendar sync failed", err);
    return NextResponse.json({ error: "sync_failed" }, { status: 502 });
  }
}
