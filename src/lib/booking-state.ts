export type BookingState = "PENDING" | "AWAITING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REFUND_PENDING" | "REFUNDED";

const transitions: Record<BookingState, BookingState[]> = {
  PENDING: ["AWAITING_PAYMENT", "CONFIRMED", "CANCELLED"],
  AWAITING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "REFUND_PENDING"],
  COMPLETED: [],
  CANCELLED: ["REFUND_PENDING"],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
};

export function canTransitionBooking(from: BookingState, to: BookingState) {
  return transitions[from].includes(to);
}