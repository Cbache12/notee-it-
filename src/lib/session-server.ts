import { cookies } from "next/headers";
import { SESSION_COOKIE, StravaSession, decryptSession } from "./session";

/** Read-only session lookup, safe to call from server components and route handlers alike. */
export function getSessionFromCookies(): StravaSession | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decryptSession(raw);
}
