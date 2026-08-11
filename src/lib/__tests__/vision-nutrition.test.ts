import { describe, expect, it } from "vitest";
import { parseVisionResponse } from "@/lib/vision-nutrition";

describe("parseVisionResponse", () => {
  it("parses a well-formed JSON response", () => {
    const text = JSON.stringify({
      name: "Granola Bar",
      servingSize: 40,
      servingUnit: "g",
      calories: 180,
      proteinG: 4,
      carbsG: 28,
      fatG: 6,
    });
    expect(parseVisionResponse(text)).toEqual({
      name: "Granola Bar",
      servingSize: 40,
      servingUnit: "g",
      calories: 180,
      proteinG: 4,
      carbsG: 28,
      fatG: 6,
    });
  });

  it("extracts JSON even when the model wraps it in prose or markdown fences", () => {
    const text =
      'Here you go:\n```json\n{"name": "Chicken Salad", "servingSize": 1, "servingUnit": "plate", ' +
      '"calories": 450, "proteinG": 35, "carbsG": 10, "fatG": 28, "note": "estimate"}\n```';
    const result = parseVisionResponse(text);
    expect(result.name).toBe("Chicken Salad");
    expect(result.note).toBe("estimate");
  });

  it("throws when the response has no JSON object", () => {
    expect(() => parseVisionResponse("Sorry, I can't read that image.")).toThrow(
      "did not contain JSON"
    );
  });

  it("throws when the JSON doesn't match the expected shape", () => {
    expect(() => parseVisionResponse('{"name": "X"}')).toThrow("didn't match the expected shape");
  });
});
