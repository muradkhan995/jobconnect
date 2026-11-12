import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("uses Argon2id with the OWASP parameters (NFR-SEC-001)", async () => {
    const h = await hashPassword("correct horse battery staple");
    expect(h).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it("never stores the password itself", async () => {
    const h = await hashPassword("correct horse battery staple");
    expect(h).not.toContain("correct horse");
  });

  it("verifies the right password and rejects a wrong one", async () => {
    const h = await hashPassword("correct horse battery staple");
    expect(
      await verifyPassword({
        hash: h,
        password: "correct horse battery staple",
      }),
    ).toBe(true);
    expect(
      await verifyPassword({ hash: h, password: "wrong password here" }),
    ).toBe(false);
  });

  it("fails closed on a malformed hash", async () => {
    expect(await verifyPassword({ hash: "not-a-hash", password: "x" })).toBe(
      false,
    );
  });
});
