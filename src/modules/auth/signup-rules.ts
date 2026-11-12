/** Bump when the privacy policy text changes; users then accept the new version. */
export const CURRENT_PRIVACY_POLICY_VERSION = "2026-11-12";

export const SELF_SERVICE_ROLES = ["CANDIDATE", "EMPLOYER"] as const;
export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export const PASSWORD_MIN_LENGTH = 12; // FR-AUTH-003
export const PASSWORD_MAX_LENGTH = 128;

export type SignupCheck = { ok: true } | { ok: false; message: string };

/**
 * Server-side sign-up rules that Better Auth doesn't know about.
 * FR-AUTH-002: nobody can sign up as an administrator.
 * NFR-PRV-002: the current privacy policy must be accepted.
 */
export function checkSignup(input: {
  role: unknown;
  privacyPolicyVersion: unknown;
}): SignupCheck {
  if (!SELF_SERVICE_ROLES.includes(input.role as SelfServiceRole)) {
    return {
      ok: false,
      message: "Choose whether you are a candidate or an employer.",
    };
  }
  if (input.privacyPolicyVersion !== CURRENT_PRIVACY_POLICY_VERSION) {
    return { ok: false, message: "Please accept the current privacy policy." };
  }
  return { ok: true };
}
