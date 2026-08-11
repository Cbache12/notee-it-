import { describe, expect, it } from "vitest";
import {
  caloriesFromMacros,
  estimateBmr,
  estimateTdee,
  scaleNutrition,
  suggestGoal,
  sumMacros,
} from "@/lib/nutrition";

describe("scaleNutrition", () => {
  it("scales all macro fields by the serving count", () => {
    const food = { calories: 200, proteinG: 10, carbsG: 20, fatG: 5, fiberG: 2, sugarG: 3, sodiumMg: 100 };
    expect(scaleNutrition(food, 2)).toEqual({
      calories: 400,
      proteinG: 20,
      carbsG: 40,
      fatG: 10,
      fiberG: 4,
      sugarG: 6,
      sodiumMg: 200,
    });
  });

  it("leaves optional null fields as null", () => {
    const food = { calories: 100, proteinG: 5, carbsG: 5, fatG: 5, fiberG: null, sugarG: null, sodiumMg: null };
    const scaled = scaleNutrition(food, 3);
    expect(scaled.fiberG).toBeNull();
    expect(scaled.sugarG).toBeNull();
    expect(scaled.sodiumMg).toBeNull();
  });
});

describe("sumMacros", () => {
  it("sums calories and macros across entries", () => {
    const total = sumMacros([
      { calories: 100, proteinG: 10, carbsG: 5, fatG: 2 },
      { calories: 200, proteinG: 5, carbsG: 20, fatG: 8 },
    ]);
    expect(total).toEqual({ calories: 300, proteinG: 15, carbsG: 25, fatG: 10 });
  });

  it("returns zeros for an empty list", () => {
    expect(sumMacros([])).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });
});

describe("caloriesFromMacros", () => {
  it("applies 4/4/9 atwater factors", () => {
    expect(caloriesFromMacros(10, 20, 5)).toBe(10 * 4 + 20 * 4 + 5 * 9);
  });
});

describe("estimateBmr", () => {
  it("adds 5 for male per Mifflin-St Jeor", () => {
    const bmr = estimateBmr({ sex: "male", weightKg: 80, heightCm: 180, age: 30 });
    expect(bmr).toBeCloseTo(10 * 80 + 6.25 * 180 - 5 * 30 + 5);
  });

  it("subtracts 161 for female per Mifflin-St Jeor", () => {
    const bmr = estimateBmr({ sex: "female", weightKg: 65, heightCm: 165, age: 28 });
    expect(bmr).toBeCloseTo(10 * 65 + 6.25 * 165 - 5 * 28 - 161);
  });
});

describe("estimateTdee", () => {
  it("scales BMR by the activity multiplier", () => {
    const params = { sex: "male" as const, weightKg: 80, heightCm: 180, age: 30 };
    const bmr = estimateBmr(params);
    expect(estimateTdee(params, "sedentary")).toBeCloseTo(bmr * 1.2);
    expect(estimateTdee(params, "very_active")).toBeCloseTo(bmr * 1.9);
  });
});

describe("suggestGoal", () => {
  it("reduces calories below TDEE for a weight-loss target", () => {
    const goal = suggestGoal({ tdee: 2500, weightKg: 80, weeklyChangeKg: -0.5 });
    expect(goal.calories).toBeLessThan(2500);
    expect(goal.calories).toBe(Math.round(2500 - (0.5 * 7700) / 7));
  });

  it("never suggests below the 1200 kcal floor", () => {
    const goal = suggestGoal({ tdee: 1400, weightKg: 60, weeklyChangeKg: -1.5 });
    expect(goal.calories).toBe(1200);
  });

  it("sets protein at 2g/kg body weight", () => {
    const goal = suggestGoal({ tdee: 2500, weightKg: 70, weeklyChangeKg: 0 });
    expect(goal.proteinG).toBe(140);
  });

  it("keeps fat at roughly 25% of calories", () => {
    const goal = suggestGoal({ tdee: 2500, weightKg: 70, weeklyChangeKg: 0 });
    const fatCalories = goal.fatG * 9;
    expect(fatCalories / goal.calories).toBeCloseTo(0.25, 1);
  });
});
