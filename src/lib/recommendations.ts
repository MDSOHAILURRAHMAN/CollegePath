export type RecommendationInput = {
  categorySlug?: string;
  degreeLevel: "UNDERGRADUATE" | "POSTGRADUATE" | "DIPLOMA";
  preferredStates: string[];
  budgetInr?: number | null;
  institutionPreference?: "GOVERNMENT" | "PRIVATE";
};

export type RecommendationCandidate = {
  id: string;
  slug: string;
  name: string;
  institutionType: string;
  officialAdmissionUrl: string | null;
  demoRecord: boolean;
  verificationStatus: string;
  campuses: { state: string }[];
  programs: { degreeLevel: string; categories: { category: { slug: string; name: string } }[] }[];
  annualTuitionInr: number | null;
};

export type RecommendationResult = {
  collegeId: string;
  slug: string;
  name: string;
  band: "POTENTIAL";
  reasons: string[];
  estimatedAnnualTuitionInr: number | null;
  officialAdmissionUrl: string | null;
  limitations: string[];
};

export function recommendColleges(input: RecommendationInput, candidates: RecommendationCandidate[]): RecommendationResult[] {
  return candidates
    .filter(candidate => !candidate.demoRecord && candidate.verificationStatus === "VERIFIED")
    .filter(candidate => candidate.programs.some(program => program.degreeLevel === input.degreeLevel && (!input.categorySlug || program.categories.some(category => category.category.slug === input.categorySlug))))
    .filter(candidate => input.budgetInr === null || input.budgetInr === undefined || candidate.annualTuitionInr === null || candidate.annualTuitionInr <= input.budgetInr)
    .map(candidate => {
      const programs = candidate.programs.filter(program => program.degreeLevel === input.degreeLevel && (!input.categorySlug || program.categories.some(category => category.category.slug === input.categorySlug)));
      const reasons: string[] = [`${input.degreeLevel.toLowerCase().replaceAll("_", " ")} program listed`];
      if (input.categorySlug) {
        const category = programs.flatMap(program => program.categories.map(item => item.category)).find(item => item.slug === input.categorySlug);
        if (category) reasons.push(`${category.name} course category matches`);
      }
      if (input.preferredStates.some(state => candidate.campuses.some(campus => campus.state.toLowerCase() === state.toLowerCase()))) reasons.push("Campus is in a preferred state");
      if (input.institutionPreference && candidate.institutionType === input.institutionPreference) reasons.push("Institution type matches your preference");
      if (candidate.annualTuitionInr === null) reasons.push("Verified tuition is not available; budget fit is unknown");
      else reasons.push("Verified annual tuition is within the stated budget");
      return {
        collegeId: candidate.id,
        slug: candidate.slug,
        name: candidate.name,
        band: "POTENTIAL" as const,
        reasons,
        estimatedAnnualTuitionInr: candidate.annualTuitionInr,
        officialAdmissionUrl: candidate.officialAdmissionUrl,
        limitations: ["Potential option — admission likelihood not assessed.", "Historical cut-off evidence for the matching course, campus, quota, category, and admission year is not available to this recommendation run."],
      };
    })
    .sort((left, right) => right.reasons.length - left.reasons.length || left.name.localeCompare(right.name));
}