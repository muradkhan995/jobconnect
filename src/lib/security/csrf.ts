const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF protection for state-changing requests (NFR-SEC-006, API design §1).
 * Browsers always send `Origin` on cross-origin and same-origin POST/PATCH/PUT/DELETE,
 * and a web page cannot forge it. We require it to equal our own origin.
 * Requests without `Origin` (e.g. curl) are rejected for unsafe methods.
 */
export function isCsrfSafe(
  method: string,
  origin: string | null,
  ownOrigin: string,
): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  if (!origin || origin === "null") return false;
  return origin === ownOrigin;
}
