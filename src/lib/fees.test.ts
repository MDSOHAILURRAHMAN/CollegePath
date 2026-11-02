import { describe, expect, it } from "vitest";
import { calculateEstimatedCost } from "./fees";

describe("estimated education costs", () => {
  it("calculates tuition, hostel, and one-time fees for a known duration", () => {
    expect(calculateEstimatedCost({ annualTuitionInr: 200_000, annualHostelInr: 80_000, oneTimeFeesInr: 15_000, years: 4 })).toBe(1_135_000);
  });

  it("does not convert missing fees into zero", () => {
    expect(calculateEstimatedCost({ annualTuitionInr: null, years: 4 })).toBeNull();
  });

  it("rejects impossible duration or negative costs", () => {
    expect(calculateEstimatedCost({ annualTuitionInr: 10, years: 0 })).toBeNull();
    expect(calculateEstimatedCost({ annualTuitionInr: -1, years: 4 })).toBeNull();
  });
});