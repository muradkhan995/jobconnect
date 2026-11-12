import { describe, expect, it } from "vitest";
import { CURRENT_PRIVACY_POLICY_VERSION, checkSignup } from "./signup-rules";

const policy = CURRENT_PRIVACY_POLICY_VERSION;

describe("checkSignup", () => {
  it.each(["CANDIDATE", "EMPLOYER"])(
    "accepts the self-service role %s",
    (role) => {
      expect(checkSignup({ role, privacyPolicyVersion: policy })).toEqual({
        ok: true,
      });
    },
  );

  it.each(["ADMIN", "admin", "", undefined, null, 42])(
    "rejects the role %s (FR-AUTH-002)",
    (role) => {
      expect(checkSignup({ role, privacyPolicyVersion: policy }).ok).toBe(
        false,
      );
    },
  );

  it("rejects a missing or outdated privacy policy acceptance (NFR-PRV-002)", () => {
    expect(
      checkSignup({ role: "CANDIDATE", privacyPolicyVersion: undefined }).ok,
    ).toBe(false);
    expect(
      checkSignup({ role: "CANDIDATE", privacyPolicyVersion: "2020-01-01" }).ok,
    ).toBe(false);
  });
});
