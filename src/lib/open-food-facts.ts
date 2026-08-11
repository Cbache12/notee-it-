export type OffFood = {
  barcode: string;
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

type OffProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: Record<string, number | undefined>;
};

const BASE_URL = "https://world.openfoodfacts.org";

/**
 * Maps a raw Open Food Facts product to our per-100g Food shape. OFF reports
 * nutriments per 100g/100ml for virtually all products, so we normalize to
 * that regardless of the product's own serving size to keep math simple and
 * comparable across foods.
 */
export function mapOffProduct(product: OffProduct): OffFood | null {
  const name = product.product_name?.trim();
  const barcode = product.code?.trim();
  const n = product.nutriments;
  if (!name || !barcode || !n) return null;

  const calories = n["energy-kcal_100g"];
  if (calories == null) return null;

  return {
    barcode,
    brand: product.brands?.split(",")[0]?.trim() || null,
    name,
    servingSize: 100,
    servingUnit: "g",
    calories,
    proteinG: n["proteins_100g"] ?? 0,
    carbsG: n["carbohydrates_100g"] ?? 0,
    fatG: n["fat_100g"] ?? 0,
    fiberG: n["fiber_100g"] ?? null,
    sugarG: n["sugars_100g"] ?? null,
    sodiumMg: n["sodium_100g"] != null ? n["sodium_100g"] * 1000 : null,
  };
}

export async function searchOffFoods(query: string, limit = 15): Promise<OffFood[]> {
  const url = new URL(`${BASE_URL}/cgi/search.pl`);
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(limit));
  url.searchParams.set(
    "fields",
    "code,product_name,brands,nutriments"
  );

  const res = await fetch(url, {
    headers: { "User-Agent": "calorie-tracker (contact: n/a)" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Open Food Facts search failed: ${res.status}`);

  const data = (await res.json()) as { products?: OffProduct[] };
  return (data.products ?? [])
    .map(mapOffProduct)
    .filter((f): f is OffFood => f !== null);
}

export async function lookupOffBarcode(barcode: string): Promise<OffFood | null> {
  const url = new URL(`${BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`);
  url.searchParams.set("fields", "code,product_name,brands,nutriments");

  const res = await fetch(url, {
    headers: { "User-Agent": "calorie-tracker (contact: n/a)" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Open Food Facts lookup failed: ${res.status}`);

  const data = (await res.json()) as { status?: number; product?: OffProduct };
  if (data.status !== 1 || !data.product) return null;
  return mapOffProduct(data.product);
}
