import { GoogleSession, encryptGoogleSession } from "./google-session";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to your environment (see .env.example).`);
  }
  return value;
}

export function buildGoogleAuthorizeUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  if (state) params.set("state", state);
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function ensureFreshGoogleSession(
  session: GoogleSession
): Promise<{ session: GoogleSession; refreshedCookie: string | null }> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (session.expiresAt - nowSeconds > 60) {
    return { session, refreshedCookie: null };
  }
  const refreshed = await refreshGoogleAccessToken(session.refreshToken);
  const nextSession: GoogleSession = {
    accessToken: refreshed.access_token,
    // Google only returns a new refresh_token occasionally; keep the old one otherwise.
    refreshToken: refreshed.refresh_token ?? session.refreshToken,
    expiresAt: nowSeconds + refreshed.expires_in,
  };
  return { session: nextSession, refreshedCookie: encryptGoogleSession(nextSession) };
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export async function listUpcomingEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });
  const res = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Google Calendar list failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.items ?? [];
}

const COACH_KEY_PROPERTY = "coachPlanKey";

export interface PlanCalendarSession {
  /** Stable identifier for this plan slot, e.g. "w1d1", used to update rather than duplicate events. */
  key: string;
  date: string; // YYYY-MM-DD
  title: string;
  durationMin: number;
  description: string;
}

/**
 * Creates or updates a calendar event for one planned session, keyed by a
 * private extended property so re-syncing the plan updates events in place
 * instead of duplicating them. Rest days (durationMin 0) are skipped.
 *
 * Sessions are placed at 7am in whatever timezone the server runs in (no
 * per-user timezone setting yet) — a known simplification.
 */
export async function upsertPlanSessionEvent(
  accessToken: string,
  session: PlanCalendarSession
): Promise<void> {
  if (session.durationMin <= 0) return;

  const findRes = await fetch(
    `${CALENDAR_API_BASE}/calendars/primary/events?privateExtendedProperty=${COACH_KEY_PROPERTY}=${session.key}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!findRes.ok) {
    throw new Error(`Google Calendar lookup failed: ${findRes.status} ${await findRes.text()}`);
  }
  const found = await findRes.json();
  const existingId: string | undefined = found.items?.[0]?.id;

  const startTime = new Date(`${session.date}T07:00:00`);
  const endTime = new Date(startTime.getTime() + session.durationMin * 60 * 1000);

  const body = {
    summary: `Coach: ${session.title}`,
    description: session.description,
    start: { dateTime: startTime.toISOString() },
    end: { dateTime: endTime.toISOString() },
    extendedProperties: { private: { [COACH_KEY_PROPERTY]: session.key } },
  };

  const url = existingId
    ? `${CALENDAR_API_BASE}/calendars/primary/events/${existingId}`
    : `${CALENDAR_API_BASE}/calendars/primary/events`;

  const res = await fetch(url, {
    method: existingId ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Google Calendar upsert failed: ${res.status} ${await res.text()}`);
  }
}
