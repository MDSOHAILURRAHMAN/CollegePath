"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, GraduationCap, LogOut, Menu, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const links = [
  ["Explore colleges", "/colleges"],
  ["Courses", "/courses"],
  ["Compare", "/compare"],
  ["Guides", "/admission-guides"],
  ["Scholarships", "/scholarships"],
  ["About", "/about"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const accountHref = session?.user.role === "ADMIN" ? "/admin" : session?.user.role === "COUNSELLOR" ? "/admin/leads" : "/dashboard";

  async function signOut() {
    await authClient.signOut();
    setOpen(false);
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <div className="page-container site-header-inner">
        <Link className="brand-lockup" href="/" aria-label="CollegePath home" onClick={() => setOpen(false)}>
          <span className="brand-icon"><GraduationCap size={20} aria-hidden="true" /></span>
          <span className="brand-text">CollegePath<small>FIND YOUR COLLEGE. PLAN YOUR FUTURE.</small></span>
        </Link>
        <nav className="main-nav" data-open={open} aria-label="Main navigation">
          {links.map(([label, href]) => <Link href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}
          {!session && <Link className="mobile-nav-account" href="/login" onClick={() => setOpen(false)}>Login / Register</Link>}
          {session && <button className="mobile-nav-account mobile-sign-out" type="button" onClick={signOut}><LogOut size={14} />Sign out</button>}
          <Link className="btn-primary" href={session ? accountHref : "/guidance"} onClick={() => setOpen(false)}>
            {session ? "My account" : "Get personalised guidance"}<ArrowRight size={15} aria-hidden="true" />
          </Link>
        </nav>
        <div className="nav-actions">
          {session?.user.role === "ADMIN" && <Link className="btn-quiet" href="/admin/services">Admin tools</Link>}
          {session?.user.role === "COUNSELLOR" && <Link className="btn-quiet" href="/admin/leads">Counsellor</Link>}
          {session ? <><Link className="btn-secondary" href={accountHref}>Dashboard</Link><button className="btn-quiet desktop-sign-out" type="button" onClick={signOut}><LogOut size={14} />Sign out</button></> : <Link className="btn-secondary" href="/login">Login</Link>}
          <button className="nav-mobile-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
    </header>
  );
}