import "server-only";
import { getDb } from "@/lib/db";
import { DomainError, notFound } from "@/lib/http/errors";
import { requestLogger } from "@/lib/logger";
import { copyObject, deleteObject } from "@/lib/storage";
import { uuidv7 } from "@/lib/uuidv7";
import { requireRole } from "@/modules/auth/policy";
import type { CurrentUser } from "@/modules/auth/session";
import { isJobVisible } from "@/modules/job/search";
import type { ApplyInput } from "./schemas";

const alreadyApplied = () =>
  new DomainError(
    409,
    "ALREADY_APPLIED",
    "You have already applied to this job.",
  );

/**
 * Apply for a job (FR-CAN-010/011/012, BR-APP-001…003):
 * active candidate with a profile · job publicly visible and before its deadline · own CV ·
 * once per job, ever · the CV is copied to an immutable snapshot.
 */
export async function applyForJob(
  user: CurrentUser,
  input: ApplyInput,
  meta: { requestId: string },
) {
  requireRole(user, "CANDIDATE");
  const db = getDb();
  const profile = await db.candidateProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile)
    throw new DomainError(
      422,
      "PROFILE_REQUIRED",
      "Add your name and a CV before applying.",
    );

  if (!(await isJobVisible(input.jobId))) {
    // A published job past its deadline gets a clear answer; anything else simply "doesn't exist".
    const job = await db.job.findUnique({
      where: { id: input.jobId },
      select: { status: true, deadline: true },
    });
    if (job?.status === "PUBLISHED" && job.deadline <= new Date()) {
      throw new DomainError(
        422,
        "DEADLINE_PASSED",
        "Applications for this job have closed.",
      );
    }
    throw notFound("This job");
  }

  const cv = await db.cv.findFirst({
    where: { id: input.cvId, candidateId: profile.userId },
  });
  if (!cv) throw notFound("This CV");

  const existing = await db.application.findUnique({
    where: {
      jobId_candidateId: { jobId: input.jobId, candidateId: profile.userId },
    },
    select: { id: true },
  });
  if (existing) throw alreadyApplied();

  const id = uuidv7();
  const snapshotKey = `applications/${id}/cv`;
  await copyObject(cv.storageKey, snapshotKey); // BR-APP-003: later CV changes don't affect it
  try {
    return await db.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          id,
          jobId: input.jobId,
          candidateId: profile.userId,
          cvStorageKey: snapshotKey,
          cvOriginalFilename: cv.originalFilename,
          cvMimeType: cv.mimeType,
          cvSizeBytes: cv.sizeBytes,
          coverLetter: input.coverLetter,
          status: "APPLIED",
        },
        select: { id: true, status: true, appliedAt: true },
      });
      await tx.applicationStatusHistory.create({
        data: {
          id: uuidv7(),
          applicationId: id,
          fromStatus: null,
          toStatus: "APPLIED",
          changedByUserId: user.id,
        },
      });
      return application;
    });
  } catch (err) {
    await deleteObject(snapshotKey).catch((e: unknown) =>
      requestLogger(meta.requestId).error(
        { err: e },
        "orphaned CV snapshot cleanup failed",
      ),
    );
    // UNIQUE (job_id, candidate_id): a double click or two tabs can't create two applications.
    if ((err as { code?: string }).code === "P2002") throw alreadyApplied();
    throw err;
  }
}

/** FR-CAN-013: the caller's own applications, newest first. Never anyone else's. */
export async function listMyApplications(user: CurrentUser) {
  requireRole(user, "CANDIDATE");
  return getDb().application.findMany({
    where: { candidateId: user.id },
    orderBy: { appliedAt: "desc" },
    select: {
      id: true,
      status: true,
      appliedAt: true,
      updatedAt: true,
      job: {
        select: { id: true, title: true, company: { select: { name: true } } },
      },
    },
  });
}

/** One of the caller's own applications with its timeline; anyone else's is "not found". */
export async function getMyApplication(user: CurrentUser, id: string) {
  requireRole(user, "CANDIDATE");
  const application = await getDb().application.findFirst({
    where: { id, candidateId: user.id },
    select: {
      id: true,
      status: true,
      appliedAt: true,
      coverLetter: true,
      cvOriginalFilename: true,
      job: {
        select: {
          id: true,
          title: true,
          location: true,
          company: { select: { name: true } },
        },
      },
      // Internal notes (Release 1.0) are a separate table and are never selected here (BR-APP-008).
      history: {
        orderBy: { changedAt: "asc" },
        select: { toStatus: true, message: true, changedAt: true },
      },
    },
  });
  if (!application) throw notFound("This application");
  return application;
}

/** For the job page: has the caller applied to this job, and what's the status? */
export async function myApplicationForJob(user: CurrentUser, jobId: string) {
  if (user.role !== "CANDIDATE") return null;
  return getDb().application.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: user.id } },
    select: { id: true, status: true, appliedAt: true },
  });
}
