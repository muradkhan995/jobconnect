import { describe, expect, it } from "vitest";
import { escapeHtml, resetPasswordEmail, verificationEmail } from "./emails";

describe("auth emails", () => {
  it("escapes HTML in names so an email can't be used for injection", () => {
    const e = verificationEmail(
      "a@example.com",
      '<img src=x onerror="alert(1)">',
      "https://x/v?t=1",
    );
    expect(e.html).not.toContain("<img");
    expect(e.html).toContain("&lt;img");
  });

  it("puts the link in both the text and HTML versions", () => {
    const url =
      "http://localhost:3000/api/auth/verify-email?token=abc&callbackURL=%2Flogin";
    const e = verificationEmail("a@example.com", "Amira", url);
    expect(e.text).toContain(url);
    expect(e.html).toContain(escapeHtml(url));
  });

  it("states the expiry times from the requirements", () => {
    expect(verificationEmail("a@x.com", "A", "u").text).toContain("24 hours"); // FR-AUTH-005
    expect(resetPasswordEmail("a@x.com", "A", "u").text).toContain("1 hour"); // FR-AUTH-008
  });
});
