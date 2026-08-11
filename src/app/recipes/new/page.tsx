"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FoodPicker from "@/components/FoodPicker";

type Ingredient = { foodId: string; name: string; servings: number };

export default function NewRecipePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAddIngredient(foodId: string, ingServings: number) {
    const res = await fetch(`/api/foods/${foodId}`);
    const food = await res.json();
    setIngredients((prev) => [...prev, { foodId, name: food.name, servings: ingServings }]);
    setPicking(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (ingredients.length === 0) {
      setError("Add at least one ingredient");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        servings,
        ingredients: ingredients.map((i) => ({ foodId: i.foodId, servings: i.servings })),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    router.push("/recipes");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-semibold">New recipe</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Recipe name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
        />
        <label className="text-sm text-slate-400">
          Total servings this recipe makes
          <input
            type="number"
            min={0.5}
            step="0.5"
            required
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">Ingredients</p>
          {ingredients.length > 0 && (
            <ul className="mb-2 divide-y divide-slate-800 rounded border border-slate-800">
              {ingredients.map((ing, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    {ing.name} &middot; {ing.servings} serving{ing.servings === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {picking ? (
            <FoodPicker onAdd={handleAddIngredient} />
          ) : (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="rounded border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500"
            >
              + Add ingredient
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-emerald-500 px-3 py-2 font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save recipe"}
        </button>
      </form>
    </div>
  );
}
