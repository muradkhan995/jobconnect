export type HealthStatus = { status: "ok" };

/**
 * Health payload for GET /api/health (NFR-OBS-001).
 * Deliberately exposes no version, hostname or other internal details.
 * A database check is added together with Prisma.
 */
export function getHealth(): HealthStatus {
  return { status: "ok" };
}
