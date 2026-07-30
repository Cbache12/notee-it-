import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/strava";
import { SESSION_COOKIE, encryptSession, StravaSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`);
  }

  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  try {
    const token = await exchangeCodeForToken(code);
    if (!token.athlete) {
      throw new Error("Strava token response did not include athlete info");
    }
    const session: StravaSession = {
      athleteId: token.athlete.id,
      athleteName: `${token.athlete.firstname} ${token.athlete.lastname}`.trim(),
      athleteAvatar: token.athlete.profile_medium,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_at,
    };

    const response = NextResponse.redirect(`${origin}/`);
    response.cookies.set(SESSION_COOKIE, encryptSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    return response;
  } catch (err) {
    console.error("Strava OAuth callback failed", err);
    return NextResponse.redirect(`${origin}/?error=oauth_failed`);
  }
}
