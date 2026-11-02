import { z } from "zod";

const optionalString = z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional());
const optionalSecret = z.preprocess((value) => value === "" ? undefined : value, z.string().min(32).optional());
const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.url().optional());
const configuredUrl = z.preprocess((value) => value === "" ? undefined : value, z.url().optional());

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: configuredUrl,
  BETTER_AUTH_SECRET: optionalSecret,
  BETTER_AUTH_URL: optionalUrl,
  NEXT_PUBLIC_APP_URL: optionalUrl,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.preprocess((value) => value === "" ? undefined : value, z.string().min(3).optional()),
  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
}).superRefine((value, context) => {
  const productionRuntime = value.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build" && process.env.COLLEGEPATH_DATA_SEED !== "true";
  if (productionRuntime) {
    for (const key of ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "NEXT_PUBLIC_APP_URL", "RESEND_API_KEY", "EMAIL_FROM", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"] as const) {
      if (!value[key]) context.addIssue({ code: "custom", path: [key], message: "Required for production runtime." });
    }
    for (const [key, url] of [["BETTER_AUTH_URL", value.BETTER_AUTH_URL], ["NEXT_PUBLIC_APP_URL", value.NEXT_PUBLIC_APP_URL]] as const) {
      if (url && new URL(url).protocol !== "https:") context.addIssue({ code: "custom", path: [key], message: "Must use HTTPS in production." });
    }
    if (value.BETTER_AUTH_URL && value.NEXT_PUBLIC_APP_URL && new URL(value.BETTER_AUTH_URL).origin !== new URL(value.NEXT_PUBLIC_APP_URL).origin) {
      context.addIssue({ code: "custom", path: ["BETTER_AUTH_URL"], message: "Must use the same origin as NEXT_PUBLIC_APP_URL." });
    }
    if (value.RAZORPAY_KEY_ID && !value.RAZORPAY_KEY_ID.startsWith("rzp_live_")) context.addIssue({ code: "custom", path: ["RAZORPAY_KEY_ID"], message: "Production must use a live-mode Razorpay key." });
    if (value.RAZORPAY_KEY_SECRET && value.RAZORPAY_KEY_SECRET.length < 16) context.addIssue({ code: "custom", path: ["RAZORPAY_KEY_SECRET"], message: "Razorpay key secret is too short." });
    if (value.RAZORPAY_WEBHOOK_SECRET && value.RAZORPAY_WEBHOOK_SECRET.length < 16) context.addIssue({ code: "custom", path: ["RAZORPAY_WEBHOOK_SECRET"], message: "Razorpay webhook secret is too short." });
  }
  if (value.RESEND_API_KEY && !value.EMAIL_FROM) context.addIssue({ code: "custom", path: ["EMAIL_FROM"], message: "Required when RESEND_API_KEY is configured." });
  if (value.EMAIL_FROM) {
    const fromAddress = value.EMAIL_FROM.match(/<([^<>]+)>$/)?.[1] ?? value.EMAIL_FROM;
    if (!z.email().safeParse(fromAddress).success) context.addIssue({ code: "custom", path: ["EMAIL_FROM"], message: "Use a valid address, optionally with a display name, for example CollegePath <hello@example.com>." });
  }
  const paymentKeys = [value.RAZORPAY_KEY_ID, value.RAZORPAY_KEY_SECRET, value.RAZORPAY_WEBHOOK_SECRET].filter(Boolean).length;
  if (paymentKeys > 0 && paymentKeys < 3) context.addIssue({ code: "custom", path: ["RAZORPAY"], message: "Configure the key ID, key secret, and webhook secret together." });
});

const parsed = environmentSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = {
  ...parsed.data,
  DATABASE_URL: parsed.data.DATABASE_URL ?? "postgresql://collegepath:collegepath_dev@localhost:5432/collegepath?schema=public",
};
