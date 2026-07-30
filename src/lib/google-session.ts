import { decryptJson, encryptJson } from "./crypto-cookie";

export interface GoogleSession {
  accessToken: string;
  refreshToken: string;
  /** Unix seconds when accessToken expires. */
  expiresAt: number;
}

export const GOOGLE_SESSION_COOKIE = "coach_google_session";

export function encryptGoogleSession(session: GoogleSession): string {
  return encryptJson(session);
}

export function decryptGoogleSession(value: string): GoogleSession | null {
  return decryptJson<GoogleSession>(value);
}
