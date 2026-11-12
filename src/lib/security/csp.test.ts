import { describe, expect, it } from "vitest";
import { API_CSP, buildPageCsp, createNonce } from "./csp";

describe("buildPageCsp", () => {
  const prod = buildPageCsp("abc123", false);

  it("allows scripts only with the request nonce", () => {
    expect(prod).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
  });

  it("never allows inline or eval scripts in production", () => {
    const scriptSrc = prod.split("; ").find((d) => d.startsWith("script-src"));
    expect(scriptSrc).not.toContain("unsafe-inline");
    expect(scriptSrc).not.toContain("unsafe-eval");
    expect(prod).not.toContain("unsafe-inline");
  });

  it("forbids framing, plugins and foreign form targets", () => {
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("object-src 'none'");
    expect(prod).toContain("form-action 'self'");
  });

  it("upgrades insecure requests only in production", () => {
    expect(prod).toContain("upgrade-insecure-requests");
    expect(buildPageCsp("n", true)).not.toContain("upgrade-insecure-requests");
  });

  it("allows eval in development only", () => {
    expect(buildPageCsp("n", true)).toContain("'unsafe-eval'");
  });
});

describe("API_CSP", () => {
  it("blocks everything", () => {
    expect(API_CSP).toBe("default-src 'none'; frame-ancestors 'none'");
  });
});

describe("createNonce", () => {
  it("is unique per call and carries 128 bits", () => {
    const a = createNonce();
    expect(a).not.toBe(createNonce());
    expect(atob(a)).toHaveLength(16);
  });
});
