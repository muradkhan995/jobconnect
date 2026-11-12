/** Plain-language messages for auth error codes (docs/04-design/01-ui-flows.md §6). */
const MESSAGES: Record<string, string> = {
  EMAIL_NOT_VERIFIED:
    "Please confirm your email first. We've sent you a new link – check your inbox.",
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match. Try again.",
  ACCOUNT_SUSPENDED: "This account can't sign in. Contact support.",
  PASSWORD_TOO_SHORT: "Use at least 12 characters.",
  PASSWORD_TOO_LONG: "Use 128 characters or fewer.",
  PASSWORD_COMPROMISED:
    "This password has appeared in a data breach. Please choose a different one.",
  INVALID_TOKEN:
    "This link has expired or was already used. Request a new one.",
  INVALID_EMAIL: "Enter a valid email address.",
};

export const RATE_LIMITED_MESSAGE = "Too many attempts. Try again in a minute.";
export const GENERIC_MESSAGE = "Something went wrong. Please try again.";

export function authErrorMessage(
  error:
    { code?: string; message?: string; status?: number } | null | undefined,
): string {
  if (!error) return GENERIC_MESSAGE;
  if (error.status === 429) return RATE_LIMITED_MESSAGE;
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!;
  // Messages we wrote ourselves (sign-up rules) are safe to show as they are.
  if (error.status === 400 && error.message) return error.message;
  return GENERIC_MESSAGE;
}
