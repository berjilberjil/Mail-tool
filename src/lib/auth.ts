import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { Resend } from "resend";
import { db } from "./db";
import * as schema from "./db-schema";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url, token }: { user: { email: string; name: string }; url: string; token: string }) => {
      await resend.emails.send({
        from: "Skcript Mail <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset your password — Skcript Mail",
        html: `
          <h2>Reset your password</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>We received a request to reset your password. Click the link below to choose a new one:</p>
          <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p style="color:#6b7280;font-size:12px;">This link will expire in 1 hour.</p>
        `,
      });
    },
    sendVerificationEmail: async ({ user, url, token }: { user: { email: string; name: string }; url: string; token: string }) => {
      await resend.emails.send({
        from: "Skcript Mail <onboarding@resend.dev>",
        to: user.email,
        subject: "Verify your email — Skcript Mail",
        html: `
          <h2>Verify your email address</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Thanks for signing up for Skcript Mail! Please verify your email address by clicking the link below:</p>
          <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
      });
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
