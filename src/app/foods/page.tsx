"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Food } from "@/lib/types";

export default function FoodsPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/foods");
    setFoods(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/foods/${id}`, { method: "DELETE" });
    if (res.ok) setFoods((prev) => prev.filter((f) => f.id !== id));
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Couldn't delete this food");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My foods</h1>
        <Link
          href="/foods/new"
          className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          + New food
        </Link>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        Custom foods you&apos;ve created. Foods found via search (including barcode scans) are added automatically
        when you log them.
      </p>
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : foods.length === 0 ? (
        <p className="text-sm text-slate-500">No custom foods yet.</p>
      ) : (
        <ul className="divide-y divide-slate-800 rounded border border-slate-800">
          {foods.map((food) => (
            <li key={food.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{food.name}</p>
                <p className="text-xs text-slate-400">
                  {Math.round(food.calories)} kcal &middot; {food.servingSize}
                  {food.servingUnit} &middot; P{Math.round(food.proteinG)} C{Math.round(food.carbsG)} F
                  {Math.round(food.fatG)}
                </p>
              </div>
              <button onClick={() => handleDelete(food.id)} className="text-sm text-red-400 hover:text-red-300">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
