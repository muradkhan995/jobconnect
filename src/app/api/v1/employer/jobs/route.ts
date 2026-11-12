import { apiRoute, json, parseBody } from "@/lib/http/api";
import { JobInput } from "@/modules/job/schemas";
import { createJob, listMyJobs } from "@/modules/job/service";

const employer = { roles: ["EMPLOYER"] } as const;

/** GET /api/v1/employer/jobs – own company's jobs, all statuses (FR-EMP-013). */
export const GET = apiRoute(employer, async ({ user }) =>
  json({ items: await listMyJobs(user) }),
);

/** POST – create a DRAFT (FR-EMP-006/007). */
export const POST = apiRoute(employer, async ({ request, user }) =>
  json(await createJob(user, await parseBody(request, JobInput)), 201),
);
