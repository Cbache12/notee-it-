import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const recipe = await prisma.recipe.findUnique({ where: { id: params.id } });
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [logCount, usedAsIngredient] = await Promise.all([
    prisma.logEntry.count({ where: { foodId: recipe.foodId } }),
    prisma.recipeIngredient.count({
      where: { foodId: recipe.foodId, recipeId: { not: recipe.id } },
    }),
  ]);
  if (logCount > 0 || usedAsIngredient > 0) {
    return NextResponse.json(
      { error: "This recipe is used in a log entry or another recipe and can't be deleted" },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.recipe.delete({ where: { id: params.id } }),
    prisma.food.delete({ where: { id: recipe.foodId } }),
  ]);
  return NextResponse.json({ ok: true });
}
