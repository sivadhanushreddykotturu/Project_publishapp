import request from "supertest";
import { createApp } from "../src/app";

describe("app boot", () => {
  const app = createApp();

  it("responds on /health without requiring a DB connection", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("serves a generated OpenAPI spec with the expected tags", async () => {
    const res = await request(app).get("/api-docs.json");
    expect(res.status).toBe(200);
    expect(res.body.info.title).toBe("LaunchOps API");
    const tagNames = res.body.tags.map((t: { name: string }) => t.name);
    expect(tagNames).toEqual(
      expect.arrayContaining(["Projects", "Assignments", "Wallet", "Bug Reports", "Testing Links"])
    );
    // Spot-check that JSDoc annotations were actually picked up from route files.
    expect(Object.keys(res.body.paths)).toEqual(expect.arrayContaining(["/projects", "/wallet/me", "/t/{assignmentId}"]));
  });

  it("serves the Swagger UI HTML page", async () => {
    const res = await request(app).get("/api-docs/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("gives every 2xx response a real JSON schema, not just a description — a frontend can codegen against this", async () => {
    const res = await request(app).get("/api-docs.json");
    const missingSchema: string[] = [];

    for (const [path, methods] of Object.entries(res.body.paths as Record<string, Record<string, any>>)) {
      for (const [method, operation] of Object.entries(methods)) {
        for (const [code, response] of Object.entries(operation.responses ?? {})) {
          if (!code.startsWith("2")) continue;
          const hasSchema = Boolean((response as any)?.content?.["application/json"]?.schema);
          if (!hasSchema) missingSchema.push(`${method.toUpperCase()} ${path} -> ${code}`);
        }
      }
    }

    // The Razorpay webhook is server-to-server (Razorpay calls us) — no frontend ever
    // consumes its response, so it's the one deliberate exception.
    expect(missingSchema).toEqual(["POST /payments/webhook -> 200"]);
  });

  it("requires auth on protected routes", async () => {
    const res = await request(app).get("/api/v1/projects");
    expect(res.status).toBe(401);
  });

  it("does not grant CORS access to an untrusted browser origin", async () => {
    const res = await request(app).get("/health").set("Origin", "https://evil.example");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("rejects malformed payment webhook signatures without throwing", async () => {
    const res = await request(app)
      .post("/api/v1/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", "invalid")
      .send({});
    expect(res.status).toBe(401);
  });

  it("returns 404 with a helpful message for unknown routes", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/Route not found/);
  });
});
