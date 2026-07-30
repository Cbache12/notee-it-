import { describe, expect, it } from "vitest";
import {
  buildLoadSeries,
  classifyForm,
  classifyRisk,
  estimateActivityLoad,
} from "../training-load";
import type { StravaActivity } from "../strava";

function activityAt(daysAgo: number, overrides: Partial<StravaActivity> = {}): StravaActivity {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return {
    id: daysAgo,
    name: "Run",
    type: "Run",
    sport_type: "Run",
    start_date: date.toISOString(),
    moving_time: 3600,
    elapsed_time: 3600,
    distance: 10000,
    total_elevation_gain: 0,
    ...overrides,
  };
}

describe("estimateActivityLoad", () => {
  it("uses Strava's suffer_score when present", () => {
    const activity = activityAt(0, { suffer_score: 120 });
    expect(estimateActivityLoad(activity)).toBe(120);
  });

  it("falls back to HR-reserve TRIMP when suffer_score is absent", () => {
    const activity = activityAt(0, { average_heartrate: 150 });
    const load = estimateActivityLoad(activity, { restingHr: 50, maxHr: 190 });
    expect(load).toBeGreaterThan(0);
  });

  it("falls back to a flat duration x intensity estimate with no HR data", () => {
    const activity = activityAt(0, { type: "Ride" });
    expect(estimateActivityLoad(activity)).toBeCloseTo(60 * 2.5);
  });
});

describe("buildLoadSeries", () => {
  it("converges CTL and ATL toward a constant daily load", () => {
    const dailyLoad = 50;
    const activities = Array.from({ length: 90 }, (_, i) =>
      activityAt(i, { suffer_score: dailyLoad })
    );
    const summary = buildLoadSeries(activities, {}, 120);
    // After many days of constant load, both averages should approach the load value.
    expect(summary.ctl).toBeGreaterThan(dailyLoad * 0.85);
    expect(summary.atl).toBeGreaterThan(dailyLoad * 0.95);
    expect(summary.acwr).toBeCloseTo(1, 1);
  });

  it("produces zero load / zero risk for an athlete with no activities", () => {
    const summary = buildLoadSeries([], {}, 30);
    expect(summary.ctl).toBe(0);
    expect(summary.atl).toBe(0);
    expect(summary.acwr).toBe(0);
    expect(summary.riskBand).toBe("low");
  });

  it("flags high-risk when acute load spikes far above chronic load", () => {
    // Steady low load for a month, then a big spike in the last week.
    const activities = [
      ...Array.from({ length: 28 }, (_, i) => activityAt(i + 7, { suffer_score: 20 })),
      ...Array.from({ length: 6 }, (_, i) => activityAt(i, { suffer_score: 150 })),
    ];
    const summary = buildLoadSeries(activities, {}, 60);
    expect(summary.acwr).toBeGreaterThan(1.5);
    expect(summary.riskBand).toBe("high-risk");
  });
});

describe("classifyRisk", () => {
  it.each([
    [0, "low"],
    [0.5, "low"],
    [1.0, "sweet-spot"],
    [1.4, "caution"],
    [2.0, "high-risk"],
  ] as const)("classifies acwr=%s as %s", (acwr, expected) => {
    expect(classifyRisk(acwr)).toBe(expected);
  });
});

describe("classifyForm", () => {
  it.each([
    [10, "fresh"],
    [0, "neutral"],
    [-20, "fatigued"],
    [-40, "overreaching"],
  ] as const)("classifies tsb=%s as %s", (tsb, expected) => {
    expect(classifyForm(tsb)).toBe(expected);
  });
});
