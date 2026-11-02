import { gunzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { collegeSearchAliases } from "@/lib/college-search";
import type { InstitutionType, Prisma } from "@/generated/prisma/client";

type AisheInstitution = {
  aisheCode: string;
  name: string;
  stateName: string;
  districtName: string | null;
  managementType: string;
  institutionCategory: string | null;
  address: string | null;
  officialWebsite: string | null;
  yearOfEstablishment: string | null;
  relatedAisheCodes?: string[];
};

type AisheSnapshot = {
  snapshotCapturedAt: string;
  collegeSourceRecordCount: number;
  universitySourceRecordCount: number;
  sourceRecordCount: number;
  importedSourceRowCount: number;
  duplicateCrossListCount: number;
  importedRecordCount: number;
  managementMapping: { government: string[]; private: string[] };
  records: AisheInstitution[];
};

const governmentManagement = new Set([
  "State Government", "Central Government", "Local Body",
  "State Public University", "Institute of National Importance", "Central University",
  "Deemed University-Government", "State Open University", "Deemed University-Government Aided",
  "Institute under State Legislature Act", "Central Open University",
]);
const privateManagement = new Set([
  "Private Aided (Government Aided)", "Private Un-Aided", "State Private University",
  "Deemed University-Private", "State Private Open University",
]);
const batchSize = 1000;

function normalizeName(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function normalizedWebsite(value: string | null) {
  if (!value?.trim()) return null;
  const website = value.trim();
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(website) ? website : `https://${website}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".") || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function collegeType(managementType: string): InstitutionType {
  if (governmentManagement.has(managementType)) return "GOVERNMENT";
  if (privateManagement.has(managementType)) return "PRIVATE";
  throw new Error(`Unsupported AISHE management type: ${managementType}`);
}

export async function seedAisheDirectory() {
  const file = join(process.cwd(), "prisma", "seed-data", "aishe-institutions.json.gz");
  const snapshot = JSON.parse(gunzipSync(await readFile(file)).toString("utf8")) as AisheSnapshot;
  if (
    snapshot.snapshotCapturedAt !== "2026-11-02" ||
    snapshot.collegeSourceRecordCount !== 53366 ||
    snapshot.universitySourceRecordCount !== 1400 ||
    snapshot.sourceRecordCount !== 54766 ||
    snapshot.importedSourceRowCount !== 51952 ||
    snapshot.duplicateCrossListCount !== 4 ||
    snapshot.importedRecordCount !== 51948 ||
    snapshot.records.length !== snapshot.importedRecordCount ||
    new Set(snapshot.records.map(record => record.aisheCode)).size !== snapshot.records.length
  ) {
    throw new Error("The AISHE directory snapshot is incomplete or has an unexpected capture date; refusing to seed it.");
  }

  const checkedAt = new Date(`${snapshot.snapshotCapturedAt}T00:00:00.000Z`);
  const source = await prisma.dataSource.upsert({
    where: { id: "aishe-college-directory-2026-source" },
    update: {
      name: "AISHE Higher Education Institution Directory — College snapshot",
      sourceType: "GOVERNMENT_DIRECTORY",
      url: "https://dashboard.aishe.gov.in/hedirectory/#/institutionDirectory",
      verificationStatus: "VERIFIED",
      checkedAt,
      reviewerNotes: "Snapshot captured 2026-11-02 from the AISHE Higher Education Institution Directory extract: 53,366 college rows and 1,400 university rows, of which 51,952 have an explicit Government or Private classification. Government college labels include State Government, Central Government, and Local Body; private college labels include Private Aided (Government Aided) and Private Un-Aided. University classifications are retained as published by AISHE, including State Public/Private, Central, Deemed, and Institute of National Importance. The 2,814 college rows with an unclassified or 'University' management label are excluded. The extraction request uses AISHE survey year 2020. This source supplies institution identity and management only, not verified programs or fees. See prisma/seed-data/AISHE-SOURCE.md for provenance.",
    },
    create: {
      id: "aishe-college-directory-2026-source",
      name: "AISHE Higher Education Institution Directory — College snapshot",
      sourceType: "GOVERNMENT_DIRECTORY",
      url: "https://dashboard.aishe.gov.in/hedirectory/#/institutionDirectory",
      verificationStatus: "VERIFIED",
      checkedAt,
      reviewerNotes: "Snapshot captured 2026-11-02 from the AISHE Higher Education Institution Directory extract: 53,366 college rows and 1,400 university rows, of which 51,952 have an explicit Government or Private classification. Government college labels include State Government, Central Government, and Local Body; private college labels include Private Aided (Government Aided) and Private Un-Aided. University classifications are retained as published by AISHE, including State Public/Private, Central, Deemed, and Institute of National Importance. The 2,814 college rows with an unclassified or 'University' management label are excluded. The extraction request uses AISHE survey year 2020. This source supplies institution identity and management only, not verified programs or fees. See prisma/seed-data/AISHE-SOURCE.md for provenance.",
    },
  });

  const existing = await prisma.college.findMany({
    where: { demoRecord: false },
    select: {
      id: true,
      slug: true,
      aisheCode: true,
      name: true,
      officialState: true,
      officialDistrict: true,
      officialAddress: true,
      officialWebsite: true,
      institutionType: true,
      managementType: true,
      searchAliases: true,
      sourceId: true,
      lastVerifiedAt: true,
      verificationStatus: true,
    },
  });
  const existingByCode = new Map(existing.flatMap(college => college.aisheCode ? [[college.aisheCode, college] as const] : []));
  const existingByNameAndState = new Map(existing.flatMap(college => college.officialState
    ? [[`${normalizeName(college.name)}|${normalizeName(college.officialState)}`, college] as const]
    : []));
  const occupiedSlugs = new Set(existing.map(college => college.slug));
  const recordsToCreate: Prisma.CollegeCreateManyInput[] = [];
  const recordsToUpdate: { id: string; data: Prisma.CollegeUpdateInput }[] = [];

  for (const record of snapshot.records) {
    const type = collegeType(record.managementType);
    const aliases = collegeSearchAliases(record.name);
    const existingCollege = [record.aisheCode, ...(record.relatedAisheCodes ?? [])]
      .map(code => existingByCode.get(code))
      .find((college): college is (typeof existing)[number] => Boolean(college))
      ?? (() => {
        const possibleMatch = existingByNameAndState.get(`${normalizeName(record.name)}|${normalizeName(record.stateName)}`);
        return possibleMatch?.aisheCode ? undefined : possibleMatch;
      })();
    const website = normalizedWebsite(record.officialWebsite);

    if (existingCollege) {
      const mergedAliases = [...new Set([...existingCollege.searchAliases, ...aliases])];
      const data: Prisma.CollegeUpdateInput = {
        aisheCode: record.aisheCode,
        name: existingCollege.aisheCode ? record.name : existingCollege.name,
        searchAliases: mergedAliases,
        institutionType: type,
        managementType: record.managementType,
        officialDistrict: existingCollege.officialDistrict ?? record.districtName,
        officialAddress: existingCollege.officialAddress ?? record.address,
        officialState: existingCollege.officialState ?? record.stateName,
        officialWebsite: existingCollege.officialWebsite ?? website,
        source: { connect: { id: source.id } },
        verificationStatus: "VERIFIED",
        lastVerifiedAt: checkedAt,
      };
      const changed = existingCollege.aisheCode !== record.aisheCode ||
        existingCollege.name !== data.name ||
        existingCollege.institutionType !== type ||
        existingCollege.managementType !== record.managementType ||
        existingCollege.officialDistrict !== data.officialDistrict ||
        existingCollege.officialAddress !== data.officialAddress ||
        existingCollege.officialState !== data.officialState ||
        existingCollege.officialWebsite !== data.officialWebsite ||
        existingCollege.sourceId !== source.id ||
        existingCollege.verificationStatus !== "VERIFIED" ||
        existingCollege.lastVerifiedAt?.getTime() !== checkedAt.getTime() ||
        mergedAliases.length !== existingCollege.searchAliases.length;
      if (changed) recordsToUpdate.push({ id: existingCollege.id, data });
      for (const code of [record.aisheCode, ...(record.relatedAisheCodes ?? [])]) existingByCode.set(code, existingCollege);
      continue;
    }

    let slug = `aishe-${record.aisheCode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (occupiedSlugs.has(slug)) slug = `${slug}-${normalizeName(record.stateName).replace(/ /g, "-")}`;
    occupiedSlugs.add(slug);
    recordsToCreate.push({
      slug,
      aisheCode: record.aisheCode,
      name: record.name,
      searchAliases: aliases,
      description: "AISHE directory record. Only institution name, location, and management details are included here; verified program and fee details are not available in this source.",
      institutionType: type,
      managementType: record.managementType,
      officialWebsite: website,
      officialAddress: record.address,
      officialDistrict: record.districtName,
      officialState: record.stateName,
      verificationStatus: "VERIFIED",
      demoRecord: false,
      lastVerifiedAt: checkedAt,
      sourceId: source.id,
    });
  }

  for (let offset = 0; offset < recordsToUpdate.length; offset += 250) {
    const batch = recordsToUpdate.slice(offset, offset + 250);
    await prisma.$transaction(batch.map(record => prisma.college.update({ where: { id: record.id }, data: record.data })));
  }
  let created = 0;
  for (let offset = 0; offset < recordsToCreate.length; offset += batchSize) {
    const result = await prisma.college.createMany({ data: recordsToCreate.slice(offset, offset + batchSize), skipDuplicates: true });
    created += result.count;
  }

  const linkedRecords = await prisma.college.findMany({
    where: { sourceId: source.id, aisheCode: { not: null } },
    select: { aisheCode: true, institutionType: true, verificationStatus: true },
  });
  const linkedByCode = new Map(linkedRecords.flatMap(record => record.aisheCode ? [[record.aisheCode, record] as const] : []));
  const missingCodes = snapshot.records.filter(record => !linkedByCode.has(record.aisheCode));
  const misclassifiedCodes = snapshot.records.filter(record => {
    const linked = linkedByCode.get(record.aisheCode);
    return linked && (linked.institutionType !== collegeType(record.managementType) || linked.verificationStatus !== "VERIFIED");
  });
  if (missingCodes.length || misclassifiedCodes.length) {
    const candidateSlugs = missingCodes.map(record => `aishe-${record.aisheCode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
    const conflicts = await prisma.college.findMany({
      where: { OR: [{ aisheCode: { in: missingCodes.map(record => record.aisheCode) } }, { slug: { in: candidateSlugs } }] },
      select: { aisheCode: true, slug: true, name: true, sourceId: true, institutionType: true, verificationStatus: true },
    });
    throw new Error(`AISHE import verification failed: ${missingCodes.length} records missing, ${misclassifiedCodes.length} records misclassified or not verified. Missing codes: ${missingCodes.slice(0, 8).map(record => record.aisheCode).join(", ")}. Slug or code conflicts: ${JSON.stringify(conflicts)}`);
  }

  const governmentCount = snapshot.records.filter(record => governmentManagement.has(record.managementType)).length;
  const privateCount = snapshot.records.length - governmentCount;
  console.info(`AISHE directory: ${created} records added, ${recordsToUpdate.length} existing records linked; ${governmentCount} government-managed and ${privateCount} private-managed profiles in the snapshot (${snapshot.duplicateCrossListCount} cross-list duplicates merged).`);
}
