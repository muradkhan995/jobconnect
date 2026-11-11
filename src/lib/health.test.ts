import { describe, expect, it } from "vitest";
import { checkHealth } from "./health";

describe("checkHealth", () => {
  it("returns 200 ok when the database answers", async () => {
    const result = await checkHealth(async () => 1);
    expect(result).toEqual({ httpStatus: 200, body: { status: "ok" } });
  });

  it("returns 503 error when the database ping fails", async () => {
    const result = await checkHealth(async () => {
      throw new Error("connection refused at 10.0.0.5:5432");
    });
    expect(result).toEqual({ httpStatus: 503, body: { status: "error" } });
  });

  it("does not leak error details", async () => {
    const result = await checkHealth(async () => {
      throw new Error("password authentication failed for user admin");
    });
    expect(JSON.stringify(result.body)).not.toMatch(/password|admin/);
  });

  it("returns 503 when the database does not answer in time", async () => {
    const result = await checkHealth(() => new Promise(() => {}), 10);
    expect(result.httpStatus).toBe(503);
  });
});
