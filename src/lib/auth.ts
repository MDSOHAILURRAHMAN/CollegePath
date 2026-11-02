import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const authSecret = env.BETTER_AUTH_SECRET ?? "collegepath-local-development-secret-change-before-deployment";

if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be at least 32 characters. Copy .env.example and set a secure secret.");
}

async function sendAuthEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("Email is not configured; verification and recovery messages are not being sent.");
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  });
  if (!response.ok) throw new Error(`Email provider rejected the message (${response.status}).`);
}

export const auth = betterAuth({
  appName: "CollegePath",
  baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: env.NODE_ENV === "production" ? [env.BETTER_AUTH_URL ?? "http://localhost:3000"] : ["http://localhost:3000", "http://127.0.0.1:3000"],
  secret: authSecret,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: Boolean(env.RESEND_API_KEY),
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail(user.email, "Reset your CollegePath password", `<p><a href="${url}">Reset your password</a></p><p>This link expires soon. If you did not request this, you can ignore this email.</p>`);
    },
  },
  emailVerification: {
    sendOnSignUp: Boolean(env.RESEND_API_KEY),
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail(user.email, "Verify your CollegePath email", `<p><a href="${url}">Verify your email</a></p>`);
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["STUDENT", "COUNSELLOR", "ADMIN"],
        required: true,
        defaultValue: "STUDENT",
        input: false,
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});