import { z } from "zod";
import { json, publicRoute } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { getPublicJob, toPublicJob } from "@/modules/job/search";

/** GET /api/v1/jobs/{id} – a visible job's details (FR-CAN-008); anything else is 404. */
export const GET = publicRoute<{ id: string }>(async ({ params }) => {
  if (!z.uuid().safeParse(params.id).success) throw notFound("This job");
  return json(toPublicJob(await getPublicJob(params.id)));
});
