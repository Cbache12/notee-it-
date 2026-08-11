import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const food = await prisma.food.findUnique({ where: { id: params.id } });
  if (!food) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(food);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.food.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json(
      { error: "This food is used in a log entry or recipe and can't be deleted" },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
