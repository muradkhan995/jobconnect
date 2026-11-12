import { z } from "zod";
import { apiRoute, json, parseBody } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { JobInput } from "@/modules/job/schemas";
import { getMyJob, updateJob } from "@/modules/job/service";

const employer = { roles: ["EMPLOYER"] } as const;
const validId = (id: string) => z.uuid().safeParse(id).success;

/** GET /api/v1/employer/jobs/{id} – one of the caller's own jobs. */
export const GET = apiRoute<{ id: string }>(
  employer,
  async ({ params, user }) => {
    if (!validId(params.id)) throw notFound("This job");
    return json(await getMyJob(user, params.id));
  },
);

/** PATCH – full edit (FR-EMP-009); material edits of live jobs go back for approval (BR-JOB-004). */
export const PATCH = apiRoute<{ id: string }>(
  employer,
  async ({ request, params, user }) => {
    if (!validId(params.id)) throw notFound("This job");
    return json(
      await updateJob(user, params.id, await parseBody(request, JobInput)),
    );
  },
);
