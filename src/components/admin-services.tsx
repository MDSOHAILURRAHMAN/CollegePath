"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, LoaderCircle } from "lucide-react";

type Service = { id: string; name: string; slug: string; durationMinutes: number; priceInr: string | null; deliverables: string[]; active: boolean };
type Counsellor = { id: string; name: string; email: string };
type Slot = { id: string; startsAt: string; endsAt: string; isAvailable: boolean; counsellor: { name: string }; booking: { status: string } | null };

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const responses = await Promise.all([fetch("/api/admin/services", { cache: "no-store" }), fetch("/api/admin/availability", { cache: "no-store" })]);
    const [serviceData, slotData] = await Promise.all(responses.map(response => response.json()));
    if (!responses[0].ok || !responses[1].ok) throw new Error(serviceData.error ?? slotData.error ?? "Configuration unavailable.");
    setServices(serviceData.services); setCounsellors(serviceData.counsellors); setSlots(slotData.slots);
  }
  useEffect(() => { load().catch(cause => { setError(true); setMessage(cause instanceof Error ? cause.message : "Configuration unavailable."); }).finally(() => setLoading(false)); }, []);

  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    const body = { ...values, durationMinutes: Number(values.durationMinutes), priceInr: values.priceInr === "" ? null : Number(values.priceInr), deliverables: String(values.deliverables).split("\n").map(value => value.trim()).filter(Boolean), active: false };
    const response = await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(true); setMessage(result.error ?? "Service could not be created."); return; }
    setError(false); setMessage("Service created inactive. Review its details before publishing."); form.reset(); await load();
  }

  async function toggleService(service: Service) {
    const response = await fetch(`/api/admin/services/${service.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !service.active }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(true); setMessage(result.error ?? "Service update failed."); return; }
    setError(false); setMessage(service.active ? "Service paused." : "Service published."); await load();
  }

  async function addSlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/admin/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ counsellorId: values.counsellorId, startsAt: new Date(String(values.startsAt)).toISOString(), endsAt: new Date(String(values.endsAt)).toISOString() }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(true); setMessage(result.error ?? "Availability could not be saved."); return; }
    setError(false); setMessage("Availability added and stored in UTC."); form.reset(); await load();
  }

  if (loading) return <div className="loading-state"><LoaderCircle className="spin" />Loading configuration…</div>;
  return <div className="admin-workspace">{message && <p className={error ? "auth-error" : "auth-success"} role={error ? "alert" : "status"}>{message}</p>}
    <section className="surface college-create-panel"><span className="eyebrow">COUNSELLING SERVICES</span><h2>Create a service</h2><p className="data-note">Services start inactive. Publishing requires a price, deliverables, and cancellation policy.</p><form className="form-grid" onSubmit={createService}><div><label className="field-label" htmlFor="service-name">Service name</label><input className="field-control" id="service-name" name="name" required minLength={3} /></div><div><label className="field-label" htmlFor="service-slug">Slug</label><input className="field-control" id="service-slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div><div><label className="field-label" htmlFor="service-duration">Duration (minutes)</label><input className="field-control" id="service-duration" name="durationMinutes" type="number" min="15" max="240" required /></div><div><label className="field-label" htmlFor="service-price">Price (INR)</label><input className="field-control" id="service-price" name="priceInr" type="number" min="0" max="500000" required /></div><div className="form-wide"><label className="field-label" htmlFor="service-description">Description</label><textarea className="field-control" id="service-description" name="description" rows={3} minLength={10} required /></div><div><label className="field-label" htmlFor="service-deliverables">Deliverables (one per line)</label><textarea className="field-control" id="service-deliverables" name="deliverables" rows={3} required /></div><div><label className="field-label" htmlFor="service-policy">Cancellation policy</label><textarea className="field-control" id="service-policy" name="cancellationPolicy" rows={3} minLength={10} required /></div><div className="form-wide"><button className="btn-primary" type="submit">Create inactive service</button></div></form></section>
    <section><div className="section-heading"><div><span className="eyebrow">SERVICE CATALOGUE</span><h2>Services & pricing</h2></div></div>{services.length ? <div className="admin-service-list">{services.map(service => <article className="surface admin-service-row" key={service.id}><div><strong>{service.name}</strong><small>{service.durationMinutes} minutes · {service.priceInr ? `₹${Number(service.priceInr).toLocaleString("en-IN")}` : "Price missing"} · {service.deliverables.length} deliverables</small></div><span className={service.active ? "status-verified" : "status-badge"}>{service.active ? "Published" : "Inactive"}</span><button className="btn-secondary" type="button" onClick={() => void toggleService(service)}>{service.active ? "Pause" : "Publish"}</button></article>)}</div> : <div className="empty-state"><h2>No services yet</h2><p>Create one above. Keep it inactive until terms are ready.</p></div>}</section>
    <section className="surface college-create-panel"><span className="eyebrow">COUNSELLOR AVAILABILITY</span><h2>Add a future time</h2>{counsellors.length ? <form className="form-grid" onSubmit={addSlot}><div><label className="field-label" htmlFor="availability-counsellor">Counsellor</label><select className="field-control" id="availability-counsellor" name="counsellorId" defaultValue="" required><option value="" disabled>Select a counsellor</option>{counsellors.map(person => <option value={person.id} key={person.id}>{person.name} · {person.email}</option>)}</select></div><div><label className="field-label" htmlFor="availability-start">Start (your local time)</label><input className="field-control" id="availability-start" name="startsAt" type="datetime-local" required /></div><div><label className="field-label" htmlFor="availability-end">End (your local time)</label><input className="field-control" id="availability-end" name="endsAt" type="datetime-local" required /></div><div className="form-wide"><button className="btn-secondary" type="submit"><CalendarPlus size={14} />Add time</button></div></form> : <p className="data-note">Assign a user the counsellor role before adding availability.</p>}{slots.map(slot => <p className="slot-summary" key={slot.id}>{slot.counsellor.name} · {new Date(slot.startsAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST · {slot.booking?.status ?? (slot.isAvailable ? "Available" : "Reserved")}</p>)}</section>
  </div>;
}