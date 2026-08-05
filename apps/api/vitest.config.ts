import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // mongodb-memory-server downloads a binary on first run; keep forks serial
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
