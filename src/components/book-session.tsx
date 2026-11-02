"use client";

import { useState } from "react";
import { CalendarClock, LoaderCircle } from "lucide-react";
import { PaymentCheckout } from "@/components/payment-checkout";

type Slot = { id: string; startsAt: string; endsAt: string; counsellorName: string };
type Booking = { id: string; status: string; startsAt: string };

export function BookSession({ serviceId, slots, paymentEnabled }: { serviceId: string; slots: Slot[]; paymentEnabled: boolean }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId, availabilityId: String(form.get("slot") ?? ""), studentNotes: String(form.get("notes") ?? "") }) });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { location.href = `/login?returnTo=${encodeURIComponent(location.pathname)}`; return; }
      if (!response.ok) { setMessage(result.error ?? "Booking request could not be saved."); return; }
      setBooking({ id: result.booking.id, status: result.booking.status, startsAt: result.booking.availability.startsAt });
      setMessage(result.paymentSetup ? "Your slot is reserved while payment is completed." : "Your booking request is saved. Payment setup is not configured, so no payment was taken.");
    } catch {
      setMessage("We couldn’t reach the server. Your booking was not confirmed; please try again.");
    } finally {
      setPending(false);
    }
  }
  if (booking) return <div className="auth-success" role="status"><strong>Booking request saved.</strong><p>{new Date(booking.startsAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST · {booking.status.replaceAll("_", " ")}</p><p>{message}</p><PaymentCheckout bookingId={booking.id} enabled={paymentEnabled} /></div>;
  if (!slots.length) return <p className="data-note">No future times are available for this service.</p>;
  return <form className="book-session-form" onSubmit={submit}><label className="field-label" htmlFor={`slot-${serviceId}`}><CalendarClock size={14} /> Available time (India Standard Time)</label><select className="field-control" id={`slot-${serviceId}`} name="slot" required defaultValue=""><option value="" disabled>Choose a time</option>{slots.map(slot => <option key={slot.id} value={slot.id}>{new Date(slot.startsAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} · {slot.counsellorName}</option>)}</select><label className="field-label" htmlFor={`booking-notes-${serviceId}`}>What would you like to discuss? (optional)</label><textarea className="field-control" id={`booking-notes-${serviceId}`} name="notes" rows={3} maxLength={2000} /><button className="btn-primary" type="submit" disabled={pending}>{pending && <LoaderCircle className="spin" size={15} />}Request this session</button>{message && <p className="auth-error" role="alert">{message}</p>}</form>;
}
