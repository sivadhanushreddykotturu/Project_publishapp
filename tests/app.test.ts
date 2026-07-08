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

  it("requires auth on protected routes", async () => {
    const res = await request(app).get("/api/v1/projects");
    expect(res.status).toBe(401);
  });

  it("returns 404 with a helpful message for unknown routes", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/Route not found/);
  });
});
