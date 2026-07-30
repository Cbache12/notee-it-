import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthorizeUrl } from "@/lib/google-calendar";

function redirectUriFor(request: NextRequest): string {
  return process.env.GOOGLE_REDIRECT_URI ?? `${request.nextUrl.origin}/api/google/callback`;
}

export async function GET(request: NextRequest) {
  const url = buildGoogleAuthorizeUrl(redirectUriFor(request));
  return NextResponse.redirect(url);
}
