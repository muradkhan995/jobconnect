import { z } from "zod";
import { apiRoute, json } from "@/lib/http/api";
import { DomainError } from "@/lib/http/errors";
import { listJobsForAdmin } from "@/modules/job/service";

const Status = z
  .enum([
    "DRAFT",
    "PENDING_APPROVAL",
    "PUBLISHED",
    "PAUSED",
    "REJECTED",
    "CLOSED",
    "REMOVED",
  ])
  .default("PENDING_APPROVAL");

/** GET /api/v1/admin/jobs?status=PENDING_APPROVAL – approval queue, oldest first (FR-ADM-009). */
export const GET = apiRoute({ roles: ["ADMIN"] }, async ({ request, user }) => {
  const parsed = Status.safeParse(
    new URL(request.url).searchParams.get("status") ?? undefined,
  );
  if (!parsed.success) {
    throw new DomainError(400, "VALIDATION_FAILED", "Unknown status filter.", [
      {
        field: "status",
        message: "Use a job status such as PENDING_APPROVAL.",
      },
    ]);
  }
  return json({ items: await listJobsForAdmin(user, parsed.data) });
});
