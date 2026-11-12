/**
 * RFC 9457 Problem Details – the single error format for the API (API design §2).
 */
export type ErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN_ROLE"
  | "CSRF_ORIGIN_MISMATCH"
  | "ACCOUNT_SUSPENDED"
  | "NOT_FOUND"
  | "ALREADY_APPLIED"
  | "INVALID_TRANSITION"
  | "STATE_CHANGED"
  | "COMPANY_EXISTS"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "DEADLINE_PASSED"
  | "COMPANY_NOT_VERIFIED"
  | "CV_LIMIT_REACHED"
  | "PROFILE_REQUIRED"
  | "DEADLINE_OUT_OF_RANGE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type FieldError = { field: string; message: string };

export type Problem = {
  type: string;
  title: string;
  status: number;
  code: ErrorCode;
  requestId: string;
  errors: FieldError[];
};

export const PROBLEM_CONTENT_TYPE = "application/problem+json";

const TYPE_BASE = "https://jobconnect.example/errors/";

export function problem(args: {
  status: number;
  code: ErrorCode;
  title: string;
  requestId: string;
  errors?: FieldError[];
}): Problem {
  return {
    type: TYPE_BASE + args.code.toLowerCase().replaceAll("_", "-"),
    title: args.title,
    status: args.status,
    code: args.code,
    requestId: args.requestId,
    errors: args.errors ?? [],
  };
}

export function problemResponse(
  p: Problem,
  init?: { headers?: HeadersInit },
): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", PROBLEM_CONTENT_TYPE);
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(p), { status: p.status, headers });
}
