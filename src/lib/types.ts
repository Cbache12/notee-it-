export type Food = {
  id: string;
  source: "CUSTOM" | "OFF" | "RECIPE";
  barcode: string | null;
  brand: string | null;
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
};

// A remote Open Food Facts search result not yet cached locally (no id).
export type SearchFood = Omit<Food, "id"> & { id: string | null };

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export type LogEntry = {
  id: string;
  foodId: string;
  food: Food;
  meal: MealType;
  servings: number;
  date: string;
};

export type WeightEntry = {
  id: string;
  date: string;
  weightKg: number;
};

export type Goal = {
  id: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  startWeightKg: number | null;
  goalWeightKg: number | null;
  planWeeks: number;
} | null;

export type Recipe = {
  id: string;
  name: string;
  servings: number;
  foodId: string;
  food: Food;
  ingredients: { id: string; foodId: string; servings: number; food: Food }[];
};

export type SavedMeal = {
  id: string;
  name: string;
  items: { id: string; foodId: string; servings: number; food: Food }[];
};
