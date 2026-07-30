import { describe, expect, it } from "vitest";
import { generateTrainingPlan, recommendNextWorkout } from "../coach";
import type { LoadSummary } from "../training-load";
import type { StravaActivity } from "../strava";

function summary(overrides: Partial<LoadSummary> = {}): LoadSummary {
  return {
    series: [],
    ctl: 40,
    atl: 40,
    tsb: 0,
    acwr: 1,
    riskBand: "sweet-spot",
    formBand: "neutral",
    ...overrides,
  };
}

describe("recommendNextWorkout", () => {
  it("prescribes rest when risk is high", () => {
    const rec = recommendNextWorkout(summary({ riskBand: "high-risk", acwr: 1.8 }), []);
    expect(rec.type).toBe("rest");
  });

  it("prescribes rest when overreaching even if acwr looks fine", () => {
    const rec = recommendNextWorkout(summary({ formBand: "overreaching", tsb: -35 }), []);
    expect(rec.type).toBe("rest");
  });

  it("prescribes recovery when caution/fatigued", () => {
    const rec = recommendNextWorkout(summary({ riskBand: "caution", formBand: "fatigued" }), []);
    expect(rec.type).toBe("recovery");
  });

  it("prescribes intervals when fresh, safe load, and no recent intervals", () => {
    const rec = recommendNextWorkout(
      summary({ formBand: "fresh", riskBand: "sweet-spot", tsb: 12 }),
      []
    );
    expect(rec.type).toBe("intervals");
  });

  it("prescribes tempo when fresh but intervals already done this week", () => {
    const recentIntervals: StravaActivity = {
      id: 1,
      name: "Track Intervals",
      type: "Run",
      sport_type: "Run",
      start_date: new Date().toISOString(),
      moving_time: 1800,
      elapsed_time: 1800,
      distance: 5000,
      total_elevation_gain: 0,
      suffer_score: 20,
    };
    const rec = recommendNextWorkout(
      summary({ formBand: "fresh", riskBand: "sweet-spot", tsb: 12 }),
      [recentIntervals]
    );
    expect(rec.type).toBe("tempo");
  });

  it("defaults to endurance when balanced", () => {
    const rec = recommendNextWorkout(summary(), []);
    expect(rec.type).toBe("endurance");
  });

  it("defers to an already-scheduled hard session on today's calendar", () => {
    const rec = recommendNextWorkout(summary(), [], ["Coach: Tempo effort"]);
    expect(rec.title).toContain("Tempo effort");
  });

  it("ignores calendar events that aren't hard sessions", () => {
    const rec = recommendNextWorkout(summary(), [], ["Team meeting"]);
    expect(rec.type).toBe("endurance");
  });
});

describe("generateTrainingPlan", () => {
  it("splits phases summing to the requested number of weeks", () => {
    const plan = generateTrainingPlan({ totalWeeks: 12, currentWeeklyHours: 6 });
    expect(plan.weeks).toHaveLength(12);
    const phases = plan.weeks.map((w) => w.phase);
    expect(phases[0]).toBe("base");
    expect(phases[phases.length - 1]).toBe("taper");
    expect(new Set(phases)).toEqual(new Set(["base", "build", "peak", "taper"]));
  });

  it("tapers volume down toward the final week", () => {
    const plan = generateTrainingPlan({ totalWeeks: 12, currentWeeklyHours: 6 });
    const taperWeeks = plan.weeks.filter((w) => w.phase === "taper");
    expect(taperWeeks.length).toBeGreaterThanOrEqual(1);
    const peakWeek = [...plan.weeks].reverse().find((w) => w.phase === "peak")!;
    expect(taperWeeks[taperWeeks.length - 1].targetHours).toBeLessThan(peakWeek.targetHours);
  });

  it("each week's session minutes roughly add up to the target hours", () => {
    const plan = generateTrainingPlan({ totalWeeks: 8, currentWeeklyHours: 5 });
    for (const week of plan.weeks) {
      const totalMin = week.sessions.reduce((sum, s) => sum + s.durationMin, 0);
      expect(totalMin).toBeGreaterThan(week.targetHours * 60 * 0.9);
      expect(totalMin).toBeLessThan(week.targetHours * 60 * 1.1);
    }
  });

  it("cuts volume back every 4th week", () => {
    const plan = generateTrainingPlan({ totalWeeks: 12, currentWeeklyHours: 6 });
    const week4 = plan.weeks[3];
    const week3 = plan.weeks[2];
    if (week4.phase !== "taper") {
      expect(week4.isRecoveryWeek).toBe(true);
      expect(week4.targetHours).toBeLessThan(week3.targetHours);
    }
  });

  it("enforces a minimum plan length of 4 weeks", () => {
    const plan = generateTrainingPlan({ totalWeeks: 1, currentWeeklyHours: 4 });
    expect(plan.totalWeeks).toBe(4);
  });

  it("maps weeks and sessions to real, sequential dates from a given start date", () => {
    const plan = generateTrainingPlan({
      totalWeeks: 4,
      currentWeeklyHours: 5,
      startDate: "2026-08-03", // a Monday
    });
    expect(plan.weeks[0].startDate).toBe("2026-08-03");
    expect(plan.weeks[1].startDate).toBe("2026-08-10");
    const week1 = plan.weeks[0];
    const tuesday = week1.sessions.find((s) => s.dayOffset === 1)!;
    expect(tuesday.date).toBe("2026-08-04");
    const sunday = week1.sessions.find((s) => s.dayOffset === 6)!;
    expect(sunday.date).toBe("2026-08-09");
  });
});
