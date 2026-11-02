export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

export function statesInOfficialAddress(address: string | null | undefined): string[] {
  if (!address) return [];
  const matches = INDIAN_STATES.filter(state => {
    const escaped = state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, "iu").test(address);
  });
  const aliases: readonly [RegExp, (typeof INDIAN_STATES)[number]][] = [
    [/(?:^|[^\p{L}])M\.?\s*P\.?(?:$|[^\p{L}])/iu, "Madhya Pradesh"],
    [/\bA\.?\s*P\.?\b/i, "Andhra Pradesh"],
    [/\bJ\s*&\s*K\b|\bJammu\s*&\s*Kashmir\b/i, "Jammu and Kashmir"],
    [/\bH\.?\s*P\.?\b/i, "Himachal Pradesh"],
    [/\bU\.?\s*P\.?\b/i, "Uttar Pradesh"],
    [/\bP(?:b|unjab)\.?\b/i, "Punjab"],
    [/\bChhatisgarh\b/i, "Chhattisgarh"],
    [/\bChennai\b/i, "Tamil Nadu"],
    [/\bGandhinagar\b/i, "Gujarat"],
    [/\bJalandhar\b/i, "Punjab"],
    [/\bRourkela\b/i, "Odisha"],
    [/\bHowrah\b/i, "West Bengal"],
    [/\bGuwahati\b/i, "Assam"],
    [/\bLucknow\b/i, "Uttar Pradesh"],
    [/\bDharwad\b/i, "Karnataka"],
    [/\bAgartala\b/i, "Tripura"],
    [/\bDiu\b/i, "Dadra and Nagar Haveli and Daman and Diu"],
    [/\bHaridwar\b/i, "Uttarakhand"],
    [/\bBhopal\b/i, "Madhya Pradesh"],
    [/\bHyderabad\b/i, "Telangana"],
    [/\bBhubaneswar\b/i, "Odisha"],
    [/\bSalem\b/i, "Tamil Nadu"],
    [/\bVadodara\b/i, "Gujarat"],
    [/\bAizawl\b/i, "Mizoram"],
    [/\bSrinagar\b/i, "Jammu and Kashmir"],
  ];
  for (const [pattern, state] of aliases) if (pattern.test(address)) matches.push(state);
  return [...new Set(matches)];
}

export const COURSE_CATEGORIES = [
  ["engineering-technology", "Engineering & Technology"],
  ["medical-healthcare", "Medical & Healthcare"],
  ["management-business", "Management & Business"],
  ["law", "Law"],
  ["commerce-finance", "Commerce & Finance"],
  ["arts-humanities", "Arts & Humanities"],
  ["science", "Science"],
  ["design-architecture", "Design & Architecture"],
  ["computer-applications", "Computer Applications"],
  ["education", "Education"],
  ["agriculture", "Agriculture"],
  ["hospitality-tourism", "Hospitality & Tourism"],
] as const;
