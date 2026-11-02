"use client";

import { useState } from "react";
import { Download, LoaderCircle, Trash2 } from "lucide-react";

export function AccountPrivacyActions() {
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function removeAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== "DELETE MY ACCOUNT") return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/student/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Account deletion could not be completed.");
      window.location.assign("/?account-deleted=1");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account deletion could not be completed.");
      setPending(false);
    }
  }

  return <div className="account-privacy-actions">
    <p><a className="btn-secondary" href="/api/student/account"><Download size={15} />Download my account data</a></p>
    <p className="data-note">This JSON export includes your profile, saved colleges, comparisons, recommendations, enquiries, bookings, and consent history. It excludes passwords and staff-only notes.</p>
    <form className="form-grid" onSubmit={removeAccount}>
      <div className="form-wide"><label className="field-label" htmlFor="account-delete-confirmation">To delete your account, type DELETE MY ACCOUNT</label><input className="field-control" id="account-delete-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" /></div>
      <p className="data-note form-wide">Your login and student data will be removed, private booking notes cleared, and retained financial bookings de-identified. Financial and audit records may be retained where required.</p>
      {message && <p className="auth-error form-wide" role="alert">{message}</p>}
      <div className="form-wide"><button className="btn-secondary" type="submit" disabled={pending || confirmation !== "DELETE MY ACCOUNT"}>{pending ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}Delete account and student data</button></div>
    </form>
  </div>;
}
