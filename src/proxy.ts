import { NextResponse, type NextRequest } from "next/server";
import { createRequestId, REQUEST_ID_HEADER } from "@/lib/http/request-id";
import { problem, problemResponse } from "@/lib/http/problem";
import { API_CSP, buildPageCsp, createNonce } from "@/lib/security/csp";
import { isCsrfSafe } from "@/lib/security/csrf";

/**
 * Runs before every request (except static assets):
 * 1. gives the request an id (NFR-OBS-002),
 * 2. rejects cross-origin state-changing API calls (NFR-SEC-006),
 * 3. sets a per-request nonce CSP on pages (NFR-SEC-005, ADR-008).
 */
export function proxy(request: NextRequest) {
  const requestId = createRequestId();
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (
    isApi &&
    !isCsrfSafe(
      request.method,
      request.headers.get("origin"),
      request.nextUrl.origin,
    )
  ) {
    return problemResponse(
      problem({
        status: 403,
        code: "CSRF_ORIGIN_MISMATCH",
        title: "Request origin not allowed",
        requestId,
      }),
      {
        headers: {
          [REQUEST_ID_HEADER]: requestId,
          "Content-Security-Policy": API_CSP,
        },
      },
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  let csp = API_CSP;
  if (!isApi) {
    const nonce = createNonce();
    csp = buildPageCsp(nonce, process.env.NODE_ENV === "development");
    // Next.js reads the nonce from this request header and stamps it on its scripts.
    requestHeaders.set("Content-Security-Policy", csp);
    requestHeaders.set("x-nonce", nonce);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
