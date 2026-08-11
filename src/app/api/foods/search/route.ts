import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchOffFoods } from "@/lib/open-food-facts";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const local = await prisma.food.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    take: 15,
    orderBy: { createdAt: "desc" },
  });

  let remote: Awaited<ReturnType<typeof searchOffFoods>> = [];
  try {
    remote = await searchOffFoods(q, 15);
  } catch {
    // Open Food Facts being down shouldn't break local search results.
  }

  const localBarcodes = new Set(local.map((f) => f.barcode).filter(Boolean));
  const remoteResults = remote
    .filter((f) => !localBarcodes.has(f.barcode))
    .map((f) => ({ ...f, id: null, source: "OFF" as const }));

  return NextResponse.json([...local, ...remoteResults]);
}
