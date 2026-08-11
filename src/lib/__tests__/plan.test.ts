import { describe, expect, it } from "vitest";
import { generateActivityPlan } from "@/lib/plan";

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
});
