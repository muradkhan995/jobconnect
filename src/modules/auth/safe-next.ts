/**
 * Where to send someone after logging in. Only same-site paths are allowed, so a crafted
 * `?next=` link can't bounce people to another site (open redirect). Browsers treat
 * "//evil.com" and "/\evil.com" as other sites, so both are refused.
 */
export function safeNext(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return fallback;
  }
  return next;
}
