import type { FieldError } from "@/lib/http/problem";

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      message: string;
      fieldErrors: Record<string, string>;
    };

/**
 * Browser-side call to our JSON API. Same origin, so the session cookie is sent and the
 * CSRF Origin check passes. Errors come back as RFC 9457 problems (API design §2).
 */
export async function callApi<T>(
  path: string,
  init: { method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown },
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method,
      headers:
        init.body === undefined
          ? undefined
          : { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: "You seem to be offline. Try again.",
      fieldErrors: {},
    };
  }
  if (res.ok) return { ok: true, data: (await res.json()) as T };
  const problem = (await res.json().catch(() => null)) as {
    title?: string;
    errors?: FieldError[];
    requestId?: string;
  } | null;
  const fieldErrors: Record<string, string> = {};
  for (const e of problem?.errors ?? []) fieldErrors[e.field] ??= e.message;
  let message = problem?.title ?? "Something went wrong. Please try again.";
  if (res.status === 429) message = "Too many attempts. Try again in a minute.";
  if (res.status >= 500 && problem?.requestId)
    message += ` (Reference: ${problem.requestId})`;
  return { ok: false, status: res.status, message, fieldErrors };
}
