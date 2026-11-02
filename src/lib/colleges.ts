import { Prisma, type InstitutionType, type DegreeLevel } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CollegeSearch } from "@/lib/schemas";

export type CollegeCardData = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  institutionType: InstitutionType;
  managementType: string | null;
  demoRecord: boolean;
  verificationStatus: string;
  officialWebsite: string | null;
  officialAddress: string | null;
  officialDistrict: string | null;
  officialAdmissionUrl: string | null;
  lastVerifiedAt: Date | null;
  campuses: { city: string; state: string; hostelAvailable: boolean | null }[];
  programs: { id: string; name: string; degreeLevel: DegreeLevel; academicYear: string | null; categories: { category: { slug: string; name: string } }[] }[];
  feeRecords: { tuitionInr: number | null; compulsoryFeesInr: number | null; academicYear: string }[];
  rankings?: { rankingBody: string; category: string | null; rank: number | null; academicYear: string }[];
  source: { name: string; url: string | null; verificationStatus: string } | null;
};

function mapCollege(college: Awaited<ReturnType<typeof prisma.college.findMany>>[number] & {
  campuses: { city: string; state: string; hostelAvailable: boolean | null }[];
  programs: { id: string; name: string; degreeLevel: DegreeLevel; academicYear: string | null; categories: { category: { slug: string; name: string } }[] }[];
  feeRecords: { tuitionInr: Prisma.Decimal | null; compulsoryFeesInr: Prisma.Decimal | null; academicYear: string }[];
  rankings: { rankingBody: string; category: string | null; rank: number | null; academicYear: string }[];
  source: { name: string; url: string | null; verificationStatus: string } | null;
}): CollegeCardData {
  return {
    id: college.id,
    slug: college.slug,
    name: college.name,
    description: college.description,
    institutionType: college.institutionType,
    managementType: college.managementType,
    demoRecord: college.demoRecord,
    verificationStatus: college.verificationStatus,
    officialWebsite: college.officialWebsite,
    officialAddress: college.officialAddress,
    officialDistrict: college.officialDistrict,
    officialAdmissionUrl: college.officialAdmissionUrl,
    lastVerifiedAt: college.lastVerifiedAt,
    campuses: college.campuses,
    programs: college.programs,
    feeRecords: college.feeRecords.map(fee => ({
      tuitionInr: fee.tuitionInr?.toNumber() ?? null,
      compulsoryFeesInr: fee.compulsoryFeesInr?.toNumber() ?? null,
      academicYear: fee.academicYear,
    })),
    rankings: college.rankings,
    source: college.source,
  };
}

const collegeIncludes = {
  campuses: { select: { id: true, name: true, city: true, state: true, hostelAvailable: true, hostelLastVerifiedAt: true } },
  programs: {
    where: { verificationStatus: { in: ["VERIFIED", "DEMO"] } },
    select: { id: true, name: true, degreeLevel: true, academicYear: true, categories: { include: { category: { select: { slug: true, name: true } } } } },
  },
  feeRecords: {
    where: { verificationStatus: "VERIFIED" },
    orderBy: { academicYear: "desc" },
    select: { tuitionInr: true, compulsoryFeesInr: true, academicYear: true },
  },
  rankings: {
    where: { verificationStatus: "VERIFIED" },
    orderBy: [{ academicYear: "desc" }, { rank: "asc" }],
    select: { rankingBody: true, category: true, rank: true, academicYear: true },
  },
  source: { select: { name: true, url: true, verificationStatus: true } },
} satisfies Prisma.CollegeInclude;

export async function searchColleges(filters: CollegeSearch) {
  const and: Prisma.CollegeWhereInput[] = [];
  if (filters.query) {
    const shortQuery = filters.query.length <= 3;
    const query = filters.query.toLocaleLowerCase("en-IN");
    and.push({ OR: [
      { name: shortQuery ? { startsWith: filters.query, mode: "insensitive" } : { contains: filters.query, mode: "insensitive" } },
      { searchAliases: { has: query } },
      { officialAddress: { contains: filters.query, mode: "insensitive" } },
      { campuses: { some: { city: { contains: filters.query, mode: "insensitive" } } } },
      { campuses: { some: { state: { contains: filters.query, mode: "insensitive" } } } },
    ] });
  }
  if (filters.state) and.push({ OR: [
    { campuses: { some: { state: { equals: filters.state, mode: "insensitive" } } } },
    { officialState: { equals: filters.state, mode: "insensitive" } },
  ] });
  if (filters.category) and.push({ programs: { some: { categories: { some: { category: { slug: filters.category } } } } } });
  if (filters.type) and.push({ institutionType: filters.type });
  if (filters.degree) and.push({ programs: { some: { degreeLevel: filters.degree } } });
  if (filters.minFee !== undefined || filters.maxFee !== undefined) {
    and.push({ feeRecords: { some: {
      verificationStatus: "VERIFIED",
      ...(filters.minFee !== undefined ? { tuitionInr: { gte: new Prisma.Decimal(filters.minFee) } } : {}),
      ...(filters.maxFee !== undefined ? { tuitionInr: { lte: new Prisma.Decimal(filters.maxFee) } } : {}),
    } } });
  }

  const where: Prisma.CollegeWhereInput = {
    verificationStatus: { in: ["VERIFIED", "DEMO"] },
    ...(and.length ? { AND: and } : {}),
  };
  const take = 12;
  const [rows, total] = await Promise.all([
    prisma.college.findMany({
      where,
      include: collegeIncludes,
      orderBy: filters.sort === "recent" ? { updatedAt: "desc" } : { name: "asc" },
      skip: (filters.page - 1) * take,
      take,
    }),
    prisma.college.count({ where }),
  ]);
  return { colleges: rows.map(row => mapCollege(row)), total, page: filters.page, pageSize: take };
}

export async function getCollegeBySlug(slug: string) {
  const college = await prisma.college.findFirst({
    where: { slug, verificationStatus: { in: ["VERIFIED", "DEMO"] } },
    include: {
      ...collegeIncludes,
      programs: { where: { verificationStatus: { in: ["VERIFIED", "DEMO"] } }, orderBy: { name: "asc" }, include: { categories: { include: { category: { select: { slug: true, name: true } } } }, source: { select: { name: true, url: true } } } },
      feeRecords: { where: { verificationStatus: "VERIFIED" }, orderBy: { academicYear: "desc" } },
      feeSchedules: { where: { verificationStatus: "VERIFIED" }, orderBy: { academicYear: "desc" }, include: { source: { select: { name: true, url: true } } } },
      rankings: { where: { verificationStatus: "VERIFIED" }, orderBy: { academicYear: "desc" }, include: { source: true } },
      placements: { where: { verificationStatus: "VERIFIED" }, orderBy: { reportingYear: "desc" }, include: { source: true } },
      accreditations: { where: { verificationStatus: "VERIFIED" }, include: { source: true } },
      scholarships: { where: { verificationStatus: "VERIFIED" }, include: { source: true } },
    },
  });
  if (!college) return null;
  return {
    ...college,
    feeRecords: college.feeRecords.map(fee => ({ ...fee, tuitionInr: fee.tuitionInr?.toNumber() ?? null, compulsoryFeesInr: fee.compulsoryFeesInr?.toNumber() ?? null, hostelInr: fee.hostelInr?.toNumber() ?? null })),
  };
}
