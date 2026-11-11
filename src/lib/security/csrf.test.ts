import { describe, expect, it } from "vitest";
import { isCsrfSafe } from "./csrf";

const OWN = "https://jobconnect.example";

describe("isCsrfSafe", () => {
  it.each(["GET", "HEAD", "OPTIONS", "get"])(
    "allows safe method %s without Origin",
    (m) => {
      expect(isCsrfSafe(m, null, OWN)).toBe(true);
    },
  );

  it.each(["POST", "PATCH", "PUT", "DELETE"])(
    "allows %s from our own origin",
    (m) => {
      expect(isCsrfSafe(m, OWN, OWN)).toBe(true);
    },
  );

  it("rejects a cross-site POST", () => {
    expect(isCsrfSafe("POST", "https://evil.example", OWN)).toBe(false);
  });

  it("rejects a lookalike origin", () => {
    expect(isCsrfSafe("POST", "https://jobconnect.example.evil.com", OWN)).toBe(
      false,
    );
    expect(isCsrfSafe("POST", "http://jobconnect.example", OWN)).toBe(false);
  });

  it("rejects POST without Origin, and the opaque 'null' origin", () => {
    expect(isCsrfSafe("POST", null, OWN)).toBe(false);
    expect(isCsrfSafe("POST", "null", OWN)).toBe(false);
  });
});
