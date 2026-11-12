import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext (open-redirect protection)", () => {
  it("keeps same-site paths, including query strings", () => {
    expect(safeNext("/jobs/123")).toBe("/jobs/123");
    expect(safeNext("/jobs?q=nurse&location=Leeds")).toBe(
      "/jobs?q=nurse&location=Leeds",
    );
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "jobs",
    "",
  ])("refuses %s", (next) => {
    expect(safeNext(next)).toBe("/");
  });

  it("uses the fallback when there is no next", () => {
    expect(safeNext(null, "/employer")).toBe("/employer");
  });
});
