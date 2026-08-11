import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupOffBarcode } from "@/lib/open-food-facts";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const existing = await prisma.food.findFirst({ where: { barcode: params.code } });
  if (existing) return NextResponse.json(existing);

  let off;
  try {
    off = await lookupOffBarcode(params.code);
  } catch {
    return NextResponse.json({ error: "Barcode lookup failed" }, { status: 502 });
  }
  if (!off) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const food = await prisma.food.create({
    data: {
      source: "OFF",
      barcode: off.barcode,
      brand: off.brand,
      name: off.name,
      servingSize: off.servingSize,
      servingUnit: off.servingUnit,
      calories: off.calories,
      proteinG: off.proteinG,
      carbsG: off.carbsG,
      fatG: off.fatG,
      fiberG: off.fiberG,
      sugarG: off.sugarG,
      sodiumMg: off.sodiumMg,
    },
  });
  return NextResponse.json(food);
}
