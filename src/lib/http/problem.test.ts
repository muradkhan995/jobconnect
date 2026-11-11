import { describe, expect, it } from "vitest";
import { PROBLEM_CONTENT_TYPE, problem, problemResponse } from "./problem";

describe("problem", () => {
  it("builds an RFC 9457 body with our code and request id", () => {
    expect(
      problem({
        status: 409,
        code: "ALREADY_APPLIED",
        title: "Already applied",
        requestId: "r1",
      }),
    ).toEqual({
      type: "https://jobconnect.example/errors/already-applied",
      title: "Already applied",
      status: 409,
      code: "ALREADY_APPLIED",
      requestId: "r1",
      errors: [],
    });
  });

  it("carries field errors", () => {
    const p = problem({
      status: 400,
      code: "VALIDATION_FAILED",
      title: "Invalid input",
      requestId: "r2",
      errors: [{ field: "salaryMax", message: "Must be at least the minimum" }],
    });
    expect(p.errors).toHaveLength(1);
  });
});

describe("problemResponse", () => {
  it("uses the problem content type, status and no-store", async () => {
    const res = problemResponse(
      problem({
        status: 403,
        code: "CSRF_ORIGIN_MISMATCH",
        title: "Forbidden",
        requestId: "r3",
      }),
    );
    expect(res.status).toBe(403);
    expect(res.headers.get("Content-Type")).toBe(PROBLEM_CONTENT_TYPE);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toMatchObject({
      code: "CSRF_ORIGIN_MISMATCH",
      requestId: "r3",
    });
  });
});
