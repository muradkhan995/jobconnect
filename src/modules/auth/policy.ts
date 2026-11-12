import { forbiddenRole } from "@/lib/http/errors";
import type { CurrentUser } from "@/modules/auth/session";

/** Service-level role check (NFR-SEC-003). Proxy and apiRoute check too; this one never trusts them. */
export function requireRole(
  user: CurrentUser,
  role: CurrentUser["role"],
): void {
  if (user.role !== role) throw forbiddenRole();
}
