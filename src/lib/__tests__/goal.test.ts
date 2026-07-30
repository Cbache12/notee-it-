import { describe, expect, it } from "vitest";
import { weeksUntilRace } from "../goal";

describe("weeksUntilRace", () => {
  it("returns null when there's no goal", () => {
    expect(weeksUntilRace(null)).toBeNull();
  });

  it("rounds up to whole weeks", () => {
    const now = new Date("2026-07-30T12:00:00Z");
    expect(weeksUntilRace({ raceName: "Barossa Half", raceDate: "2026-08-23" }, now)).toBe(4);
  });

  it("returns exactly the week count for an even multiple of 7 days", () => {
    const now = new Date("2026-07-30T00:00:00Z");
    expect(weeksUntilRace({ raceName: "Test Race", raceDate: "2026-08-13" }, now)).toBe(2);
  });

  it("floors at 1 week for a race today or in the past", () => {
    const now = new Date("2026-07-30T00:00:00Z");
    expect(weeksUntilRace({ raceName: "Today", raceDate: "2026-07-30" }, now)).toBe(1);
    expect(weeksUntilRace({ raceName: "Past", raceDate: "2026-07-01" }, now)).toBe(1);
  });
});
