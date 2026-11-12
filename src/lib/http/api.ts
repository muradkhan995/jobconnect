import "server-only";
import { z, type ZodType } from "zod";
import { getAuth } from "@/lib/auth";
import { DomainError } from "@/lib/http/errors";
import { problem, problemResponse, type FieldError } from "@/lib/http/problem";
import { getRequestId } from "@/lib/http/request-id";
import { requestLogger } from "@/lib/logger";
import type { CurrentUser } from "@/modules/auth/session";

type Role = CurrentUser["role"];

export type ApiContext<P> = {
  request: Request;
  requestId: string;
  log: ReturnType<typeof requestLogger>;
  params: P;
};

type Options = { roles?: readonly Role[] };

/** Turns a Zod error into field errors: `{ field: "website", message: "…" }`. */
export function toFieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map((i) => ({
    field: i.path.join(".") || "body",
    message: i.message,
  }));
}

/** Parses the JSON body with a schema; invalid JSON or input → 400 VALIDATION_FAILED. */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new DomainError(
      400,
      "VALIDATION_FAILED",
      "The request body must be JSON.",
    );
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new DomainError(
      400,
      "VALIDATION_FAILED",
      "Please check the highlighted fields.",
      toFieldErrors(parsed.error),
    );
  }
  return parsed.data;
}

/** Runs a handler and turns any error into an RFC 9457 response with the request id. */
async function withProblems(
  requestId: string,
  log: ReturnType<typeof requestLogger>,
  run: () => Promise<Response>,
): Promise<Response> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof DomainError) {
      return problemResponse(
        problem({
          status: err.status,
          code: err.code,
          title: err.message,
          requestId,
          errors: err.fieldErrors,
        }),
      );
    }
    log.error({ err }, "unhandled API error");
    return problemResponse(
      problem({
        status: 500,
        code: "INTERNAL_ERROR",
        title: "Something went wrong. Please try again.",
        requestId,
      }),
    );
  }
}

/**
 * Wraps an API route handler with the checks every endpoint needs (API design §1–2):
 * session (401), role (403), and error → problem+json mapping with the request id.
 */
export function apiRoute<P = Record<string, never>>(
  options: Options,
  handler: (ctx: ApiContext<P> & { user: CurrentUser }) => Promise<Response>,
) {
  return async (
    request: Request,
    route: { params: Promise<P> },
  ): Promise<Response> => {
    const requestId = getRequestId(request.headers);
    const log = requestLogger(requestId);
    return withProblems(requestId, log, async () => {
      const session = await getAuth().api.getSession({
        headers: request.headers,
      });
      if (!session) {
        throw new DomainError(401, "UNAUTHENTICATED", "Please log in.");
      }
      const user: CurrentUser = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as Role,
      };
      if (options.roles && !options.roles.includes(user.role)) {
        throw new DomainError(
          403,
          "FORBIDDEN_ROLE",
          "Your account type can't do this.",
        );
      }
      const params = await route.params;
      return handler({ request, requestId, log, params, user });
    });
  };
}

/** For endpoints anyone may call (e.g. public job search): same error format, no session. */
export function publicRoute<P = Record<string, never>>(
  handler: (ctx: ApiContext<P>) => Promise<Response>,
) {
  return async (
    request: Request,
    route: { params: Promise<P> },
  ): Promise<Response> => {
    const requestId = getRequestId(request.headers);
    const log = requestLogger(requestId);
    return withProblems(requestId, log, async () =>
      handler({ request, requestId, log, params: await route.params }),
    );
  };
}

/** JSON success response that is never cached (personal data). */
export function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
