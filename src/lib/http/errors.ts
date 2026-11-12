import type { ErrorCode, FieldError } from "@/lib/http/problem";

/**
 * A business-rule failure with a safe, user-facing message. Services throw these;
 * the API wrapper turns them into RFC 9457 responses (API design §2).
 */
export class DomainError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const notFound = (what = "This item") =>
  new DomainError(404, "NOT_FOUND", `${what} doesn't exist.`);

export const forbiddenRole = () =>
  new DomainError(403, "FORBIDDEN_ROLE", "Your account type can't do this.");

export const invalidTransition = (message: string) =>
  new DomainError(409, "INVALID_TRANSITION", message);

/** Someone else changed the record first (guarded update matched 0 rows, docs/09 §4). */
export const stateChanged = () =>
  new DomainError(
    409,
    "STATE_CHANGED",
    "This was updated by someone else. Refresh to see the latest.",
  );
