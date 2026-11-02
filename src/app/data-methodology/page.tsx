import type { Metadata } from "next";

export const metadata: Metadata = { title: "Data-source methodology" };

export default function DataMethodologyPage() {
  return (
    <section className="page-container policy-page">
      <span className="eyebrow">TRANSPARENT INFORMATION</span>
      <h1>How we handle college data.</h1>
      <article>
        <h2>Sources first</h2>
        <p>College records identify their source, ranking or reporting year, verification status, and last-checked date. Official college or authoritative public sources take priority.</p>
        <p>The searchable alphabetical Government and Private picker includes 51,948 distinct AISHE college and university profiles: 8,674 government-managed and 43,274 private-managed. These come from 51,952 classified source rows; four exact college/university cross-list entries are merged under one institution, with related AISHE codes retained in the source snapshot. The college source contains 50,552 records with explicit management labels; 2,814 college rows were not classified as Government or Private and are excluded. AISHE university categories are also included. The extraction requests use AISHE survey year 2020, so the snapshot capture date does not mean every listed institution is currently active. Check current status with the <a href="https://dashboard.aishe.gov.in/hedirectory/#/institutionDirectory" target="_blank" rel="noreferrer">live AISHE directory</a>.</p>
        <p>The course and ranking cohort also includes the Ministry of Education’s NIRF India Rankings 2025 Overall top ten and Universities top 100 (106 unique institutions), the 138-institute JoSAA 2026-27 cohort, and VIT’s 2027-28 B.Tech list for Vellore and Chennai. The JoSAA snapshot contains program tables for 127 profiles and 1,007 program listings; 11 JoSAA directory entries had no program rows in the captured profile. The AISHE directory import supplies institution identity and management only, not course or fee facts.</p>
        <p><a href="https://www.nirfindia.org/Rankings/2025/OverallRanking.html" target="_blank" rel="noreferrer">NIRF 2025 Overall ranking</a><br /><a href="https://www.nirfindia.org/Rankings/2025/UniversityRanking.html" target="_blank" rel="noreferrer">NIRF 2025 Universities ranking</a><br /><a href="https://www.nirfindia.org/nirfpdfcdn/2025/pdf/Report/IR2025_Report.pdf" target="_blank" rel="noreferrer">NIRF 2025 report, Top 100 Universities table</a></p>
        <p><a href="https://josaa.nic.in/" target="_blank" rel="noreferrer">JoSAA 2026-27 admissions</a><br /><a href="https://josaa.nic.in/seat-matrix/" target="_blank" rel="noreferrer">JoSAA 2026 seat matrix and institute profiles</a><br /><a href="https://knowindia.india.gov.in/assets/doc/statewise2026.pdf" target="_blank" rel="noreferrer">Government of India state and union territory list (2026)</a></p>
      </article>
      <article>
        <h2>Unknown is not zero</h2>
        <p>Fees, program offerings, placement outcomes, recognition, admission cut-offs, and hostel data appear only when available for the relevant period. Missing values are labelled “Not available.” Twenty-eight captured JoSAA fee panels explicitly refer to 2026-27; some show fee information and others link to a separate institute fee page. The panel text and link destinations are preserved as published, including semester and student-category distinctions. CollegePath does not convert it into annual estimates or assume one category’s cost applies to everyone.</p>
      </article>
      <article>
        <h2>Demo records</h2>
        <p>Fictional development records are clearly labelled and excluded from recommendations. They are not actual institutions, and production seeds do not include them.</p>
      </article>
      <article>
        <h2>Verification limitations</h2>
        <p>A verified label applies only to facts tied to the cited source and checked date. NIRF sources verify the ranking-list fields. JoSAA sources verify the listed program names, entry duration, official address, and fee-panel text; they do not verify current admission eligibility, every program an institution offers, accreditation, or outcomes. Course categories and structured state/union-territory labels are normalized from the official award titles and postal addresses. Confirm details with the institution before applying.</p>
      </article>
      <article>
        <h2>Corrections</h2>
        <p>Report a data issue through the contact form. The CollegePath operator should establish a review timeline and publish change history before launch.</p>
      </article>
    </section>
  );
}
