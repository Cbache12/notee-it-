import { SESSION_COOKIE, StravaSession, encryptSession } from "./session";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_OAUTH_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_OAUTH_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";

export const STRAVA_SCOPES = "read,activity:read_all,profile:read_all";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to your environment (see .env.example).`);
  }
  return value;
}

export function buildAuthorizeUrl(redirectUri: string, state?: string): string {
  const clientId = requireEnv("STRAVA_CLIENT_ID");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPES,
  });
  if (state) params.set("state", state);
  return `${STRAVA_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: {
    id: number;
    firstname: string;
    lastname: string;
    profile_medium: string | null;
  };
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const res = await fetch(STRAVA_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Strava token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(STRAVA_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Returns a session with a valid (non-expired) access token, refreshing it
 * against Strava if needed, along with the cookie header to persist any
 * refresh (or null if the existing token was still valid).
 */
export async function ensureFreshSession(
  session: StravaSession
): Promise<{ session: StravaSession; refreshedCookie: string | null }> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (session.expiresAt - nowSeconds > 60) {
    return { session, refreshedCookie: null };
  }
  const refreshed = await refreshAccessToken(session.refreshToken);
  const nextSession: StravaSession = {
    ...session,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: refreshed.expires_at,
  };
  return { session: nextSession, refreshedCookie: encryptSession(nextSession) };
}

async function stravaFetch<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${STRAVA_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Strava API ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  moving_time: number;
  elapsed_time: number;
  distance: number;
  total_elevation_gain: number;
  average_heartrate?: number;
  max_heartrate?: number;
  suffer_score?: number;
  average_speed?: number;
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile_medium: string | null;
  sex?: string;
  weight?: number;
}

export interface StravaZones {
  heart_rate?: {
    custom_zones: boolean;
    zones: { min: number; max: number }[];
  };
}

export function listActivities(
  accessToken: string,
  opts: { after?: number; perPage?: number } = {}
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    per_page: String(opts.perPage ?? 100),
  });
  if (opts.after) params.set("after", String(opts.after));
  return stravaFetch<StravaActivity[]>(`/athlete/activities?${params.toString()}`, accessToken);
}

export function getAthlete(accessToken: string): Promise<StravaAthlete> {
  return stravaFetch<StravaAthlete>("/athlete", accessToken);
}

export function getAthleteZones(accessToken: string): Promise<StravaZones> {
  return stravaFetch<StravaZones>("/athlete/zones", accessToken);
}

export { SESSION_COOKIE };
