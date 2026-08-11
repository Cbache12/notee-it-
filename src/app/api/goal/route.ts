import { NextResponse } from "next/server";
import { goalSchema } from "@/lib/validation";
import { getGoal, upsertGoal } from "@/lib/goal-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const goal = await getGoal();
  return NextResponse.json(goal);
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const goal = await upsertGoal(parsed.data);
  return NextResponse.json(goal);
}
