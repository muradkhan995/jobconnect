import { apiRoute, json, parseBody } from "@/lib/http/api";
import { ApplyInput } from "@/modules/application/schemas";
import { applyForJob, listMyApplications } from "@/modules/application/service";

const candidate = { roles: ["CANDIDATE"] } as const;

/** GET /api/v1/candidate/applications – the caller's own applications (FR-CAN-013). */
export const GET = apiRoute(candidate, async ({ user }) =>
  json({ items: await listMyApplications(user) }),
);

/** POST { jobId, cvId, coverLetter? } – apply (FR-CAN-010/011/012). */
export const POST = apiRoute(candidate, async ({ request, user, requestId }) =>
  json(
    await applyForJob(user, await parseBody(request, ApplyInput), {
      requestId,
    }),
    201,
  ),
);
