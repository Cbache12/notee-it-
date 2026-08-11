export type Macros = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type FoodNutrition = Macros & {
  fiberG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
};

/** Scales a food's per-serving nutrition by the number of servings logged. */
export function scaleNutrition<T extends FoodNutrition>(
  food: T,
  servings: number
): FoodNutrition {
  return {
    calories: food.calories * servings,
    proteinG: food.proteinG * servings,
    carbsG: food.carbsG * servings,
    fatG: food.fatG * servings,
    fiberG: food.fiberG != null ? food.fiberG * servings : null,
    sugarG: food.sugarG != null ? food.sugarG * servings : null,
    sodiumMg: food.sodiumMg != null ? food.sodiumMg * servings : null,
  };
}

export function sumMacros(entries: Macros[]): Macros {
  return entries.reduce(
    (total, entry) => ({
      calories: total.calories + entry.calories,
      proteinG: total.proteinG + entry.proteinG,
      carbsG: total.carbsG + entry.carbsG,
      fatG: total.fatG + entry.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

/** Derives calories from macro grams using the standard 4/4/9 kcal-per-gram atwater factors. */
export function caloriesFromMacros(proteinG: number, carbsG: number, fatG: number): number {
  return proteinG * 4 + carbsG * 4 + fatG * 9;
}

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Mifflin-St Jeor basal metabolic rate estimate, in kcal/day. */
export function estimateBmr(params: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/** Total daily energy expenditure: BMR scaled by activity level. */
export function estimateTdee(
  bmrParams: Parameters<typeof estimateBmr>[0],
  activityLevel: ActivityLevel
): number {
  return estimateBmr(bmrParams) * ACTIVITY_MULTIPLIERS[activityLevel];
}

/**
 * Suggests calorie + macro targets for a given TDEE and weekly weight-change
 * goal (kg/week, negative to lose, positive to gain). 1kg of body fat is
 * approximated at 7700 kcal. Protein is prioritized at 2.0 g/kg of body
 * weight, fat at a minimum of 25% of calories, and the remainder to carbs.
 */
export function suggestGoal(params: {
  tdee: number;
  weightKg: number;
  weeklyChangeKg: number;
}): Macros {
  const { tdee, weightKg, weeklyChangeKg } = params;
  const dailyDelta = (weeklyChangeKg * 7700) / 7;
  const calories = Math.max(1200, Math.round(tdee + dailyDelta));

  const proteinG = Math.round(weightKg * 2.0);
  const fatG = Math.round((calories * 0.25) / 9);
  const remaining = calories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remaining / 4));

  return { calories, proteinG, carbsG, fatG };
}
