import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="page-container">
        <div className="footer-main">
          <div>
            <Link className="brand-lockup" href="/">
              <span className="brand-icon"><GraduationCap size={20} aria-hidden="true" /></span>
              <span className="brand-text" style={{ color: "white" }}>CollegePath<small style={{ color: "#b8c7d8" }}>FIND YOUR COLLEGE. PLAN YOUR FUTURE.</small></span>
            </Link>
            <p className="footer-brand-copy">A clearer, more transparent way to explore higher education options across India.</p>
          </div>
          <div className="footer-col"><h2 className="footer-col-title">DISCOVER</h2><Link href="/colleges">Explore colleges</Link><Link href="/courses">Courses</Link><Link href="/compare">Compare options</Link></div>
          <div className="footer-col"><h2 className="footer-col-title">GET SUPPORT</h2><Link href="/admission-guides">Admission guides</Link><Link href="/scholarships">Scholarships</Link><Link href="/guidance">Counselling</Link></div>
          <div className="footer-col footer-contact"><h2 className="footer-col-title">COLLEGEPATH</h2><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms and conditions</Link><Link href="/refund-policy">Refund policy</Link><Link href="/data-methodology">Data methodology</Link></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} CollegePath. Information is provided with source and verification context.</span><span>Student-first guidance. No admission guarantees.</span></div>
      </div>
    </footer>
  );
}