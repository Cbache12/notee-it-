import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { savedMealSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const savedMeals = await prisma.savedMeal.findMany({
    include: { items: { include: { food: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(savedMeals);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = savedMealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, items } = parsed.data;

  const foods = await prisma.food.findMany({
    where: { id: { in: items.map((i) => i.foodId) } },
  });
  if (foods.length !== new Set(items.map((i) => i.foodId)).size) {
    return NextResponse.json({ error: "One or more foods were not found" }, { status: 400 });
  }

  const savedMeal = await prisma.savedMeal.create({
    data: {
      name,
      items: { create: items.map((i) => ({ foodId: i.foodId, servings: i.servings })) },
    },
    include: { items: { include: { food: true } } },
  });
  return NextResponse.json(savedMeal, { status: 201 });
}
