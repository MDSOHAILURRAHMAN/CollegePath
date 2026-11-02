export function calculateEstimatedCost(input: { annualTuitionInr: number | null; years: number; annualHostelInr?: number | null; oneTimeFeesInr?: number | null }) {
  if (input.annualTuitionInr === null || !Number.isInteger(input.years) || input.years <= 0) return null;
  if (input.annualTuitionInr < 0 || (input.annualHostelInr !== undefined && input.annualHostelInr !== null && input.annualHostelInr < 0) || (input.oneTimeFeesInr !== undefined && input.oneTimeFeesInr !== null && input.oneTimeFeesInr < 0)) return null;
  return input.annualTuitionInr * input.years + (input.annualHostelInr ?? 0) * input.years + (input.oneTimeFeesInr ?? 0);
}