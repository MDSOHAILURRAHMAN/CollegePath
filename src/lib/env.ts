import { z } from "zod";

const optionalString = z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional());
const optionalSecret = z.preprocess((value) => value === "" ? undefined : value, z.string().min(32).optional());
const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.url().optional());

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url().default("postgresql://collegepath:collegepath_dev@localhost:5432/collegepath?schema=public"),
  BETTER_AUTH_SECRET: optionalSecret,
  BETTER_AUTH_URL: optionalUrl,
  NEXT_PUBLIC_APP_URL: optionalUrl,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.preprocess((value) => value === "" ? undefined : value, z.string().min(3).optional()),
  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && !value.BETTER_AUTH_SECRET) context.addIssue({ code: "custom", path: ["BETTER_AUTH_SECRET"], message: "Required in production." });
  if (value.RESEND_API_KEY && !value.EMAIL_FROM) context.addIssue({ code: "custom", path: ["EMAIL_FROM"], message: "Required when RESEND_API_KEY is configured." });
  const paymentKeys = [value.RAZORPAY_KEY_ID, value.RAZORPAY_KEY_SECRET, value.RAZORPAY_WEBHOOK_SECRET].filter(Boolean).length;
  if (paymentKeys > 0 && paymentKeys < 3) context.addIssue({ code: "custom", path: ["RAZORPAY"], message: "Configure the key ID, key secret, and webhook secret together." });
});

const parsed = environmentSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;
