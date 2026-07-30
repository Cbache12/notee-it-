import { NextRequest, NextResponse } from "next/server";
import { GOAL_COOKIE, GoalSettings, encryptGoal } from "@/lib/goal";
import { getGoalFromCookies } from "@/lib/goal-server";

export async function GET() {
  return NextResponse.json({ goal: getGoalFromCookies() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const raceName = typeof body?.raceName === "string" ? body.raceName.trim() : "";
  const raceDate = typeof body?.raceDate === "string" ? body.raceDate.trim() : "";

  if (!raceName || !/^\d{4}-\d{2}-\d{2}$/.test(raceDate) || Number.isNaN(Date.parse(raceDate))) {
    return NextResponse.json(
      { error: "raceName and raceDate (YYYY-MM-DD) are required" },
      { status: 400 }
    );
  }

  const goal: GoalSettings = { raceName, raceDate };
  const response = NextResponse.json({ goal });
  response.cookies.set(GOAL_COOKIE, encryptGoal(goal), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ goal: null });
  response.cookies.delete(GOAL_COOKIE);
  return response;
}
