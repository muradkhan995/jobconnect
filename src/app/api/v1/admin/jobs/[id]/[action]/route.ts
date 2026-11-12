import { z } from "zod";
import { apiRoute, json, parseBody } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { ReasonInput } from "@/modules/company/schemas";
import { ADMIN_TRANSITIONS, isAdminJobAction } from "@/modules/job/rules";
import { decideJob } from "@/modules/job/service";

/** POST /api/v1/admin/jobs/{id}/approve | reject | remove – reject/remove need { reason }. */
export const POST = apiRoute<{ id: string; action: string }>(
  { roles: ["ADMIN"] },
  async ({ request, params, user, requestId }) => {
    if (
      !isAdminJobAction(params.action) ||
      !z.uuid().safeParse(params.id).success
    ) {
      throw notFound("This action");
    }
    const reason = ADMIN_TRANSITIONS[params.action].needsReason
      ? (await parseBody(request, ReasonInput)).reason
      : null;
    return json(
      await decideJob(user, params.id, params.action, reason, { requestId }),
    );
  },
);
