"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RotateCw } from "lucide-react";

type Lead = { id: string; name: string; email: string; phone: string | null; admissionYear: string | null; message: string; status: string; followUpAt: string | null; createdAt: string; notes: { id: string; note: string; author: { name: string } }[] };
const statuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"];

export function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/leads${filter ? `?status=${filter}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not load enquiries.");
      setLeads(result.leads);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load enquiries."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [filter]);

  async function updateLead(id: string, data: { status?: string; note?: string }) {
    setPendingId(id); setError("");
    try {
      const response = await fetch(`/api/admin/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not update enquiry.");
      setLeads(current => current.map(lead => lead.id === id ? { ...lead, status: result.lead.status, notes: data.note ? [{ id: crypto.randomUUID(), note: data.note, author: { name: "You" } }, ...lead.notes] : lead.notes } : lead));
      setNotes(current => ({ ...current, [id]: "" }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update enquiry."); }
    finally { setPendingId(""); }
  }

  return <div className="admin-workspace"><div className="admin-tools"><label className="field-label" htmlFor="lead-status-filter">Filter status</label><select className="field-control" id="lead-status-filter" value={filter} onChange={event => setFilter(event.target.value)}><option value="">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select><button className="btn-secondary" type="button" onClick={() => void load()} disabled={loading}><RotateCw size={14} /> Refresh</button></div>{error && <p className="auth-error" role="alert">{error}</p>}{loading ? <div className="loading-state"><LoaderCircle className="spin" />Loading enquiries…</div> : leads.length ? <div className="lead-list">{leads.map(lead => <article className="surface lead-record" key={lead.id}><div className="lead-record-heading"><div><strong>{lead.name}</strong><small>{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</small><p>{lead.message}</p><span className="data-note">Admission year: {lead.admissionYear || "Not specified"} · Received {new Date(lead.createdAt).toLocaleDateString("en-IN")}</span></div><div><label className="field-label" htmlFor={`status-${lead.id}`}>Status</label><select className="field-control" id={`status-${lead.id}`} value={lead.status} onChange={event => void updateLead(lead.id, { status: event.target.value })} disabled={pendingId === lead.id}>{statuses.map(status => <option key={status}>{status}</option>)}</select></div></div><details className="lead-notes"><summary>Internal notes ({lead.notes.length})</summary>{lead.notes.map(note => <p key={note.id}><strong>{note.author.name}:</strong> {note.note}</p>)}<form onSubmit={event => { event.preventDefault(); const note = notes[lead.id]?.trim(); if (note) void updateLead(lead.id, { note }); }}><label className="sr-only" htmlFor={`note-${lead.id}`}>Add an internal note</label><textarea className="field-control" id={`note-${lead.id}`} value={notes[lead.id] ?? ""} onChange={event => setNotes(current => ({ ...current, [lead.id]: event.target.value }))} maxLength={2000} placeholder="Internal note for authorised staff" /><button className="btn-secondary" type="submit" disabled={pendingId === lead.id || !notes[lead.id]?.trim()}>Add internal note</button></form></details></article>)}</div> : <div className="empty-state"><h2>No enquiries to show</h2><p>New counselling requests appear here once submitted.</p></div>}</div>;
}