import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/google-calendar";
import { GOOGLE_SESSION_COOKIE, GoogleSession, encryptGoogleSession } from "@/lib/google-session";

function redirectUriFor(request: NextRequest): string {
  return process.env.GOOGLE_REDIRECT_URI ?? `${request.nextUrl.origin}/api/google/callback`;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(`${origin}/?googleError=${encodeURIComponent(error)}`);
  }

  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/?googleError=missing_code`);
  }

  try {
    const token = await exchangeGoogleCode(code, redirectUriFor(request));
    if (!token.refresh_token) {
      throw new Error(
        "Google did not return a refresh token. Revoke access at myaccount.google.com/permissions and reconnect."
      );
    }
    const session: GoogleSession = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + token.expires_in,
    };

    const response = NextResponse.redirect(`${origin}/`);
    response.cookies.set(GOOGLE_SESSION_COOKIE, encryptGoogleSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    return response;
  } catch (err) {
    console.error("Google OAuth callback failed", err);
    return NextResponse.redirect(`${origin}/?googleError=oauth_failed`);
  }
}
