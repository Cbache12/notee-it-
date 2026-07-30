import { ensureFreshSession, listActivities } from "./strava";
import type { StravaSession } from "./session";

const LOOKBACK_DAYS = 28;

/** Average weekly training hours over the last 4 weeks, used to size the training plan. */
export async function buildWeeklyHours(
  session: StravaSession
): Promise<{ currentWeeklyHours: number; refreshedStravaCookie: string | null }> {
  const { session: fresh, refreshedCookie } = await ensureFreshSession(session);
  const after = Math.floor((Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000) / 1000);
  const activities = await listActivities(fresh.accessToken, { after, perPage: 100 });
  const hours = activities.reduce((sum, a) => sum + a.moving_time / 3600, 0);
  return {
    currentWeeklyHours: Math.max(1, hours / (LOOKBACK_DAYS / 7)),
    refreshedStravaCookie: refreshedCookie,
  };
}
