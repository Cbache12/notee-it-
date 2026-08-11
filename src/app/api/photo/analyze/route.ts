import { NextResponse } from "next/server";
import { photoAnalyzeSchema } from "@/lib/validation";
import { analyzeFoodPhoto } from "@/lib/vision-nutrition";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = photoAnalyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Photo scanning isn't configured. Set ANTHROPIC_API_KEY in your environment to enable it." },
      { status: 501 }
    );
  }

  try {
    const result = await analyzeFoodPhoto(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Photo analysis failed" },
      { status: 502 }
    );
  }
}
