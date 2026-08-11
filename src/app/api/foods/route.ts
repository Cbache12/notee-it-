import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { foodInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const foods = await prisma.food.findMany({
    where: { source: "CUSTOM" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(foods);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = foodInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const food = await prisma.food.create({
    data: { ...parsed.data, source: "CUSTOM" },
  });
  return NextResponse.json(food, { status: 201 });
}
