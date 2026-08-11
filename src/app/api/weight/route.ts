import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { weightEntrySchema } from "@/lib/validation";
import { parseDateOnly } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await prisma.weightEntry.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = weightEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { date, weightKg } = parsed.data;
  const parsedDate = parseDateOnly(date);

  const entry = await prisma.weightEntry.upsert({
    where: { date: parsedDate },
    create: { date: parsedDate, weightKg },
    update: { weightKg },
  });
  return NextResponse.json(entry, { status: 201 });
}
