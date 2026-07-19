import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.resolve(__dirname, "../backend/.env");

if (fs.existsSync(backendEnvPath)) {
  const backendEnv = dotenv.parse(fs.readFileSync(backendEnvPath));
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && backendEnv.CLERK_PUBLISHABLE_KEY) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = backendEnv.CLERK_PUBLISHABLE_KEY;
  }
  if (!process.env.NEXT_PUBLIC_API_BASE_URL && backendEnv.APP_BASE_URL) {
    process.env.NEXT_PUBLIC_API_BASE_URL = backendEnv.APP_BASE_URL;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;

