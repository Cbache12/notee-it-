import { decryptJson, encryptJson } from "./crypto-cookie";

export interface StravaSession {
  athleteId: number;
  athleteName: string;
  athleteAvatar: string | null;
  accessToken: string;
  refreshToken: string;
  /** Unix seconds when accessToken expires. */
  expiresAt: number;
}

export const SESSION_COOKIE = "coach_session";

export function encryptSession(session: StravaSession): string {
  return encryptJson(session);
}

export function decryptSession(value: string): StravaSession | null {
  return decryptJson<StravaSession>(value);
}
