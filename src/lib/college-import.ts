import { z } from "zod";

const sourceUrl = z.string().trim().url().refine(value => new URL(value).protocol === "https:", "Use HTTPS source URLs.").optional().or(z.literal(""));

export const collegeImportRowSchema = z.object({
  name: z.string().trim().min(3).max(180),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  institutionType: z.enum(["GOVERNMENT", "PRIVATE", "DEEMED", "AUTONOMOUS", "OTHER"]).default("OTHER"),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  officialWebsite: sourceUrl,
  officialAdmissionUrl: sourceUrl,
  sourceName: z.string().trim().max(180).optional().or(z.literal("")),
  sourceUrl,
});

export type CollegeImportRow = z.infer<typeof collegeImportRowSchema>;