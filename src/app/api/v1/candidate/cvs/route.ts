import { apiRoute, json } from "@/lib/http/api";
import { DomainError } from "@/lib/http/errors";
import { CV_MAX_BYTES } from "@/modules/candidate/cv-file";
import { listMyCvs, uploadCv } from "@/modules/candidate/service";

const candidate = { roles: ["CANDIDATE"] } as const;

/** GET /api/v1/candidate/cvs – metadata only (FR-CAN-005). */
export const GET = apiRoute(candidate, async ({ user }) =>
  json({ items: await listMyCvs(user) }),
);

/** POST multipart/form-data, field "file". Type is checked from the bytes (NFR-SEC-008). */
export const POST = apiRoute(
  candidate,
  async ({ request, user, requestId }) => {
    // Refuse obviously oversized uploads before reading them into memory.
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > CV_MAX_BYTES + 64 * 1024) {
      throw new DomainError(413, "FILE_TOO_LARGE", "CVs can be up to 5 MB.");
    }
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      throw new DomainError(
        400,
        "VALIDATION_FAILED",
        "Choose a file to upload.",
        [{ field: "file", message: "Choose a PDF or Word (.docx) file." }],
      );
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    return json(
      await uploadCv(user, { name: file.name, bytes }, { requestId }),
      201,
    );
  },
);
