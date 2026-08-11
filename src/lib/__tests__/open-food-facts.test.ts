import { describe, expect, it } from "vitest";
import { mapOffProduct } from "@/lib/open-food-facts";

describe("mapOffProduct", () => {
  it("normalizes a well-formed product to per-100g nutrition", () => {
    const mapped = mapOffProduct({
      code: "0123456789",
      product_name: "Test Cereal",
      brands: "TestBrand, OtherBrand",
      nutriments: {
        "energy-kcal_100g": 380,
        proteins_100g: 8,
        carbohydrates_100g: 70,
        fat_100g: 5,
        fiber_100g: 6,
        sugars_100g: 20,
        sodium_100g: 0.5,
      },
    });

    expect(mapped).toEqual({
      barcode: "0123456789",
      brand: "TestBrand",
      name: "Test Cereal",
      servingSize: 100,
      servingUnit: "g",
      calories: 380,
      proteinG: 8,
      carbsG: 70,
      fatG: 5,
      fiberG: 6,
      sugarG: 20,
      sodiumMg: 500,
    });
  });

  it("returns null when the product has no name", () => {
    expect(
      mapOffProduct({ code: "123", nutriments: { "energy-kcal_100g": 100 } })
    ).toBeNull();
  });

  it("returns null when the product has no barcode", () => {
    expect(
      mapOffProduct({ product_name: "X", nutriments: { "energy-kcal_100g": 100 } })
    ).toBeNull();
  });

  it("returns null when calories are missing", () => {
    expect(
      mapOffProduct({ code: "123", product_name: "X", nutriments: {} })
    ).toBeNull();
  });

  it("defaults missing macro fields to zero and optional fields to null", () => {
    const mapped = mapOffProduct({
      code: "123",
      product_name: "Bare Product",
      nutriments: { "energy-kcal_100g": 250 },
    });
    expect(mapped).toEqual({
      barcode: "123",
      brand: null,
      name: "Bare Product",
      servingSize: 100,
      servingUnit: "g",
      calories: 250,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: null,
      sugarG: null,
      sodiumMg: null,
    });
  });
});
