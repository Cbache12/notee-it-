import { z } from "zod";

export type PhotoMode = "label" | "meal";

const visionResultSchema = z.object({
  name: z.string().min(1).max(200),
  servingSize: z.number().positive(),
  servingUnit: z.string().min(1).max(20),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  note: z.string().max(500).optional(),
});

export type VisionNutritionResult = z.infer<typeof visionResultSchema>;

const PROMPTS: Record<PhotoMode, string> = {
  label:
    "This photo shows a nutrition facts label from packaged food. Read the printed " +
    "values exactly as shown for ONE serving: the serving size (with its unit, e.g. " +
    '"30 g" or "1 cup"), calories, protein (g), carbs (g), and fat (g). If a value ' +
    "isn't legible, use 0. Also read the product name from the packaging if visible, " +
    'otherwise use "Scanned food". Respond with ONLY a single JSON object, no other ' +
    "text, no markdown fences, matching exactly this shape: " +
    '{"name": string, "servingSize": number, "servingUnit": string, "calories": number, ' +
    '"proteinG": number, "carbsG": number, "fatG": number}',
  meal:
    "This photo shows a meal or plate of food, not a label. Identify what the food is " +
    "and estimate its nutrition for the portion shown: calories, protein (g), carbs (g), " +
    "and fat (g). This is necessarily an estimate. Use servingSize 1 and servingUnit " +
    '"plate" to represent the whole portion shown. Respond with ONLY a single JSON ' +
    "object, no other text, no markdown fences, matching exactly this shape: " +
    '{"name": string, "servingSize": number, "servingUnit": string, "calories": number, ' +
    '"proteinG": number, "carbsG": number, "fatG": number, "note": string} where "note" ' +
    "briefly flags this as an estimate and any major assumptions (e.g. portion size).",
};

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model response did not contain JSON");
  }
  return JSON.parse(text.slice(start, end + 1));
}

/** Parses and validates a model's raw text response into nutrition data. */
export function parseVisionResponse(text: string): VisionNutritionResult {
  const parsed = visionResultSchema.safeParse(extractJson(text));
  if (!parsed.success) {
    throw new Error(`Model response didn't match the expected shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function analyzeFoodPhoto(params: {
  base64Image: string;
  mediaType: string;
  mode: PhotoMode;
}): Promise<VisionNutritionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: params.mediaType, data: params.base64Image },
            },
            { type: "text", text: PROMPTS[params.mode] },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API request failed: ${res.status} ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Model returned no text content");

  return parseVisionResponse(text);
}
