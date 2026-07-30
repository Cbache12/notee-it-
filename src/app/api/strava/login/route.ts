import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/strava";

function redirectUriFor(request: NextRequest): string {
  return process.env.STRAVA_REDIRECT_URI ?? `${request.nextUrl.origin}/api/strava/callback`;
}

export async function GET(request: NextRequest) {
  const url = buildAuthorizeUrl(redirectUriFor(request));
  return NextResponse.redirect(url);
}
