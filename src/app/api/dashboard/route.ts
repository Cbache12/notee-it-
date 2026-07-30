import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session-server";
import { SESSION_COOKIE } from "@/lib/session";
import {
  ensureFreshSession,
  getAthlete,
  getAthleteZones,
  listActivities,
  StravaActivity,
  StravaZones,
} from "@/lib/strava";
import { AthleteHrProfile, buildLoadSeries } from "@/lib/training-load";
import { generateTrainingPlan, recommendNextWorkout } from "@/lib/coach";

const PLAN_WEEKS = 12;
const DEFAULT_RESTING_HR = 60;

function deriveHrProfile(zones: StravaZones, activities: StravaActivity[]): AthleteHrProfile {
  const zoneBounds = zones.heart_rate?.zones ?? [];
  let maxHr: number | undefined;
  if (zoneBounds.length > 0) {
    const topZone = zoneBounds[zoneBounds.length - 1];
    maxHr = topZone.max > 0 ? topZone.max : topZone.min + 10;
  }
  const observedMax = activities.reduce((max, a) => Math.max(max, a.max_heartrate ?? 0), 0);
  if (observedMax > (maxHr ?? 0)) maxHr = observedMax;

  const restingHr = Number(process.env.ATHLETE_RESTING_HR) || DEFAULT_RESTING_HR;
  return {
    restingHr,
    maxHr: maxHr && maxHr > restingHr ? maxHr : undefined,
  };
}

export async function GET() {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  try {
    const { session: freshSession, refreshedCookie } = await ensureFreshSession(session);
    const token = freshSession.accessToken;

    const ninetyDaysAgo = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;
    const [athlete, zones, activities] = await Promise.all([
      getAthlete(token),
      getAthleteZones(token),
      listActivities(token, { after: ninetyDaysAgo, perPage: 200 }),
    ]);

    const sortedActivities = [...activities].sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    const hrProfile = deriveHrProfile(zones, activities);
    const summary = buildLoadSeries(activities, hrProfile, 90);
    const recommendation = recommendNextWorkout(summary, sortedActivities);

    const twentyEightDaysAgo = Date.now() - 28 * 24 * 60 * 60 * 1000;
    const recentHours = activities
      .filter((a) => new Date(a.start_date).getTime() >= twentyEightDaysAgo)
      .reduce((sum, a) => sum + a.moving_time / 3600, 0);
    const currentWeeklyHours = Math.max(1, recentHours / 4);

    const plan = generateTrainingPlan({ totalWeeks: PLAN_WEEKS, currentWeeklyHours });

    const body = {
      athlete: {
        name: `${athlete.firstname} ${athlete.lastname}`.trim(),
        avatar: athlete.profile_medium,
      },
      summary,
      recommendation,
      plan,
      activities: sortedActivities.slice(0, 10),
    };

    const response = NextResponse.json(body);
    if (refreshedCookie) {
      response.cookies.set(SESSION_COOKIE, refreshedCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
    }
    return response;
  } catch (err) {
    console.error("Failed to build dashboard", err);
    return NextResponse.json({ error: "dashboard_failed" }, { status: 502 });
  }
}
