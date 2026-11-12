import { z } from "zod";
import { apiRoute, json } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { isEmployerJobAction } from "@/modules/job/rules";
import { employerJobAction } from "@/modules/job/service";

/** POST /api/v1/employer/jobs/{id}/submit | pause | resume | close (API design §4.7). */
export const POST = apiRoute<{ id: string; action: string }>(
  { roles: ["EMPLOYER"] },
  async ({ params, user }) => {
    if (
      !isEmployerJobAction(params.action) ||
      !z.uuid().safeParse(params.id).success
    ) {
      throw notFound("This action");
    }
    return json(await employerJobAction(user, params.id, params.action));
  },
);
