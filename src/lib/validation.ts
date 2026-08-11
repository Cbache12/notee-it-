import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

export const foodInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  brand: z.string().trim().max(200).optional(),
  barcode: z.string().trim().max(64).optional(),
  servingSize: z.number().positive(),
  servingUnit: z.string().trim().min(1).max(20),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  fiberG: z.number().min(0).optional(),
  sugarG: z.number().min(0).optional(),
  sodiumMg: z.number().min(0).optional(),
});

export const logEntrySchema = z.object({
  foodId: z.string().min(1),
  meal: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  servings: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export const weightEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  weightKg: z.number().positive().max(500),
});

export const goalSchema = z.object({
  calories: z.number().int().min(800).max(10000),
  proteinG: z.number().int().min(0).max(1000),
  carbsG: z.number().int().min(0).max(2000),
  fatG: z.number().int().min(0).max(1000),
  startWeightKg: z.number().positive().max(500).optional(),
  goalWeightKg: z.number().positive().max(500).optional(),
  planWeeks: z.number().int().min(1).max(52).optional(),
});

export const photoAnalyzeSchema = z.object({
  base64Image: z.string().min(1),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  mode: z.enum(["label", "meal"]),
});

export const recipeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  servings: z.number().positive(),
  ingredients: z
    .array(
      z.object({
        foodId: z.string().min(1),
        servings: z.number().positive(),
      })
    )
    .min(1),
});
