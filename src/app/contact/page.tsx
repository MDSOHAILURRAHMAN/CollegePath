import type { Metadata } from "next";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact CollegePath" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const college = Array.isArray(raw.college) ? raw.college[0] : raw.college;
  return <><section className="directory-hero"><div className="page-container"><span className="eyebrow">A REAL PERSON, WHEN YOU NEED ONE</span><h1>Let’s talk through it.</h1><p>Share what you’re working through. Your enquiry is saved for the CollegePath team to review.</p></div></section><section className="page-container contact-layout"><div className="surface contact-main"><span className="eyebrow">COUNSELLING ENQUIRY</span><h2>Start with a question.</h2><p className="data-note">No payment is requested through this form. A counsellor will follow up using your contact details.</p><ContactForm college={college?.slice(0, 120) ?? ""} /></div><aside className="contact-aside"><span className="eyebrow">CONTACT & PRIVACY</span><h2>Helpful, not pushy.</h2><p>We’ll use the details you submit to respond to this enquiry. Marketing updates are optional and separate.</p><div><Mail size={17} /><span><strong>Email</strong><small>Configure a real team inbox before launch.</small></span></div><div><MessageCircle size={17} /><span><strong>WhatsApp</strong><small>Connect an official business number before launch.</small></span></div><div><ShieldCheck size={17} /><span><strong>Private by design</strong><small>Enquiries are visible only to authorised staff.</small></span></div><p className="data-note">Email, phone, and messaging endpoints are not configured in this development environment.</p></aside></section></>;
}