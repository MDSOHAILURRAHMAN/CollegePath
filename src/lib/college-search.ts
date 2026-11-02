const IGNORED_INITIALS = new Set(["a", "an", "and", "at", "for", "in", "of", "the", "to"]);

export function collegeSearchAliases(name: string): string[] {
  const normalized = name.normalize("NFKD").toLowerCase().replace(/\p{M}/gu, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const acronym = words.filter(word => !IGNORED_INITIALS.has(word)).map(word => word[0]).join("");
  const aliases = new Set<string>();
  if (acronym.length >= 3 && acronym.length <= 12) aliases.add(acronym);

  if (acronym.startsWith("iit")) aliases.add("iit");
  if (acronym.startsWith("nit")) aliases.add("nit");
  if (acronym.startsWith("iiit")) aliases.add("iiit");

  const location = words.at(-1);
  if (location && normalized.startsWith("indian institute of technology ")) aliases.add(`iit ${location}`);
  if (location && normalized.startsWith("national institute of technology ")) aliases.add(`nit ${location}`);
  if (location && normalized.startsWith("indian institute of information technology ")) aliases.add(`iiit ${location}`);

  return [...aliases];
}
