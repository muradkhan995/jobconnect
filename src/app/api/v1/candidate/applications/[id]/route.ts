import { z } from "zod";
import { apiRoute, json } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { getMyApplication } from "@/modules/application/service";

/** GET /api/v1/candidate/applications/{id} – with status history; never internal notes. */
export const GET = apiRoute<{ id: string }>(
  { roles: ["CANDIDATE"] },
  async ({ params, user }) => {
    if (!z.uuid().safeParse(params.id).success)
      throw notFound("This application");
    return json(await getMyApplication(user, params.id));
  },
);
