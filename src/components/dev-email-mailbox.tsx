"use client";

import { useState } from "react";
import { LoaderCircle, MailSearch } from "lucide-react";

type EmailMessage = { id: string; subject: string; html: string; createdAt: string };

function getLocalActionLink(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const href = document.querySelector("a[href]")?.getAttribute("href");
  if (!href) return null;
  try {
    const url = new URL(href);
    const loopbackPreview = url.protocol === "http:" && window.location.protocol === "http:" && url.port === window.location.port && url.port === "3000" && ["localhost", "127.0.0.1"].includes(url.hostname) && ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const validPath = ["/reset-password", "/verify-email"].includes(url.pathname) || url.pathname.startsWith("/api/auth/reset-password/") || url.pathname.startsWith("/api/auth/verify-email/");
    if ((url.origin !== window.location.origin && !loopbackPreview) || !validPath) return null;
    return url.href;
  } catch { return null; }
}

export function DevEmailMailbox({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/dev/emails?email=${encodeURIComponent(email)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Mailbox could not be loaded.");
      setMessages(result.emails);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mailbox could not be loaded.");
    } finally { setLoading(false); }
  }

  return <div className="surface dashboard-content"><form className="form-grid" onSubmit={load}><div><label className="field-label" htmlFor="dev-email-recipient">Recipient email</label><input className="field-control" id="dev-email-recipient" type="email" value={email} onChange={event => setEmail(event.target.value)} required /></div><div style={{ alignSelf: "end" }}><button className="btn-primary" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={15} /> : <MailSearch size={15} />}Check inbox</button></div></form>{error && <p className="auth-error" role="alert">{error}</p>}{messages.length ? <div className="admin-service-list" style={{ marginTop: 18 }}>{messages.map(message => { const actionLink = getLocalActionLink(message.html); return <article className="surface admin-service-row" key={message.id}><div><strong>{message.subject}</strong><small>{new Date(message.createdAt).toLocaleString()}</small></div>{actionLink ? <a className="btn-primary" href={actionLink}>Open secure link</a> : <span className="data-note">No action link in this message.</span>}</article>; })}</div> : <p className="empty-inline">Enter the address the reset email was sent to.</p>}</div>;
}
