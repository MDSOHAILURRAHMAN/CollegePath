import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Building2, ChartNoAxesCombined, Compass, GraduationCap, HeartHandshake, Landmark, Scale, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";
import { CollegeSearch } from "@/components/college-search";
import { CollegeCard } from "@/components/college-card";
import { searchColleges } from "@/lib/colleges";
import type { CollegeSearch as CollegeFilters } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const categories = [
  ["engineering-technology", "Engineering & Technology", "Code, design, and build"], ["medical-healthcare", "Medical & Healthcare", "Care, science, and health"],
  ["management-business", "Management & Business", "People, markets, and ideas"], ["law", "Law", "Justice, policy, and advocacy"],
  ["commerce-finance", "Commerce & Finance", "Business, markets, and money"], ["arts-humanities", "Arts & Humanities", "Culture, communication, and thought"],
  ["science", "Science", "Explore how the world works"], ["design-architecture", "Design & Architecture", "Shape spaces, products, and experiences"],
  ["computer-applications", "Computer Applications", "Software, data, and systems"], ["education", "Education", "Learning, teaching, and development"],
  ["agriculture", "Agriculture", "Food systems and the environment"], ["hospitality-tourism", "Hospitality & Tourism", "Service, travel, and experience"],
];
const categoryIcons = [Compass, HeartHandshake, ChartNoAxesCombined, Scale, Building2, BookOpenCheck, Sparkles, Landmark, SearchCheck, GraduationCap, ShieldCheck, Compass];
const steps = [["01", "Discover", "Explore colleges and courses using the priorities that matter to you."], ["02", "Compare", "Review costs, programs, and sourced information side by side."], ["03", "Shortlist", "Save promising options to a private account you control."], ["04", "Get guidance", "Talk with a counsellor when a decision needs a second perspective."]];

const emptyFilters: CollegeFilters = { query: "", state: "", category: "", type: "", degree: "", page: 1, sort: "name" };

export default async function HomePage() {
  let featured = [] as Awaited<ReturnType<typeof searchColleges>>["colleges"];
  let dataReady = true;
  try {
    const result = await searchColleges(emptyFilters);
    featured = result.colleges.slice(0, 3);
  } catch {
    dataReady = false;
  }

  return (
    <>
      <section className="hero">
        <div className="page-container hero-main">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" />A clearer way to choose</span>
            <h1>Find the right college.<br /><em>Build your future.</em></h1>
            <p>Explore colleges across India, compare your options, and get personalised guidance for your educational journey.</p>
            <CollegeSearch compact />
            <div className="hero-actions"><Link className="btn-secondary" href="/guidance">Get personalised guidance <ArrowRight size={15} /></Link></div>
          </div>
          <div className="hero-art" aria-label="Students on a university campus">
            <div className="hero-photo"><Image src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85" alt="University students collaborating on campus" fill priority sizes="(max-width: 760px) 90vw, 46vw" /></div>
            <div className="hero-fact"><strong>One decision at a time.</strong><span>Browse at your pace. Talk with a counsellor when you’re ready.</span></div>
            <div className="hero-art-stamp">STUDENT<br />FIRST<br />ALWAYS</div>
          </div>
        </div>
      </section>

      <section className="trust-strip"><div className="page-container trust-strip-inner"><p>Better decisions start with information you can understand.</p><div className="trust-points"><span><ShieldCheck size={14} />Source-aware information</span><span><Scale size={14} />Transparent comparisons</span><span><HeartHandshake size={14} />Guidance when you need it</span></div></div></section>

      <section className="section-pad"><div className="page-container"><div className="section-heading"><div><span className="eyebrow">EXPLORE WHAT'S POSSIBLE</span><h2>Find a field that<br /><span className="serif">feels like yours.</span></h2></div><p>Start with your interests. Discover programs across the fields students explore most.</p></div><div className="category-grid">{categories.map(([slug, name, caption], index) => { const Icon = categoryIcons[index]; return <Link className="category-tile" href={`/colleges?category=${encodeURIComponent(slug)}`} key={slug}><span className="category-icon"><Icon size={18} aria-hidden="true" /></span><span><strong>{name}</strong><small>{caption}</small></span></Link>; })}</div></div></section>

      <section className="section-pad" style={{ background: "#eef3f6" }}><div className="page-container"><div className="section-heading"><div><span className="eyebrow">A SIMPLE WAY FORWARD</span><h2>Four steps.<br /><span className="serif">Your own direction.</span></h2></div><p>You can browse on your own and bring in a counsellor when you want another perspective.</p></div><div className="steps-grid">{steps.map(([number, title, copy]) => <article className="step-card" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

      <section className="section-pad"><div className="page-container"><div className="section-heading"><div><span className="eyebrow">FROM THE DIRECTORY</span><h2>Explore colleges,<br /><span className="serif">without the guesswork.</span></h2></div><Link href="/colleges" className="btn-secondary">Browse the directory <ArrowRight size={15} /></Link></div>{featured.length ? <div className="college-grid">{featured.map(college => <CollegeCard college={college} key={college.id} />)}</div> : <div className={dataReady ? "empty-state" : "error-state"}><Building2 size={25} color="#0d9488" /><h3>{dataReady ? "No colleges are listed yet" : "College data is temporarily unavailable"}</h3><p>{dataReady ? "Records will appear here once they are added and reviewed." : "Start PostgreSQL and apply the migration to connect the directory."}</p></div>}<p className="data-note" style={{ marginTop: 14 }}>Demo records are clearly labelled. Fees, rankings, outcomes, and recognition are shown only when sourced and verified.</p></div></section>

      <section className="section-pad" style={{ background: "#eef3f6" }}><div className="page-container"><div className="section-heading"><div><span className="eyebrow">USEFUL BEFORE YOU APPLY</span><h2>Questions worth<br /><span className="serif">asking early.</span></h2></div><Link href="/admission-guides" className="btn-secondary">Browse resources <ArrowRight size={15} /></Link></div><div className="resource-grid">{[["Entrance exams", "Understand the exam and the official application timeline."], ["Application checklists", "Keep documents, forms, and deadlines in one place."], ["Scholarships", "Find eligibility details and official application sources."], ["Choosing a course", "Explore the questions that help clarify your direction."]].map(([title, copy]) => <article className="resource-card" key={title}><BookOpenCheck size={19} /><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

      <section className="section-pad"><div className="page-container surface" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "clamp(22px,5vw,46px)", background: "#173b66", color: "white" }}><div><span className="eyebrow" style={{ color: "#b8d9d1" }}>WHEN YOU WANT A PERSON IN YOUR CORNER</span><h2 style={{ margin: "12px 0 8px", color: "white", fontSize: "clamp(28px,4vw,39px)" }}>Need help choosing your college?</h2><p style={{ margin: 0, color: "#d3deea", fontSize: 12 }}>One-to-one guidance, with clear deliverables and pricing before you book.</p></div><Link className="btn-primary" href="/guidance" style={{ background: "#fff", color: "#173b66", whiteSpace: "nowrap" }}>Explore counselling <ArrowRight size={15} /></Link></div></section>
    </>
  );
}