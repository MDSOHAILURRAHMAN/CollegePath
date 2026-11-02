import { prisma } from "@/lib/prisma";
import { collegeSearchAliases } from "@/lib/college-search";

const checkedAt = new Date("2026-11-02T00:00:00.000Z");
const programs: { name: string; locations: string[] }[] = [
  { name: "B.Tech - Biotechnology", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Chemical Engineering", locations: ["Vellore"] },
  { name: "B.Tech - Civil Engineering", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Civil Engineering (in collaboration with L&T)", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Computer Science and Engineering", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Computer Science and Engineering (Artificial Intelligence and Data Engineering)", locations: ["Vellore"] },
  { name: "B.Tech - Computer Science and Engineering (Artificial Intelligence and Machine Learning)", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Computer Science and Engineering (Artificial Intelligence and Robotics)", locations: ["Chennai"] },
  { name: "B.Tech - Computer Science and Engineering (Artificial Intelligence and Data Science)", locations: ["Chennai"] },
  { name: "B.Tech - Computer Science and Engineering (Bioinformatics)", locations: ["Vellore"] },
  { name: "B.Tech - Computer Science and Engineering and Business Systems (in collaboration with TCS)", locations: ["Vellore"] },
  { name: "B.Tech - Computer Science and Engineering (Cyber Security)", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Computer Science and Engineering (Cyber Security) (2+2 dual degree with Deakin University)", locations: ["Chennai"] },
  { name: "B.Tech - Computer Science and Engineering (Data Science)", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Computer Science and Engineering (Quantum Computing)", locations: ["Chennai"] },
  { name: "B.Tech - Electrical and Electronics Engineering", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Electrical and Computer Science Engineering", locations: ["Chennai"] },
  { name: "B.Tech - Electronics and Computer Engineering", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Electronics and Communication Engineering", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Electronics Engineering (VLSI Design and Technology)", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Electronics and Instrumentation Engineering", locations: ["Vellore"] },
  { name: "B.Tech - Fashion Technology", locations: ["Chennai"] },
  { name: "B.Tech - Health Sciences and Technology", locations: ["Vellore"] },
  { name: "B.Tech - Information Technology", locations: ["Vellore"] },
  { name: "B.Tech - Mechanical Engineering", locations: ["Vellore", "Chennai"] },
  { name: "B.Tech - Mechanical Engineering (Electric Vehicles)", locations: ["Chennai"] },
  { name: "B.Tech - Mechatronics and Automation", locations: ["Chennai"] },
];

export async function seedVIT2027() {
  const college = await prisma.college.findUnique({ where: { slug: "nirf-university-vellore-institute-of-technology" }, select: { id: true } });
  if (!college) throw new Error("The NIRF VIT record is missing; seed the NIRF directory before VIT programs.");

  const institutionSource = await prisma.dataSource.upsert({
    where: { id: "vit-official-institution-source" },
    update: { name: "Vellore Institute of Technology institutional disclosure", sourceType: "OFFICIAL_WEBSITE", url: "https://chennai.vit.ac.in/mhrd-ugc-aicte-2/", verificationStatus: "VERIFIED", checkedAt, reviewerNotes: "VIT's official disclosure identifies it as a private institution. The UGC listing records VIT's Vellore address and Chennai off-campus." },
    create: { id: "vit-official-institution-source", name: "Vellore Institute of Technology institutional disclosure", sourceType: "OFFICIAL_WEBSITE", url: "https://chennai.vit.ac.in/mhrd-ugc-aicte-2/", verificationStatus: "VERIFIED", checkedAt, reviewerNotes: "VIT's official disclosure identifies it as a private institution. The UGC listing records VIT's Vellore address and Chennai off-campus." },
  });
  const programSource = await prisma.dataSource.upsert({
    where: { id: "vit-2027-program-source" },
    update: { name: "VIT 2027-28 official undergraduate program list", sourceType: "OFFICIAL_ADMISSIONS", url: "https://vit.ac.in/admissions/programmes-offered", verificationStatus: "VERIFIED", checkedAt, reviewerNotes: "Program names and Vellore/Chennai locations are transcribed from VIT's official 2027-28 program list. This seed includes only listed B.Tech programs offered at VIT Vellore or VIT Chennai; VIT-AP, VIT-Bhopal, and Mauritius-only programs are excluded." },
    create: { id: "vit-2027-program-source", name: "VIT 2027-28 official undergraduate program list", sourceType: "OFFICIAL_ADMISSIONS", url: "https://vit.ac.in/admissions/programmes-offered", verificationStatus: "VERIFIED", checkedAt, reviewerNotes: "Program names and Vellore/Chennai locations are transcribed from VIT's official 2027-28 program list. This seed includes only listed B.Tech programs offered at VIT Vellore or VIT Chennai; VIT-AP, VIT-Bhopal, and Mauritius-only programs are excluded." },
  });

  await prisma.college.update({
    where: { id: college.id },
    data: {
      name: "Vellore Institute of Technology",
      aisheCode: "U-0490",
      institutionType: "PRIVATE",
      managementType: "Deemed University-Private",
      officialWebsite: "https://vit.ac.in/",
      officialAdmissionUrl: "https://viteee.vit.ac.in/",
      officialAddress: "Tiruvalam Road, Katpadi, Vellore, Tamil Nadu",
      officialState: "Tamil Nadu",
      searchAliases: collegeSearchAliases("Vellore Institute of Technology"),
      description: "Private institution with deemed-to-be-university status. The listed 2027-28 B.Tech programs are sourced from VIT and limited here to its Vellore and Chennai campuses.",
      sourceId: institutionSource.id,
      verificationStatus: "VERIFIED",
      lastVerifiedAt: checkedAt,
    },
  });

  for (const campus of [
    { id: "nirf-university-vellore-institute-of-technology-campus", name: "Vellore Campus", city: "Vellore" },
    { id: "vit-chennai-campus", name: "Chennai Campus", city: "Chennai" },
  ]) {
    await prisma.campus.upsert({
      where: { id: campus.id },
      update: { collegeId: college.id, name: campus.name, city: campus.city, state: "Tamil Nadu" },
      create: { ...campus, collegeId: college.id, state: "Tamil Nadu" },
    });
  }

  const engineering = await prisma.courseCategory.findUniqueOrThrow({ where: { slug: "engineering-technology" } });
  for (const program of programs) {
    const slug = program.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const id = `vit-2027-${slug}`;
    const programData = {
      collegeId: college.id,
      name: program.name,
      degreeLevel: "UNDERGRADUATE" as const,
      academicYear: "2027-28",
      description: `Offered at VIT ${program.locations.join(" and ")}. Listed on VIT's official 2027-28 admissions page.`,
      admissionMode: "ENTRANCE_EXAM" as const,
      sourceId: programSource.id,
      verificationStatus: "VERIFIED" as const,
      lastVerifiedAt: checkedAt,
    };
    await prisma.program.upsert({
      where: { id },
      update: { ...programData, categories: { deleteMany: {}, create: { categoryId: engineering.id } } },
      create: { id, ...programData, categories: { create: { categoryId: engineering.id } } },
    });
  }

  console.info(`VIT: ${programs.length} official 2027-28 B.Tech listings for its Vellore and Chennai campuses.`);
}
