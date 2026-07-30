import { cookies } from "next/headers";
import { GOOGLE_SESSION_COOKIE, GoogleSession, decryptGoogleSession } from "./google-session";

export function getGoogleSessionFromCookies(): GoogleSession | null {
  const raw = cookies().get(GOOGLE_SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decryptGoogleSession(raw);
}
