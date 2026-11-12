import { describe, expect, it } from "vitest";
import { uuidv7 } from "./uuidv7";

const V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidv7", () => {
  it("has the version 7 and RFC variant bits", () => {
    for (let i = 0; i < 100; i++) expect(uuidv7()).toMatch(V7);
  });

  it("encodes the timestamp in the first 48 bits", () => {
    const t = Date.UTC(2026, 10, 12, 9, 30);
    expect(parseInt(uuidv7(t).replace(/-/g, "").slice(0, 12), 16)).toBe(t);
  });

  it("sorts by creation time", () => {
    const a = uuidv7(1_000_000);
    const b = uuidv7(2_000_000);
    expect(a < b).toBe(true);
  });

  it("is unique", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uuidv7(42)));
    expect(ids.size).toBe(1000);
  });
});
