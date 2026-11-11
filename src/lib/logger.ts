import pino, { type DestinationStream, type Logger } from "pino";

/**
 * Field names that may hold personal data or secrets. Redacted at the top level and
 * one level deep, so `log.info({ user })` can't leak an email (NFR-PRV-004, NFR-SEC-001).
 */
const SENSITIVE_KEYS = [
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

export const REDACT_PATHS = [
  ...SENSITIVE_KEYS,
  ...SENSITIVE_KEYS.map((k) => `*.${k}`),
  "req.headers.cookie",
  "req.headers.authorization",
];

export function createLogger(destination?: DestinationStream): Logger {
  return pino(
    {
      level:
        process.env["LOG_LEVEL"] ??
        (process.env.NODE_ENV === "production" ? "info" : "debug"),
      redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
      // JSON lines with ISO timestamps (NFR-OBS-002).
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { level: (label) => ({ level: label }) },
    },
    destination,
  );
}

export const logger: Logger = createLogger();

/** A child logger that stamps every line with the request id. */
export function requestLogger(requestId: string): Logger {
  return logger.child({ requestId });
}
