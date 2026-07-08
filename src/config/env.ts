import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    if (process.env.NODE_ENV === "test") return fallback ?? "";
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: Number(process.env.PORT ?? 4000),
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:4000",
  webBaseUrl: process.env.WEB_BASE_URL ?? "http://localhost:3000",

  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/launchops"),

  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY ?? "",
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET ?? "",
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.R2_BUCKET ?? "launchops-files",
    endpoint: process.env.R2_ENDPOINT ?? "",
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? "",
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY ?? "",
    fromEmail: process.env.RESEND_FROM_EMAIL ?? "LaunchOps <notifications@launchops.app>",
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
    xAccountNumber: process.env.RAZORPAY_X_ACCOUNT_NUMBER ?? "",
  },

  googlePlay: {
    serviceAccountJson: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ?? "",
    apiModeEnabled: process.env.GOOGLE_PLAY_API_MODE_ENABLED === "true",
  },

  workflow: {
    defaultMinTesters: Number(process.env.DEFAULT_MIN_TESTERS ?? 14),
    step1InactivityHours: Number(process.env.STEP1_INACTIVITY_HOURS ?? 48),
    inactivityCronSchedule: process.env.INACTIVITY_CRON_SCHEDULE ?? "*/15 * * * *",
    reminderCronSchedule: process.env.REMINDER_CRON_SCHEDULE ?? "0 * * * *",
  },

  logLevel: process.env.LOG_LEVEL ?? "info",
};
