import { prisma } from "@/lib/prisma";

async function main() {
  const nirfVerifiedAt = new Date("2026-11-02T00:00:00.000Z");
  const nirfSourceUrl = "https://www.nirfindia.org/Rankings/2025/OverallRanking.html";
  const nirfSource = await prisma.dataSource.upsert({
    where: { id: "nirf-2025-overall-source" },
    update: {
      name: "National Institutional Ranking Framework (NIRF), India Rankings 2025",
      sourceType: "GOVERNMENT_RANKING",
      url: nirfSourceUrl,
      verificationStatus: "VERIFIED",
      checkedAt: nirfVerifiedAt,
      reviewerNotes: "Official Ministry of Education 2025 Overall ranking. Institution names, rank, city, and state only; no fees or program details are inferred.",
    },
    create: {
      id: "nirf-2025-overall-source",
      name: "National Institutional Ranking Framework (NIRF), India Rankings 2025",
      sourceType: "GOVERNMENT_RANKING",
      url: nirfSourceUrl,
      verificationStatus: "VERIFIED",
      checkedAt: nirfVerifiedAt,
      reviewerNotes: "Official Ministry of Education 2025 Overall ranking. Institution names, rank, city, and state only; no fees or program details are inferred.",
    },
  });

  const nirfOverallTopTen = [
    { code: "IR-O-U-0456", name: "Indian Institute of Technology Madras", city: "Chennai", state: "Tamil Nadu", rank: 1 },
    { code: "IR-O-U-0220", name: "Indian Institute of Science", city: "Bengaluru", state: "Karnataka", rank: 2 },
    { code: "IR-O-U-0306", name: "Indian Institute of Technology Bombay", city: "Mumbai", state: "Maharashtra", rank: 3 },
    { code: "IR-O-I-1074", name: "Indian Institute of Technology Delhi", city: "New Delhi", state: "Delhi", rank: 4 },
    { code: "IR-O-I-1075", name: "Indian Institute of Technology Kanpur", city: "Kanpur", state: "Uttar Pradesh", rank: 5 },
    { code: "IR-O-U-0573", name: "Indian Institute of Technology Kharagpur", city: "Kharagpur", state: "West Bengal", rank: 6 },
    { code: "IR-O-U-0560", name: "Indian Institute of Technology Roorkee", city: "Roorkee", state: "Uttarakhand", rank: 7 },
    { code: "IR-O-N-15", name: "All India Institute of Medical Sciences, Delhi", city: "New Delhi", state: "Delhi", rank: 8 },
    { code: "IR-O-U-0109", name: "Jawaharlal Nehru University", city: "New Delhi", state: "Delhi", rank: 9 },
    { code: "IR-O-U-0500", name: "Banaras Hindu University", city: "Varanasi", state: "Uttar Pradesh", rank: 10 },
  ] as const;

  async function seedNirfRanking(institution: { slug: string; name: string; city: string; state: string; category: string; rank: number }, sourceId: string) {
    const college = await prisma.college.upsert({
      where: { slug: institution.slug },
      update: {
        name: institution.name,
        institutionType: "OTHER",
        description: `Listed in the NIRF India Rankings 2025 ${institution.category} category. Other institutional details have not been verified in this dataset.`,
        verificationStatus: "VERIFIED",
        demoRecord: false,
        lastVerifiedAt: nirfVerifiedAt,
        sourceId,
      },
      create: {
        slug: institution.slug,
        name: institution.name,
        institutionType: "OTHER",
        description: `Listed in the NIRF India Rankings 2025 ${institution.category} category. Other institutional details have not been verified in this dataset.`,
        verificationStatus: "VERIFIED",
        demoRecord: false,
        lastVerifiedAt: nirfVerifiedAt,
        sourceId,
      },
    });

    await prisma.campus.upsert({
      where: { id: `${institution.slug}-campus` },
      update: { collegeId: college.id, city: institution.city, state: institution.state },
      create: { id: `${institution.slug}-campus`, collegeId: college.id, city: institution.city, state: institution.state },
    });

    const rankingId = `${institution.slug}-nirf-${institution.category.toLowerCase().replaceAll(" ", "-")}-2025`;
    await prisma.rankingRecord.upsert({
      where: { id: rankingId },
      update: {
        collegeId: college.id,
        rankingBody: "NIRF India Rankings",
        category: institution.category,
        rank: institution.rank,
        academicYear: "2025",
        sourceId,
        verificationStatus: "VERIFIED",
        lastVerifiedAt: nirfVerifiedAt,
      },
      create: {
        id: rankingId,
        collegeId: college.id,
        rankingBody: "NIRF India Rankings",
        category: institution.category,
        rank: institution.rank,
        academicYear: "2025",
        sourceId,
        verificationStatus: "VERIFIED",
        lastVerifiedAt: nirfVerifiedAt,
      },
    });
  }

  for (const institution of nirfOverallTopTen) {
    await seedNirfRanking({ ...institution, slug: `nirf-${institution.code.toLowerCase()}`, category: "Overall" }, nirfSource.id);
  }

  const universitySourceUrl = "https://www.nirfindia.org/Rankings/2025/UniversityRanking.html";
  const universitySource = await prisma.dataSource.upsert({
    where: { id: "nirf-2025-university-source" },
    update: {
      name: "National Institutional Ranking Framework (NIRF), India Rankings 2025: Universities",
      sourceType: "GOVERNMENT_RANKING",
      url: universitySourceUrl,
      verificationStatus: "VERIFIED",
      checkedAt: nirfVerifiedAt,
      reviewerNotes: "Official Ministry of Education 2025 Universities ranking. Institution names, rank, city, and state only; no fees or program details are inferred.",
    },
    create: {
      id: "nirf-2025-university-source",
      name: "National Institutional Ranking Framework (NIRF), India Rankings 2025: Universities",
      sourceType: "GOVERNMENT_RANKING",
      url: universitySourceUrl,
      verificationStatus: "VERIFIED",
      checkedAt: nirfVerifiedAt,
      reviewerNotes: "Official Ministry of Education 2025 Universities ranking. Institution names, rank, city, and state only; no fees or program details are inferred.",
    },
  });
  const nirfUniversityTopTen = [
    { slug: "nirf-ir-o-u-0220", name: "Indian Institute of Science", city: "Bengaluru", state: "Karnataka", category: "Universities", rank: 1 },
    { slug: "nirf-ir-o-u-0109", name: "Jawaharlal Nehru University", city: "New Delhi", state: "Delhi", category: "Universities", rank: 2 },
    { slug: "nirf-manipal-academy-of-higher-education", name: "Manipal Academy of Higher Education", city: "Manipal", state: "Karnataka", category: "Universities", rank: 3 },
    { slug: "nirf-jamia-millia-islamia", name: "Jamia Millia Islamia", city: "New Delhi", state: "Delhi", category: "Universities", rank: 4 },
    { slug: "nirf-university-of-delhi", name: "University of Delhi", city: "Delhi", state: "Delhi", category: "Universities", rank: 5 },
    { slug: "nirf-ir-o-u-0500", name: "Banaras Hindu University", city: "Varanasi", state: "Uttar Pradesh", category: "Universities", rank: 6 },
    { slug: "nirf-birla-institute-of-technology-and-science", name: "Birla Institute of Technology & Science, Pilani", city: "Pilani", state: "Rajasthan", category: "Universities", rank: 7 },
    { slug: "nirf-amrita-vishwa-vidyapeetham", name: "Amrita Vishwa Vidyapeetham", city: "Coimbatore", state: "Tamil Nadu", category: "Universities", rank: 8 },
    { slug: "nirf-jadavpur-university", name: "Jadavpur University", city: "Kolkata", state: "West Bengal", category: "Universities", rank: 9 },
    { slug: "nirf-aligarh-muslim-university", name: "Aligarh Muslim University", city: "Aligarh", state: "Uttar Pradesh", category: "Universities", rank: 10 },
  ] as const;
  for (const institution of nirfUniversityTopTen) {
    await seedNirfRanking(institution, universitySource.id);
  }

  const source = process.env.NODE_ENV === "production" ? null : await prisma.dataSource.upsert({
    where: { id: "development-demo-source" },
    update: {},
    create: {
      id: "development-demo-source",
      name: "CollegePath development demo data",
      sourceType: "DEMO_FIXTURE",
      verificationStatus: "DEMO",
      reviewerNotes: "Fictional sample records for local UI development; not real colleges or verified facts.",
    },
  });

  const categories = [
    ["engineering-technology", "Engineering & Technology", "Engineering and technology programs."],
    ["medical-healthcare", "Medical & Healthcare", "Medical, health, and care-related programs."],
    ["management-business", "Management & Business", "Management, business, and leadership programs."],
    ["law", "Law", "Law and legal studies programs."],
    ["commerce-finance", "Commerce & Finance", "Commerce, economics, accounting, and finance programs."],
    ["arts-humanities", "Arts & Humanities", "Arts, languages, and humanities programs."],
    ["science", "Science", "Natural, physical, and applied science programs."],
    ["design-architecture", "Design & Architecture", "Design, planning, and architecture programs."],
    ["computer-applications", "Computer Applications", "Computing and application-focused programs."],
    ["education", "Education", "Education and learning programs."],
    ["agriculture", "Agriculture", "Agriculture and food-system programs."],
    ["hospitality-tourism", "Hospitality & Tourism", "Hospitality, tourism, and service programs."],
  ] as const;
  for (const [slug, name, description] of categories) {
    await prisma.courseCategory.upsert({ where: { slug }, update: { name, description }, create: { slug, name, description } });
  }
  const demos = [
    { slug: "demo-mumbai", name: "CollegePath Demo Institute — Mumbai", city: "Mumbai", state: "Maharashtra" },
    { slug: "demo-bengaluru", name: "CollegePath Demo Institute — Bengaluru", city: "Bengaluru", state: "Karnataka" },
    { slug: "demo-jaipur", name: "CollegePath Demo Institute — Jaipur", city: "Jaipur", state: "Rajasthan" },
  ];

  if (source) {
    const engineering = await prisma.courseCategory.findUniqueOrThrow({ where: { slug: "engineering-technology" } });
    for (const demo of demos) {
    const college = await prisma.college.upsert({
      where: { slug: demo.slug },
      update: { sourceId: source.id, verificationStatus: "DEMO", demoRecord: true },
      create: {
        slug: demo.slug,
        name: demo.name,
        description: "Fictional development record. College, admissions, fee, ranking, and outcome details are not real or verified.",
        institutionType: "OTHER",
        verificationStatus: "DEMO",
        demoRecord: true,
        sourceId: source.id,
        campuses: { create: { city: demo.city, state: demo.state } },
      },
    });

    const program = await prisma.program.upsert({
      where: { id: `${demo.slug}-btech-demo` },
      update: { verificationStatus: "DEMO" },
      create: {
        id: `${demo.slug}-btech-demo`,
        collegeId: college.id,
        name: "B.Tech — Demo listing only",
        degreeLevel: "UNDERGRADUATE",
        verificationStatus: "DEMO",
        categories: { create: { categoryId: engineering.id } },
      },
    });
      void program;
    }
  }

  const guides = [
    { slug: "build-a-shortlist", title: "Build a college shortlist", category: "College search", summary: "A structured way to compare options against your own priorities.", content: "Start with the course and degree level you want to investigate.\n\nWrite down hard constraints such as location, budget, and eligibility. Keep preferences separate from requirements.\n\nFor every college, record the source, academic year, and date you checked fees, admissions, and recognition. Ask the institution to confirm details that affect an application.\n\nKeep a balanced list of options you would genuinely consider. This guide does not estimate admission likelihood." },
    { slug: "compare-total-costs", title: "Compare education costs carefully", category: "Costs & planning", summary: "Look beyond tuition and label unknown expenses rather than guessing.", content: "Compare tuition for the same academic year and program. Check whether the figure is annual or for the full course.\n\nRecord compulsory fees separately. Add hostel or accommodation costs only when the institution publishes them for the relevant period.\n\nBudget for travel and living costs using your own estimates. Do not treat missing college data as zero. Confirm payment schedules and refund terms before accepting an offer." },
    { slug: "verify-admission-information", title: "Verify an admission notice", category: "Applications", summary: "Use official sources for important dates, eligibility, and application steps.", content: "Start from the institution’s official website or the relevant examination authority. Avoid relying on forwarded screenshots or third-party summaries for deadlines.\n\nCheck the admission year, program, campus, applicant category, and applicable entrance examination. Save the official source link and the date you checked it.\n\nIf two sources disagree, contact the institution or exam authority before taking action. CollegePath does not make official eligibility decisions." },
    { slug: "scholarship-checklist", title: "Prepare a scholarship checklist", category: "Financial aid", summary: "Track eligibility, deadlines, required evidence, and the official application source.", content: "For each scholarship, record the provider, official application URL, eligible program and year, deadline, required documents, and renewal conditions.\n\nConfirm whether funds are paid to the student or institution and whether the award can be combined with other support.\n\nDo not pay an application fee or share sensitive documents until you have verified the provider and application channel." },
  ];
  for (const guide of guides) {
    await prisma.admissionGuide.upsert({ where: { slug: guide.slug }, update: guide, create: { ...guide, published: true, publishedAt: new Date() } });
  }

  await prisma.counsellingService.upsert({
    where: { slug: "college-discovery-session" },
    update: { active: false },
    create: {
      slug: "college-discovery-session",
      name: "College discovery session",
      description: "A one-to-one conversation about your preferences and college search.",
      durationMinutes: 45,
      priceInr: null,
      deliverables: ["A written summary of discussed priorities"],
      cancellationPolicy: "To be configured by the CollegePath team before bookings are enabled.",
      active: false,
    },
  });
}

main()
  .then(() => console.info("Seeded clearly labelled development demo records."))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
