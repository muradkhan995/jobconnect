import { z } from "zod";
import { apiRoute, json, parseBody } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import {
  ADMIN_TRANSITIONS,
  isAdminCompanyAction,
} from "@/modules/company/rules";
import { ReasonInput } from "@/modules/company/schemas";
import { decideCompany } from "@/modules/company/service";

/**
 * POST /api/v1/admin/companies/{id}/verify | reject | suspend | reinstate
 * Each lifecycle change is its own action (API design §1.1). reject/suspend need { reason }.
 */
export const POST = apiRoute<{ id: string; action: string }>(
  { roles: ["ADMIN"] },
  async ({ request, params, user, requestId }) => {
    if (
      !isAdminCompanyAction(params.action) ||
      !z.uuid().safeParse(params.id).success
    ) {
      throw notFound("This action");
    }
    const reason = ADMIN_TRANSITIONS[params.action].needsReason
      ? (await parseBody(request, ReasonInput)).reason
      : null;
    return json(
      await decideCompany(user, params.id, params.action, reason, {
        requestId,
      }),
    );
  },
);
