import "server-only";
import { getDb } from "@/lib/db";
import { DomainError, notFound } from "@/lib/http/errors";
import { requestLogger } from "@/lib/logger";
import { deleteObject, putObject, signedDownloadUrl } from "@/lib/storage";
import { uuidv7 } from "@/lib/uuidv7";
import { requireRole } from "@/modules/auth/policy";
import type { CurrentUser } from "@/modules/auth/session";
import { CV_MAX_COUNT, checkCvFile, cleanFilename } from "./cv-file";
import type { ProfileInput } from "./schemas";

const cvSelect = {
  id: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
} as const;

// ── Profile (FR-CAN-001) ──────────────────────────────────────────────────────

export async function getMyProfile(user: CurrentUser) {
  requireRole(user, "CANDIDATE");
  return getDb().candidateProfile.findUnique({ where: { userId: user.id } });
}

/** Creates or replaces the caller's own profile – the only profile a candidate can touch. */
export async function saveMyProfile(user: CurrentUser, input: ProfileInput) {
  requireRole(user, "CANDIDATE");
  return getDb().candidateProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...input },
    update: input,
  });
}

async function requireProfile(user: CurrentUser) {
  requireRole(user, "CANDIDATE");
  const profile = await getDb().candidateProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    throw new DomainError(
      422,
      "PROFILE_REQUIRED",
      "Add your name to your profile first.",
    );
  }
  return profile;
}

// ── CVs (FR-CAN-005, NFR-SEC-008) ─────────────────────────────────────────────

export async function listMyCvs(user: CurrentUser) {
  requireRole(user, "CANDIDATE");
  return getDb().cv.findMany({
    where: { candidateId: user.id },
    orderBy: { createdAt: "desc" },
    select: cvSelect,
  });
}

/**
 * Stores a CV: type checked from the bytes, ≤ 5 MB, at most 5 per candidate. The limit is
 * checked while the candidate's profile row is locked, so two uploads at once can't both pass.
 */
export async function uploadCv(
  user: CurrentUser,
  file: { name: string; bytes: Uint8Array },
  meta: { requestId: string },
) {
  const profile = await requireProfile(user);
  const check = checkCvFile(file.bytes);
  if (!check.ok) {
    throw new DomainError(
      check.status,
      check.status === 413 ? "FILE_TOO_LARGE" : "UNSUPPORTED_FILE_TYPE",
      check.message,
    );
  }
  const id = uuidv7();
  const storageKey = `cvs/${profile.userId}/${id}`; // random, never the user's filename
  await putObject(storageKey, file.bytes, check.type);
  try {
    return await getDb().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM candidate_profile WHERE user_id = ${profile.userId}::uuid FOR UPDATE`;
      const count = await tx.cv.count({
        where: { candidateId: profile.userId },
      });
      if (count >= CV_MAX_COUNT) {
        throw new DomainError(
          422,
          "CV_LIMIT_REACHED",
          `You can keep up to ${CV_MAX_COUNT} CVs. Delete one first.`,
        );
      }
      return tx.cv.create({
        data: {
          id,
          candidateId: profile.userId,
          storageKey,
          originalFilename: cleanFilename(file.name, check.type),
          mimeType: check.type,
          sizeBytes: file.bytes.byteLength,
        },
        select: cvSelect,
      });
    });
  } catch (err) {
    // Don't leave an orphaned file behind when the database refuses the CV.
    await deleteObject(storageKey).catch((e: unknown) =>
      requestLogger(meta.requestId).error(
        { err: e },
        "orphaned CV cleanup failed",
      ),
    );
    throw err;
  }
}

/** Deletes one of the caller's CVs. Applications keep their own snapshot (BR-APP-003). */
export async function deleteMyCv(
  user: CurrentUser,
  cvId: string,
  meta: { requestId: string },
) {
  requireRole(user, "CANDIDATE");
  const cv = await getDb().cv.findFirst({
    where: { id: cvId, candidateId: user.id },
  });
  if (!cv) throw notFound("This CV");
  await getDb().cv.delete({ where: { id: cv.id } });
  await deleteObject(cv.storageKey).catch((err: unknown) =>
    requestLogger(meta.requestId).error(
      { err, cvId },
      "CV file delete failed (row already removed)",
    ),
  );
}

/** A 5-minute download link for one of the caller's own CVs. */
export async function myCvDownloadUrl(user: CurrentUser, cvId: string) {
  requireRole(user, "CANDIDATE");
  const cv = await getDb().cv.findFirst({
    where: { id: cvId, candidateId: user.id },
  });
  if (!cv) throw notFound("This CV");
  return signedDownloadUrl(cv.storageKey, cv.originalFilename);
}
