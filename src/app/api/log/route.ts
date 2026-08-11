import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEntrySchema } from "@/lib/validation";
import { parseDateOnly } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const dateStr = new URL(req.url).searchParams.get("date");
  if (!dateStr) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const entries = await prisma.logEntry.findMany({
    where: { date: parseDateOnly(dateStr) },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = logEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { foodId, meal, servings, date } = parsed.data;

  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food) return NextResponse.json({ error: "Food not found" }, { status: 400 });

  const entry = await prisma.logEntry.create({
    data: { foodId, meal, servings, date: parseDateOnly(date) },
    include: { food: true },
  });
  return NextResponse.json(entry, { status: 201 });
}
