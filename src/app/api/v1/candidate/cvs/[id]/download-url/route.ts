import { z } from "zod";
import { apiRoute, json } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { myCvDownloadUrl } from "@/modules/candidate/service";

/** GET /api/v1/candidate/cvs/{id}/download-url → { url, expiresAt } (5 minutes, NFR-SEC-008). */
export const GET = apiRoute<{ id: string }>(
  { roles: ["CANDIDATE"] },
  async ({ params, user }) => {
    if (!z.uuid().safeParse(params.id).success) throw notFound("This CV");
    return json(await myCvDownloadUrl(user, params.id));
  },
);
