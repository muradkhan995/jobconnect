import { describe, expect, it } from "vitest";
import {
  GENERIC_MESSAGE,
  RATE_LIMITED_MESSAGE,
  authErrorMessage,
} from "./messages";

describe("authErrorMessage", () => {
  it("maps known codes to plain words", () => {
    expect(
      authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }),
    ).toMatch(/don't match/);
  });

  it("explains rate limiting", () => {
    expect(authErrorMessage({ status: 429 })).toBe(RATE_LIMITED_MESSAGE);
  });

  it("never shows raw server errors", () => {
    expect(
      authErrorMessage({
        status: 500,
        message: "PrismaClientKnownRequestError at…",
      }),
    ).toBe(GENERIC_MESSAGE);
    expect(authErrorMessage(null)).toBe(GENERIC_MESSAGE);
  });

  it("shows our own validation messages", () => {
    expect(
      authErrorMessage({
        status: 400,
        message: "Choose whether you are a candidate or an employer.",
      }),
    ).toMatch(/candidate or an employer/);
  });
});
