import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().optional(),

  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default("DefineUX <no-reply@defineux.app>"),

  WEB_BASE_URL: z.string().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  INACTIVITY_CRON: z.string().default("*/15 * * * *"),
  REMINDER_CRON: z.string().default("0 * * * *"),
});

const parsed = schema.parse(process.env);

// WEB_BASE_URL is always an allowed origin; CORS_ORIGINS adds extras (comma-separated)
// tolerant of missing scheme + trailing slash
const normalizeOrigin = (o: string): string => {
  const clean = o.trim().replace(/\/$/, "");
  if (!clean) return "";
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
};

const corsOrigins = Array.from(
  new Set([
    ...parsed.CORS_ORIGINS.split(",").map(normalizeOrigin),
    normalizeOrigin(parsed.WEB_BASE_URL),
  ]),
).filter(Boolean);

/** Placeholder values ("sk_test_...", "") count as NOT configured. */
const real = (v?: string): v is string =>
  Boolean(v && !v.includes("...") && v.trim().length > 0);

export const env = {
  ...parsed,
  isTest: parsed.NODE_ENV === "test",
  isProd: parsed.NODE_ENV === "production",
  corsOrigins,
  clerkConfigured: real(parsed.CLERK_SECRET_KEY),
  cloudinaryConfigured: Boolean(
    real(parsed.CLOUDINARY_CLOUD_NAME) &&
      real(parsed.CLOUDINARY_API_KEY) &&
      real(parsed.CLOUDINARY_API_SECRET),
  ),
  resendConfigured: real(parsed.RESEND_API_KEY),
};
export type Env = typeof env;
