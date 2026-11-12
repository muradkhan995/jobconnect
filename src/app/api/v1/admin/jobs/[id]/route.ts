import { z } from "zod";
import { apiRoute, json } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { getJobForAdmin } from "@/modules/job/service";

/** GET /api/v1/admin/jobs/{id} (FR-ADM-010). */
export const GET = apiRoute<{ id: string }>(
  { roles: ["ADMIN"] },
  async ({ params, user }) => {
    if (!z.uuid().safeParse(params.id).success) throw notFound("This job");
    return json(await getJobForAdmin(user, params.id));
  },
);
