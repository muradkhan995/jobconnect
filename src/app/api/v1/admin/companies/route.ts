import { z } from "zod";
import { apiRoute, json } from "@/lib/http/api";
import { DomainError } from "@/lib/http/errors";
import { listCompaniesForAdmin } from "@/modules/company/service";

const Status = z
  .enum(["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"])
  .default("PENDING");

/** GET /api/v1/admin/companies?status=PENDING – verification queue, oldest first (FR-ADM-007). */
export const GET = apiRoute({ roles: ["ADMIN"] }, async ({ request, user }) => {
  const parsed = Status.safeParse(
    new URL(request.url).searchParams.get("status") ?? undefined,
  );
  if (!parsed.success) {
    throw new DomainError(400, "VALIDATION_FAILED", "Unknown status filter.", [
      {
        field: "status",
        message: "Use PENDING, VERIFIED, REJECTED or SUSPENDED.",
      },
    ]);
  }
  return json({ items: await listCompaniesForAdmin(user, parsed.data) });
});
