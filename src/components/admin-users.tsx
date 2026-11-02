"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

type Account = { id: string; name: string; email: string; role: "STUDENT" | "COUNSELLOR" | "ADMIN"; createdAt: string };

export function AdminUsers() {
  const [users, setUsers] = useState<Account[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/admin/users", { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Account list is unavailable.");
      setUsers(result.users);
    }).catch(error => setMessage(error instanceof Error ? error.message : "Account list is unavailable.")).finally(() => setLoading(false));
  }, []);

  async function changeRole(userId: string, role: Account["role"]) {
    setMessage("");
    const response = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? "Role update failed."); return; }
    setUsers(current => current.map(user => user.id === userId ? { ...user, role } : user));
    setMessage("Access role updated.");
  }

  if (loading) return <div className="loading-state"><LoaderCircle className="spin" />Loading accounts…</div>;
  return <div className="surface admin-users-wrap">{message && <p className="auth-success" role="status">{message}</p>}{users.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Account</th><th>Joined</th><th>Role</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><strong>{user.name}</strong><small className="table-subline">{user.email}</small></td><td>{new Date(user.createdAt).toLocaleDateString("en-IN")}</td><td><label className="sr-only" htmlFor={`role-${user.id}`}>Role for {user.name}</label><select className="field-control role-select" id={`role-${user.id}`} value={user.role} onChange={event => void changeRole(user.id, event.target.value as Account["role"])}><option value="STUDENT">Student</option><option value="COUNSELLOR">Counsellor</option><option value="ADMIN">Admin</option></select></td></tr>)}</tbody></table></div> : <div className="empty-state"><h2>No accounts yet</h2><p>Student registrations will appear here.</p></div>}</div>;
}