export type HealthStatus = { status: "ok" | "error" };

export type HealthResult = { httpStatus: 200 | 503; body: HealthStatus };

export const DB_PING_TIMEOUT_MS = 2000;

/**
 * Health check for GET /api/health (NFR-OBS-001).
 * Exposes no version, hostname or error details – only ok/error.
 * `pingDb` is injected so this stays a plain, unit-testable function.
 */
export async function checkHealth(
  pingDb: () => Promise<unknown>,
  timeoutMs: number = DB_PING_TIMEOUT_MS,
): Promise<HealthResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("db ping timed out")), timeoutMs);
  });
  try {
    await Promise.race([pingDb(), timeout]);
    return { httpStatus: 200, body: { status: "ok" } };
  } catch {
    return { httpStatus: 503, body: { status: "error" } };
  } finally {
    clearTimeout(timer);
  }
}
