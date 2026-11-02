import { describe, expect, it } from "vitest";
import { canTransitionBooking } from "./booking-state";

describe("booking transitions", () => {
  it("allows a confirmed session to complete or cancel", () => {
    expect(canTransitionBooking("CONFIRMED", "COMPLETED")).toBe(true);
    expect(canTransitionBooking("CONFIRMED", "CANCELLED")).toBe(true);
  });

  it("blocks impossible transitions from terminal states", () => {
    expect(canTransitionBooking("COMPLETED", "CONFIRMED")).toBe(false);
    expect(canTransitionBooking("REFUNDED", "PENDING")).toBe(false);
  });
});