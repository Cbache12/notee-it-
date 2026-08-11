"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Recipe } from "@/lib/types";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/recipes");
    setRecipes(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    if (res.ok) setRecipes((prev) => prev.filter((r) => r.id !== id));
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Couldn't delete this recipe");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My recipes</h1>
        <Link
          href="/recipes/new"
          className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          + New recipe
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-slate-500">No recipes yet. Build one from your foods.</p>
      ) : (
        <ul className="divide-y divide-slate-800 rounded border border-slate-800">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{recipe.name}</p>
                <p className="text-xs text-slate-400">
                  {recipe.servings} servings &middot; {Math.round(recipe.food.calories)} kcal/serving &middot;{" "}
                  {recipe.ingredients.length} ingredients
                </p>
              </div>
              <button onClick={() => handleDelete(recipe.id)} className="text-sm text-red-400 hover:text-red-300">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
