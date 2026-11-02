"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

type Booking = { id: string; status: string; createdAt: string; service: { name: string }; student: { name: string; email: string }; availability: { startsAt: string; endsAt: string } | null; payment: { status: string; currency: string; amountInr: string } | null };
const allowedStatus: Record<string, string[]> = { PENDING: ["CANCELLED", "CONFIRMED"], AWAITING_PAYMENT: ["CANCELLED"], CONFIRMED: ["COMPLETED", "CANCELLED", "REFUND_PENDING"], COMPLETED: [], CANCELLED: ["REFUND_PENDING"], REFUND_PENDING: ["REFUNDED"], REFUNDED: [] };

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  useEffect(() => { fetch("/api/admin/bookings", { cache: "no-store" }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Bookings are unavailable."); setBookings(result.bookings); }).catch(cause => setError(cause instanceof Error ? cause.message : "Bookings are unavailable.")).finally(() => setLoading(false)); }, []);

  async function updateStatus(booking: Booking, status: string) {
    if (status === "CANCELLED" && !window.confirm("Cancel this booking and release its reserved slot?")) return;
    setPending(booking.id); setError("");
    const response = await fetch(`/api/admin/bookings/${booking.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Status update failed.");
    else setBookings(current => current.map(item => item.id === booking.id ? { ...item, status: result.booking.status } : item));
    setPending("");
  }

  if (loading) return <div className="loading-state"><LoaderCircle className="spin" />Loading bookings…</div>;
  if (error && !bookings.length) return <div className="error-state"><h2>Bookings are unavailable</h2><p>{error}</p></div>;
  return <div className="admin-workspace">{error && <p className="auth-error" role="alert">{error}</p>}{bookings.length ? <div className="booking-admin-list">{bookings.map(booking => <article className="surface booking-admin-row" key={booking.id}><div><span className="status-badge">{booking.status.replaceAll("_", " ")}</span><h2>{booking.service.name}</h2><p>{booking.student.name} · {booking.student.email}</p><small>{booking.availability ? `${new Date(booking.availability.startsAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST` : "Time not scheduled"} · Requested {new Date(booking.createdAt).toLocaleDateString("en-IN")}</small>{booking.payment && <small>Payment: {booking.payment.status} · {booking.payment.currency} {booking.payment.amountInr}</small>}</div><div className="booking-actions">{allowedStatus[booking.status]?.map(status => <button className={status === "CANCELLED" ? "btn-danger" : "btn-secondary"} key={status} type="button" disabled={pending === booking.id} onClick={() => void updateStatus(booking, status)}>{pending === booking.id ? "Saving…" : status.replaceAll("_", " ")}</button>)}</div></article>)}</div> : <div className="empty-state"><h2>No booking requests</h2><p>Student requests will appear once counselling services and times are published.</p></div>}</div>;
}