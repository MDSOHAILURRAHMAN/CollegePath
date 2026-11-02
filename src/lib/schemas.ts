import { z } from "zod";

export const collegeSearchSchema = z.object({
  query: z.string().trim().max(100).default(""),
  state: z.string().trim().max(60).default(""),
  category: z.string().trim().max(80).default(""),
  type: z.enum(["", "GOVERNMENT", "PRIVATE", "DEEMED", "AUTONOMOUS", "OTHER"]).default(""),
  degree: z.enum(["", "UNDERGRADUATE", "POSTGRADUATE", "DIPLOMA", "DOCTORAL"]).default(""),
  minFee: z.coerce.number().finite().min(0).optional(),
  maxFee: z.coerce.number().finite().min(0).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  sort: z.enum(["name", "recent"]).default("name"),
});

export const studentProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  currentEducation: z.string().trim().max(80).optional().or(z.literal("")),
  intendedCourse: z.string().trim().max(100).optional().or(z.literal("")),
  preferredStates: z.array(z.string().trim().min(2).max(60)).max(8).default([]),
  annualBudgetInr: z.number().finite().min(0).max(100_000_000).nullable().optional(),
  accommodationNeeded: z.boolean().nullable().optional(),
  careerInterests: z.array(z.string().trim().min(2).max(80)).max(10).default([]),
  marketingConsent: z.boolean().default(false),
});

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  phone: z.string().trim().min(7).max(30),
  admissionYear: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
  marketingConsent: z.boolean().default(false),
});

export const recommendationSchema = z.object({
  categorySlug: z.string().trim().max(80).optional(),
  degreeLevel: z.enum(["UNDERGRADUATE", "POSTGRADUATE", "DIPLOMA"]).default("UNDERGRADUATE"),
  preferredStates: z.array(z.string().trim().min(2).max(60)).max(8).default([]),
  budgetInr: z.number().finite().min(0).max(100_000_000).nullable().optional(),
  institutionPreference: z.enum(["GOVERNMENT", "PRIVATE"]).optional(),
});

export type CollegeSearch = z.infer<typeof collegeSearchSchema>;