import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recipeSchema } from "@/lib/validation";
import { scaleNutrition, sumMacros } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    include: { food: true, ingredients: { include: { food: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(recipes);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, servings, ingredients } = parsed.data;

  const foods = await prisma.food.findMany({
    where: { id: { in: ingredients.map((i) => i.foodId) } },
  });
  if (foods.length !== new Set(ingredients.map((i) => i.foodId)).size) {
    return NextResponse.json({ error: "One or more ingredients were not found" }, { status: 400 });
  }
  const foodById = new Map(foods.map((f) => [f.id, f]));

  const scaled = ingredients.map((i) => scaleNutrition(foodById.get(i.foodId)!, i.servings));
  const total = sumMacros(scaled);
  const perServing = {
    calories: total.calories / servings,
    proteinG: total.proteinG / servings,
    carbsG: total.carbsG / servings,
    fatG: total.fatG / servings,
  };

  const recipe = await prisma.$transaction(async (tx) => {
    const food = await tx.food.create({
      data: {
        source: "RECIPE",
        name,
        servingSize: 1,
        servingUnit: "serving",
        ...perServing,
      },
    });
    return tx.recipe.create({
      data: {
        name,
        servings,
        foodId: food.id,
        ingredients: {
          create: ingredients.map((i) => ({ foodId: i.foodId, servings: i.servings })),
        },
      },
      include: { food: true, ingredients: { include: { food: true } } },
    });
  });

  return NextResponse.json(recipe, { status: 201 });
}
