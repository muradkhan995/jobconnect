import { apiRoute, json, parseBody } from "@/lib/http/api";
import { notFound } from "@/lib/http/errors";
import { ProfileInput } from "@/modules/candidate/schemas";
import { getMyProfile, saveMyProfile } from "@/modules/candidate/service";

const candidate = { roles: ["CANDIDATE"] } as const;

/** GET /api/v1/candidate/profile (FR-CAN-001). */
export const GET = apiRoute(candidate, async ({ user }) => {
  const profile = await getMyProfile(user);
  if (!profile) throw notFound("Your profile");
  return json(profile);
});

/** PUT – create or replace the caller's own profile. */
export const PUT = apiRoute(candidate, async ({ request, user }) =>
  json(await saveMyProfile(user, await parseBody(request, ProfileInput))),
);
