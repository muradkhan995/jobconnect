/**
 * Field names that may hold personal data or secrets (NFR-PRV-004, NFR-SEC-001).
 * Used to redact logs and to keep personal data out of audit metadata.
 */
export const SENSITIVE_KEYS: readonly string[] = [
  "email",
  "password",
  "currentPassword",
  "newPassword",
  "passwordHash",
  "name",
  "fullName",
  "phone",
  "coverLetter",
  "token",
  "secret",
  "cookie",
  "authorization",
  "ip",
  "ipAddress",
];

const SENSITIVE_LOWER = new Set(SENSITIVE_KEYS.map((k) => k.toLowerCase()));

/** Case-insensitive: "Email" and "EMAIL" are as sensitive as "email". */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_LOWER.has(key.toLowerCase());
}
