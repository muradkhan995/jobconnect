export const REQUEST_ID_HEADER = "x-request-id";

/**
 * A new id for every request. Client-supplied ids are never trusted, so log lines
 * can't be forged or collided by a caller (NFR-OBS-002).
 */
export function createRequestId(): string {
  return crypto.randomUUID();
}

/** Reads the id the proxy attached; "unknown" only if the proxy did not run. */
export function getRequestId(headers: Headers): string {
  return headers.get(REQUEST_ID_HEADER) ?? "unknown";
}
