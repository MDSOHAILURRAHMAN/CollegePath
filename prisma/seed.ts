import { prisma } from "@/lib/prisma";
import { collegeSearchAliases } from "@/lib/college-search";
import { seedJoSAA2026 } from "./seed-josaa-2026";
import { seedVIT2027 } from "./seed-vit-2027";
import { seedAisheDirectory } from "./seed-aishe-colleges";

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
        searchAliases: collegeSearchAliases(institution.name),
        institutionType: "OTHER",
        description: "Listed in the NIRF India Rankings 2025. Other institutional details have not been verified in this dataset.",
        verificationStatus: "VERIFIED",
        demoRecord: false,
        lastVerifiedAt: nirfVerifiedAt,
        sourceId,
      },
      create: {
        slug: institution.slug,
        name: institution.name,
        searchAliases: collegeSearchAliases(institution.name),
        institutionType: "OTHER",
        description: "Listed in the NIRF India Rankings 2025. Other institutional details have not been verified in this dataset.",
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
  const nirfUniversityTopHundred = [
    { name: "Indian Institute of Science", city: "Bengaluru", state: "Karnataka", rank: 1 },
    { name: "Jawaharlal Nehru University", city: "New Delhi", state: "Delhi", rank: 2 },
    { name: "Manipal Academy of Higher Education", city: "Manipal", state: "Karnataka", rank: 3 },
    { name: "Jamia Millia Islamia", city: "New Delhi", state: "Delhi", rank: 4 },
    { name: "University of Delhi", city: "Delhi", state: "Delhi", rank: 5 },
    { name: "Banaras Hindu University", city: "Varanasi", state: "Uttar Pradesh", rank: 6 },
    { name: "Birla Institute of Technology & Science, Pilani", city: "Pilani", state: "Rajasthan", rank: 7 },
    { name: "Amrita Vishwa Vidyapeetham", city: "Coimbatore", state: "Tamil Nadu", rank: 8 },
    { name: "Jadavpur University", city: "Kolkata", state: "West Bengal", rank: 9 },
    { name: "Aligarh Muslim University", city: "Aligarh", state: "Uttar Pradesh", rank: 10 },
    { name: "S. R. M. Institute of Science and Technology", city: "Chennai", state: "Tamil Nadu", rank: 11 },
    { name: "Homi Bhabha National Institute", city: "Mumbai", state: "Maharashtra", rank: 12 },
    { name: "Saveetha Institute of Medical and Technical Sciences", city: "Chennai", state: "Tamil Nadu", rank: 13 },
    { name: "Vellore Institute of Technology", city: "Vellore", state: "Tamil Nadu", rank: 14 },
    { name: "Siksha 'O' Anusandhan", city: "Bhubaneswar", state: "Odisha", rank: 15 },
    { name: "Indian Agricultural Research Institute", city: "New Delhi", state: "Delhi", rank: 16 },
    { name: "Kalinga Institute of Industrial Technology", city: "Bhubaneswar", state: "Odisha", rank: 17 },
    { name: "University of Hyderabad", city: "Hyderabad", state: "Telangana", rank: 18 },
    { name: "Chandigarh University", city: "Mohali", state: "Punjab", rank: 19 },
    { name: "Anna University", city: "Chennai", state: "Tamil Nadu", rank: 20 },
    { name: "JSS Academy of Higher Education and Research", city: "Mysuru", state: "Karnataka", rank: 21 },
    { name: "Amity University", city: "Gautam Budh Nagar", state: "Uttar Pradesh", rank: 22 },
    { name: "Andhra University", city: "Visakhapatnam", state: "Andhra Pradesh", rank: 23 },
    { name: "Symbiosis International", city: "Pune", state: "Maharashtra", rank: 24 },
    { name: "Kerala University", city: "Thiruvananthapuram", state: "Kerala", rank: 25 },
    { name: "Thapar Institute of Engineering and Technology", city: "Patiala", state: "Punjab", rank: 26 },
    { name: "Koneru Lakshmaiah Education Foundation University", city: "Vaddeswaram", state: "Andhra Pradesh", rank: 26 },
    { name: "Kalasalingam Academy of Research and Education", city: "Krishnan Koil", state: "Tamil Nadu", rank: 28 },
    { name: "Shanmugha Arts Science Technology & Research Academy", city: "Thanjavur", state: "Tamil Nadu", rank: 29 },
    { name: "Osmania University", city: "Hyderabad", state: "Telangana", rank: 30 },
    { name: "Lovely Professional University", city: "Phagwara", state: "Punjab", rank: 31 },
    { name: "Cochin University of Science and Technology", city: "Cochin", state: "Kerala", rank: 32 },
    { name: "Gauhati University", city: "Guwahati", state: "Assam", rank: 33 },
    { name: "University of Kashmir", city: "Srinagar", state: "Jammu and Kashmir", rank: 34 },
    { name: "Panjab University", city: "Chandigarh", state: "Chandigarh", rank: 35 },
    { name: "Bharathidasan University", city: "Tiruchirappalli", state: "Tamil Nadu", rank: 36 },
    { name: "Babasaheb Bhimrao Ambedkar University", city: "Lucknow", state: "Uttar Pradesh", rank: 37 },
    { name: "University of Madras", city: "Chennai", state: "Tamil Nadu", rank: 38 },
    { name: "Calcutta University", city: "Kolkata", state: "West Bengal", rank: 39 },
    { name: "Institute of Chemical Technology", city: "Mumbai", state: "Maharashtra", rank: 40 },
    { name: "Dr. D. Y. Patil Vidyapeeth", city: "Pune", state: "Maharashtra", rank: 41 },
    { name: "Delhi Technological University", city: "New Delhi", state: "Delhi", rank: 42 },
    { name: "Mahatma Gandhi University", city: "Kottayam", state: "Kerala", rank: 43 },
    { name: "Alagappa University", city: "Karaikudi", state: "Tamil Nadu", rank: 44 },
    { name: "UPES", city: "Dehradun", state: "Uttarakhand", rank: 45 },
    { name: "Bharathiar University", city: "Coimbatore", state: "Tamil Nadu", rank: 46 },
    { name: "Jamia Hamdard", city: "New Delhi", state: "Delhi", rank: 47 },
    { name: "Graphic Era University", city: "Dehradun", state: "Uttarakhand", rank: 48 },
    { name: "Datta Meghe Institute of Higher Education and Research", city: "Wardha", state: "Maharashtra", rank: 49 },
    { name: "King George's Medical University", city: "Lucknow", state: "Uttar Pradesh", rank: 50 },
    { name: "University of Jammu", city: "Jammu", state: "Jammu and Kashmir", rank: 51 },
    { name: "SVKM's Narsee Monjee Institute of Management Studies", city: "Mumbai", state: "Maharashtra", rank: 52 },
    { name: "Sathyabama Institute of Science and Technology", city: "Chennai", state: "Tamil Nadu", rank: 53 },
    { name: "Mumbai University", city: "Mumbai", state: "Maharashtra", rank: 54 },
    { name: "International Institute of Information Technology Hyderabad", city: "Hyderabad", state: "Telangana", rank: 55 },
    { name: "Savitribai Phule Pune University", city: "Pune", state: "Maharashtra", rank: 56 },
    { name: "Shiv Nadar University", city: "Gautam Buddha Nagar", state: "Uttar Pradesh", rank: 57 },
    { name: "Manipal University Jaipur", city: "Jaipur", state: "Rajasthan", rank: 58 },
    { name: "Bharati Vidyapeeth", city: "Pune", state: "Maharashtra", rank: 59 },
    { name: "Sri Ramachandra Institute of Higher Education and Research", city: "Chennai", state: "Tamil Nadu", rank: 60 },
    { name: "Chettinad Academy of Research and Education", city: "Kelambakkam, Chengalpattu District", state: "Tamil Nadu", rank: 61 },
    { name: "Jain University", city: "Bengaluru", state: "Karnataka", rank: 62 },
    { name: "Christ University", city: "Bengaluru", state: "Karnataka", rank: 63 },
    { name: "Punjab Agricultural University", city: "Ludhiana", state: "Punjab", rank: 64 },
    { name: "Bangalore University", city: "Bengaluru", state: "Karnataka", rank: 65 },
    { name: "Banasthali Vidyapith", city: "Banasthali", state: "Rajasthan", rank: 66 },
    { name: "Sri Balaji Vidyapeeth Mahatma Gandhi Medical College Campus", city: "Puducherry", state: "Pondicherry", rank: 67 },
    { name: "Madan Mohan Malaviya University of Technology", city: "Gorakhpur", state: "Uttar Pradesh", rank: 68 },
    { name: "Shoolini University of Biotechnology and Management Sciences", city: "Solan", state: "Himachal Pradesh", rank: 69 },
    { name: "Vignan's Foundation for Science, Technology and Research", city: "Guntur", state: "Andhra Pradesh", rank: 70 },
    { name: "Mysore University", city: "Mysuru", state: "Karnataka", rank: 71 },
    { name: "Tata Institute of Social Sciences", city: "Mumbai", state: "Maharashtra", rank: 72 },
    { name: "Tamil Nadu Agricultural University", city: "Coimbatore", state: "Tamil Nadu", rank: 73 },
    { name: "Gujarat University", city: "Ahmedabad", state: "Gujarat", rank: 74 },
    { name: "Sher-e-Kashmir University of Agricultural Science & Technology of Kashmir", city: "Srinagar", state: "Jammu and Kashmir", rank: 75 },
    { name: "Bharath Institute of Higher Education & Research", city: "Chennai", state: "Tamil Nadu", rank: 76 },
    { name: "Central University of Punjab", city: "Bathinda", state: "Punjab", rank: 77 },
    { name: "Chitkara University", city: "Rajpura", state: "Punjab", rank: 78 },
    { name: "Tezpur University", city: "Tezpur", state: "Assam", rank: 79 },
    { name: "NITTE", city: "Mangaluru", state: "Karnataka", rank: 80 },
    { name: "Jawaharlal Nehru Technological University", city: "Hyderabad", state: "Telangana", rank: 81 },
    { name: "Mizoram University", city: "Aizawl", state: "Mizoram", rank: 82 },
    { name: "Central University of Tamil Nadu", city: "Tiruvarur", state: "Tamil Nadu", rank: 83 },
    { name: "Acharya Nagarjuna University", city: "Guntur", state: "Andhra Pradesh", rank: 84 },
    { name: "Maharishi Markandeshwar", city: "Ambala", state: "Haryana", rank: 85 },
    { name: "Madurai Kamaraj University", city: "Madurai", state: "Tamil Nadu", rank: 85 },
    { name: "Sharda University", city: "Greater Noida", state: "Uttar Pradesh", rank: 87 },
    { name: "Gandhi Institute of Technology And Management (GITAM)", city: "Visakhapatnam", state: "Andhra Pradesh", rank: 88 },
    { name: "Central University of Rajasthan", city: "Kishangarh", state: "Rajasthan", rank: 89 },
    { name: "Sant Longowal Institute of Engineering & Technology", city: "Longowal", state: "Punjab", rank: 90 },
    { name: "Padmashree Dr. D. Y. Patil Vidyapeeth", city: "Mumbai", state: "Maharashtra", rank: 91 },
    { name: "Birla Institute of Technology", city: "Ranchi", state: "Jharkhand", rank: 92 },
    { name: "Guru Gobind Singh Indraprastha University", city: "New Delhi", state: "Delhi", rank: 93 },
    { name: "Periyar University", city: "Salem", state: "Tamil Nadu", rank: 94 },
    { name: "University of Agricultural Sciences", city: "Bengaluru", state: "Karnataka", rank: 95 },
    { name: "Manav Rachna International Institute of Research & Studies", city: "Faridabad", state: "Haryana", rank: 96 },
    { name: "Assam University-Silchar", city: "Silchar", state: "Assam", rank: 97 },
    { name: "University of Lucknow", city: "Lucknow", state: "Uttar Pradesh", rank: 98 },
    { name: "Avinashilingam Institute for Home Science & Higher Education for Women", city: "Coimbatore", state: "Tamil Nadu", rank: 99 },
    { name: "IIIT-Delhi (Indraprastha Institute of Information Technology Delhi)", city: "New Delhi", state: "Delhi", rank: 100 },
  ] as const;
  const canonicalUniversitySlugs: Record<string, string> = {
    "Indian Institute of Science": "nirf-ir-o-u-0220",
    "Jawaharlal Nehru University": "nirf-ir-o-u-0109",
    "Manipal Academy of Higher Education": "nirf-manipal-academy-of-higher-education",
    "Jamia Millia Islamia": "nirf-ir-o-u-0108",
    "University of Delhi": "nirf-university-of-delhi",
    "Banaras Hindu University": "nirf-ir-o-u-0500",
    "Birla Institute of Technology & Science, Pilani": "nirf-birla-institute-of-technology-and-science",
    "Amrita Vishwa Vidyapeetham": "nirf-amrita-vishwa-vidyapeetham",
    "Jadavpur University": "nirf-jadavpur-university",
    "Aligarh Muslim University": "nirf-aligarh-muslim-university",
  };
  for (const institution of nirfUniversityTopHundred) {
    const normalizedName = institution.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const slug = canonicalUniversitySlugs[institution.name] ?? `nirf-university-${normalizedName}`;
    await seedNirfRanking({ ...institution, slug, category: "Universities" }, universitySource.id);
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
  await seedJoSAA2026();
  await seedVIT2027();
  await seedAisheDirectory();
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
  .then(() => console.info(process.env.NODE_ENV === "production" ? "Production seed excludes demo records." : "Seeded clearly labelled development demo records."))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
