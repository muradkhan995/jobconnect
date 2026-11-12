import { z } from "zod";
import { apiRoute } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { deleteMyCv } from "@/modules/candidate/service";

/** DELETE /api/v1/candidate/cvs/{id} – submitted applications keep their snapshot (BR-APP-003). */
export const DELETE = apiRoute<{ id: string }>(
  { roles: ["CANDIDATE"] },
  async ({ params, user, requestId }) => {
    if (!z.uuid().safeParse(params.id).success) throw notFound("This CV");
    await deleteMyCv(user, params.id, { requestId });
    return new Response(null, { status: 204 });
  },
);
