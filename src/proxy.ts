import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { createRequestId, REQUEST_ID_HEADER } from "@/lib/http/request-id";
import { problem, problemResponse } from "@/lib/http/problem";
import { API_CSP, buildPageCsp, createNonce } from "@/lib/security/csp";
import { isCsrfSafe } from "@/lib/security/csrf";

/**
 * Runs before every request (except static assets):
 * 1. gives the request an id (NFR-OBS-002),
 * 2. rejects cross-origin state-changing API calls (NFR-SEC-006),
 * 3. sets a per-request nonce CSP on pages (NFR-SEC-005, ADR-008),
 * 4. gates role areas (/admin, /employer) before any HTML is streamed, so the response gets a
 *    real 307 (login) or 404 status. Pages and the API check again (NFR-SEC-003).
 */
const ROLE_AREAS = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/employer", role: "EMPLOYER" },
] as const;

function areaFor(pathname: string) {
  return ROLE_AREAS.find(
    (a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
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

  const area = areaFor(request.nextUrl.pathname);
  if (area) {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set(
        "next",
        request.nextUrl.pathname + request.nextUrl.search,
      );
      return NextResponse.redirect(login, {
        headers: { [REQUEST_ID_HEADER]: requestId },
      });
    }
    if (session.user.role !== area.role) {
      // Same answer as for a page that doesn't exist: other roles' areas aren't revealed.
      return new NextResponse("Not found", {
        status: 404,
        headers: {
          [REQUEST_ID_HEADER]: requestId,
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
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
