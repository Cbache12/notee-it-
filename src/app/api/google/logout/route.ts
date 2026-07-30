import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_SESSION_COOKIE } from "@/lib/google-session";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(`${request.nextUrl.origin}/`);
  response.cookies.delete(GOOGLE_SESSION_COOKIE);
  return response;
}
