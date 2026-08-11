import { describe, expect, it } from "vitest";
import { generateActivityPlan, projectedWeightForWeek } from "@/lib/plan";

describe("generateActivityPlan", () => {
  it("ramps steps from a base toward 12,000 and holds there", () => {
    const plan = generateActivityPlan(8);
    expect(plan).toHaveLength(8);
    expect(plan[0].stepsTarget).toBe(6000);
    expect(plan[4].stepsTarget).toBe(12000);
    for (const week of plan.slice(4)) {
      expect(week.stepsTarget).toBe(12000);
    }
  });

  it("adds treadmill incline walks only in the final 3 weeks, building 15/20/30 min", () => {
    const plan = generateActivityPlan(8);
    expect(plan.slice(0, 5).every((w) => w.treadmill === null)).toBe(true);
    expect(plan[5].treadmill).toEqual({ minutes: 15 });
    expect(plan[6].treadmill).toEqual({ minutes: 20 });
    expect(plan[7].treadmill).toEqual({ minutes: 30 });
  });

  it("still produces a valid plan at the minimum 4-week length", () => {
    const plan = generateActivityPlan(4);
    expect(plan).toHaveLength(4);
    expect(plan[1].treadmill).toEqual({ minutes: 15 });
    expect(plan[2].treadmill).toEqual({ minutes: 20 });
    expect(plan[3].treadmill).toEqual({ minutes: 30 });
  });

  it("handles arbitrary plan lengths beyond the original 4-8 week range", () => {
    const plan = generateActivityPlan(16);
    expect(plan).toHaveLength(16);
    expect(plan[0].stepsTarget).toBe(6000);
    expect(plan[12].stepsTarget).toBe(12000);
    expect(plan[13].treadmill).toEqual({ minutes: 15 });
    expect(plan[15].treadmill).toEqual({ minutes: 30 });
  });
});

describe("projectedWeightForWeek", () => {
  it("starts at startWeightKg at week 0", () => {
    const w = projectedWeightForWeek({ week: 0, startWeightKg: 90, goalWeightKg: 80, totalWeeks: 8 });
    expect(w).toBe(90);
  });

  it("reaches goalWeightKg exactly at the final week", () => {
    const w = projectedWeightForWeek({ week: 8, startWeightKg: 90, goalWeightKg: 80, totalWeeks: 8 });
    expect(w).toBe(80);
  });

  it("interpolates linearly at the midpoint", () => {
    const w = projectedWeightForWeek({ week: 4, startWeightKg: 90, goalWeightKg: 80, totalWeeks: 8 });
    expect(w).toBe(85);
  });

  it("works for weight gain (goal above start)", () => {
    const w = projectedWeightForWeek({ week: 5, startWeightKg: 70, goalWeightKg: 80, totalWeeks: 10 });
    expect(w).toBe(75);
  });

  it("clamps at goalWeightKg past the end of the plan", () => {
    const w = projectedWeightForWeek({ week: 12, startWeightKg: 90, goalWeightKg: 80, totalWeeks: 8 });
    expect(w).toBe(80);
  });
});
