import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { statesInOfficialAddress } from "@/lib/catalog-options";
import { collegeSearchAliases } from "@/lib/college-search";

type JoSaaProgram = { code: string; name: string };
type JoSaaInstitution = { code: number; name: string; address: string | null; website: string | null; sourceUrl: string; profileAvailable: boolean; programs: JoSaaProgram[]; feeScheduleText: string | null };
type Snapshot = { academicYear: string; fetchedAt: string; institutionCount: number; programCount: number; feeScheduleCount: number; institutions: JoSaaInstitution[] };

function normalizeName(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function categoriesFor(name: string) {
  const normalized = name.toLowerCase();
  if (/\bbachelor of architecture\b|\bb\.?arch\.?\b|\bbachelor of planning\b|\bb\.?plan\.?\b/.test(normalized)) return ["design-architecture"];
  if (/\bbachelor of technology\b|\bbachelor of engineering\b|\bb\.?tech\.?\b|\bb\.?e\.?\b|\bintegrated master of technology\b/.test(normalized)) return ["engineering-technology"];
  if (/\bbachelor of science\b|\bmaster of science\b|\bintegrated master of science\b|\bb\.?s\.?\b|\bb\.?sc\.?\b|\bm\.?sc\.?\b/.test(normalized)) return ["science"];
  if (/management|\bmba\b|business administration/.test(normalized)) return ["management-business"];
  if (/law|\bll\.?b\b/.test(normalized)) return ["law"];
  if (/computer application|\bmca\b/.test(normalized)) return ["computer-applications"];
  return ["engineering-technology"];
}

export async function seedJoSAA2026() {
  const file = join(process.cwd(), "prisma", "seed-data", "josaa-2026.json");
  const snapshot = JSON.parse(await readFile(file, "utf8")) as Snapshot;
  if (snapshot.academicYear !== "2026-27" || snapshot.institutionCount !== 138 || snapshot.institutions.length !== 138 || snapshot.programCount < 900) {
    throw new Error("The JoSAA data snapshot is incomplete or has an unexpected academic year; refusing to seed it.");
  }

  const categories = await prisma.courseCategory.findMany({ select: { id: true, slug: true } });
  const categoryIds = new Map(categories.map(category => [category.slug, category.id]));
  const requiredCategories = new Set(snapshot.institutions.flatMap(institution => institution.programs.flatMap(program => categoriesFor(program.name))));
  if ([...requiredCategories].some(slug => !categoryIds.has(slug))) throw new Error("A course category used by the JoSAA data snapshot is missing.");

  const existingColleges = await prisma.college.findMany({ where: { demoRecord: false }, select: { id: true, name: true, slug: true, officialWebsite: true, officialAddress: true, officialState: true, searchAliases: true } });
  const collegesByName = new Map(existingColleges.map(college => [normalizeName(college.name), college]));
  const checkedAt = new Date(snapshot.fetchedAt);
  let createdColleges = 0;
  let updatedPrograms = 0;
  let verifiedFeeSchedules = 0;
  const stateMappedInstitutions = snapshot.institutions.filter(institution => statesInOfficialAddress([institution.address, institution.name].filter(Boolean).join("\n")).length > 0).length;

  for (const institution of snapshot.institutions) {
    const officialState = statesInOfficialAddress([institution.address, institution.name].filter(Boolean).join("\n"))[0] ?? null;
    const sourceId = `josaa-2026-${institution.code}-source`;
    const source = await prisma.dataSource.upsert({
      where: { id: sourceId },
      update: { name: `JoSAA ${snapshot.academicYear} profile: ${institution.name}`, sourceType: "OFFICIAL_ADMISSIONS", url: institution.sourceUrl, verificationStatus: "VERIFIED", checkedAt, reviewerNotes: institution.profileAvailable ? `Official JoSAA ${snapshot.academicYear} institute profile. Program names and entry duration are transcribed from the program-wise seat matrix. Fee schedule text, when present, is preserved as published.` : "Official JoSAA institute directory record. The profile did not publish a program table in the captured response." },
      create: { id: sourceId, name: `JoSAA ${snapshot.academicYear} profile: ${institution.name}`, sourceType: "OFFICIAL_ADMISSIONS", url: institution.sourceUrl, verificationStatus: "VERIFIED", checkedAt, reviewerNotes: institution.profileAvailable ? `Official JoSAA ${snapshot.academicYear} institute profile. Program names and entry duration are transcribed from the program-wise seat matrix. Fee schedule text, when present, is preserved as published.` : "Official JoSAA institute directory record. The profile did not publish a program table in the captured response." },
    });

    let college = collegesByName.get(normalizeName(institution.name));
    const searchAliases = collegeSearchAliases(institution.name);
    const existingSearchAliases = college?.searchAliases ?? [];
    const missingSearchAlias = searchAliases.some(alias => !existingSearchAliases.includes(alias));
    if (college) {
      if ((!college.officialWebsite && institution.website) || (!college.officialAddress && institution.address) || (!college.officialState && officialState) || missingSearchAlias) {
        college = await prisma.college.update({ where: { id: college.id }, data: { officialWebsite: college.officialWebsite ?? institution.website, officialAddress: college.officialAddress ?? institution.address, officialState: college.officialState ?? officialState, searchAliases }, select: { id: true, name: true, slug: true, officialWebsite: true, officialAddress: true, officialState: true, searchAliases: true } });
        collegesByName.set(normalizeName(institution.name), college);
      }
    } else {
      const slug = `josaa-2026-${institution.code}`;
      college = await prisma.college.upsert({
        where: { slug },
        update: { name: institution.name, officialWebsite: institution.website, officialAddress: institution.address, officialState, searchAliases, verificationStatus: "VERIFIED", demoRecord: false, sourceId: source.id, lastVerifiedAt: checkedAt },
        create: { slug, name: institution.name, searchAliases, description: `Participates in the JoSAA ${snapshot.academicYear} national admission process. Program and fee facts are listed only when linked to an official JoSAA or institution source.`, institutionType: "OTHER", officialWebsite: institution.website, officialAddress: institution.address, officialState, verificationStatus: "VERIFIED", demoRecord: false, sourceId: source.id, lastVerifiedAt: checkedAt },
        select: { id: true, name: true, slug: true, officialWebsite: true, officialAddress: true, officialState: true, searchAliases: true },
      });
      collegesByName.set(normalizeName(institution.name), college);
      createdColleges++;
    }

    for (const program of institution.programs) {
      const durationYears = Number(program.name.match(/\((\d+) Years?,/i)?.[1]) || null;
      const name = program.name.replace(/\s*\(\d+ Years?,[^)]*\)\s*$/i, "").replace(/\s+/g, " ").trim();
      const id = `josaa-2026-${institution.code}-${program.code}`;
      const programData = {
        collegeId: college.id,
        name,
        degreeLevel: "UNDERGRADUATE" as const,
        durationYears,
        academicYear: snapshot.academicYear,
        description: `JoSAA academic program code ${program.code}, published for the ${snapshot.academicYear} seat matrix. See the linked official profile for seat and admission details.`,
        admissionMode: "ENTRANCE_EXAM" as const,
        sourceId: source.id,
        verificationStatus: "VERIFIED" as const,
        lastVerifiedAt: checkedAt,
      };
      const slugs = categoriesFor(name);
      await prisma.program.upsert({
        where: { id },
        update: { ...programData, categories: { deleteMany: {}, create: slugs.map(slug => ({ categoryId: categoryIds.get(slug)! })) } },
        create: { id, ...programData, categories: { create: slugs.map(slug => ({ categoryId: categoryIds.get(slug)! })) } },
      });
      updatedPrograms++;
    }

    const scheduleId = `josaa-2026-${institution.code}-fees`;
    if (institution.feeScheduleText) {
      await prisma.feeSchedule.upsert({
        where: { id: scheduleId },
        update: { collegeId: college.id, academicYear: snapshot.academicYear, publishedText: institution.feeScheduleText, sourceId: source.id, verificationStatus: "VERIFIED", lastVerifiedAt: checkedAt },
        create: { id: scheduleId, collegeId: college.id, academicYear: snapshot.academicYear, publishedText: institution.feeScheduleText, sourceId: source.id, verificationStatus: "VERIFIED", lastVerifiedAt: checkedAt },
      });
      verifiedFeeSchedules++;
    } else {
      await prisma.feeSchedule.updateMany({ where: { id: scheduleId }, data: { verificationStatus: "NEEDS_UPDATE" } });
    }
  }

  console.info(`JoSAA ${snapshot.academicYear}: ${snapshot.institutionCount} institutes, ${stateMappedInstitutions} address-mapped states/UTs, ${createdColleges} new college profiles, ${updatedPrograms} sourced programs, ${verifiedFeeSchedules} current published fee panels.`);
}
