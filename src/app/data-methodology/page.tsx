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
        <p>The initial real-data set contains 17 unique institutions listed in the Ministry of Education’s NIRF India Rankings 2025 Overall and Universities top tens. Rankings, institution names, and published locations are linked to their source. This is a limited ranked set, not a nationwide college directory.</p>
        <p><a href="https://www.nirfindia.org/Rankings/2025/OverallRanking.html" target="_blank" rel="noreferrer">NIRF 2025 Overall ranking</a><br /><a href="https://www.nirfindia.org/Rankings/2025/UniversityRanking.html" target="_blank" rel="noreferrer">NIRF 2025 Universities ranking</a></p>
      </article>
      <article>
        <h2>Unknown is not zero</h2>
        <p>Fees, program offerings, placement outcomes, recognition, admission cut-offs, and hostel data appear only when available for the relevant period. Missing values are labelled “Not available.”</p>
      </article>
      <article>
        <h2>Demo records</h2>
        <p>Fictional development records are clearly labelled and excluded from recommendations. They are not actual institutions, and production seeds do not include them.</p>
      </article>
      <article>
        <h2>Verification limitations</h2>
        <p>A verified label applies to the facts tied to the cited source and reviewed date. For NIRF entries, this covers the ranking-list fields only; it does not verify programs, current fees, admissions, accreditation, or outcomes. Confirm current information with the institution.</p>
      </article>
      <article>
        <h2>Corrections</h2>
        <p>Report a data issue through the contact form. The CollegePath operator should establish a review timeline and publish change history before launch.</p>
      </article>
    </section>
  );
}