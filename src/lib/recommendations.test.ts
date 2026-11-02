import { describe, expect, it } from "vitest";
import { recommendColleges, type RecommendationCandidate } from "./recommendations";

const candidates: RecommendationCandidate[] = [
  { id: "a", slug: "alpha", name: "Alpha Institute", institutionType: "GOVERNMENT", officialAdmissionUrl: null, demoRecord: false, verificationStatus: "VERIFIED", campuses: [{ state: "Karnataka" }], programs: [{ degreeLevel: "UNDERGRADUATE", categories: [{ category: { slug: "engineering", name: "Engineering" } }] }], annualTuitionInr: 80_000 },
  { id: "b", slug: "beta", name: "Beta Institute", institutionType: "PRIVATE", officialAdmissionUrl: "https://example.test/apply", demoRecord: false, verificationStatus: "VERIFIED", campuses: [{ state: "Tamil Nadu" }], programs: [{ degreeLevel: "UNDERGRADUATE", categories: [{ category: { slug: "engineering", name: "Engineering" } }] }], annualTuitionInr: null },
  { id: "demo", slug: "demo", name: "Demo record", institutionType: "OTHER", officialAdmissionUrl: null, demoRecord: true, verificationStatus: "DEMO", campuses: [], programs: [{ degreeLevel: "UNDERGRADUATE", categories: [{ category: { slug: "engineering", name: "Engineering" } }] }], annualTuitionInr: 20_000 },
  { id: "over", slug: "over", name: "Over budget", institutionType: "PRIVATE", officialAdmissionUrl: null, demoRecord: false, verificationStatus: "VERIFIED", campuses: [], programs: [{ degreeLevel: "UNDERGRADUATE", categories: [{ category: { slug: "engineering", name: "Engineering" } }] }], annualTuitionInr: 300_000 },
];

describe("transparent college recommendations", () => {
  it("matches declared course and removes known tuition above a hard budget", () => {
    const result = recommendColleges({ categorySlug: "engineering", degreeLevel: "UNDERGRADUATE", preferredStates: [], budgetInr: 100_000 }, candidates);
    expect(result.map(item => item.slug)).toEqual(["alpha", "beta"]);
    expect(result.every(item => item.band === "POTENTIAL")).toBe(true);
  });

  it("does not infer affordability when tuition is unavailable", () => {
    const result = recommendColleges({ degreeLevel: "UNDERGRADUATE", preferredStates: [], budgetInr: 1 }, candidates);
    expect(result.map(item => item.slug)).toEqual(["beta"]);
    expect(result[0].reasons).toContain("Verified tuition is not available; budget fit is unknown");
  });

  it("never recommends fictional demo records or claims admission likelihood", () => {
    const result = recommendColleges({ degreeLevel: "UNDERGRADUATE", preferredStates: [] }, candidates);
    expect(result.every(item => item.slug !== "demo")).toBe(true);
    expect(result.every(item => item.limitations[0].includes("admission likelihood not assessed"))).toBe(true);
  });
});