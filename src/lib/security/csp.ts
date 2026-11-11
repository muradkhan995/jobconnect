/**
 * Content Security Policy for HTML pages (NFR-SEC-005, ADR-008).
 * A fresh nonce per request lets Next.js's own scripts run while blocking any
 * injected script. `'strict-dynamic'` lets nonce-trusted scripts load their chunks.
 */
export function buildPageCsp(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    // React needs eval only in development (error overlays / stack reconstruction).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Dev styles are injected without a nonce by the HMR runtime.
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (!isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

/** API responses are JSON and must never be rendered or framed as a document. */
export const API_CSP = "default-src 'none'; frame-ancestors 'none'";

/** 128 bits of randomness, base64 – unguessable per request. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
