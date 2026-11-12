import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { APPLICATION_STATUS_LABEL } from "@/modules/application/labels";
import { myApplicationForJob } from "@/modules/application/service";
import { getCurrentUser } from "@/modules/auth/session";
import { getMyProfile, listMyCvs } from "@/modules/candidate/service";
import { ApplyForm } from "./apply-form";

const linkClass =
  "flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-700 sm:inline-flex sm:w-auto dark:bg-zinc-100 dark:text-zinc-900";

/** The candidate's apply area on a job page (docs/04-design/03-user-flow-diagrams.md J4). */
export async function CandidateApply({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "CANDIDATE") return null;
  const [existing, profile, cvs] = await Promise.all([
    myApplicationForJob(user, jobId),
    getMyProfile(user),
    listMyCvs(user),
  ]);

  if (existing) {
    const label = APPLICATION_STATUS_LABEL[existing.status];
    return (
      <Link
        href={`/candidate/applications/${existing.id}`}
        className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-3 text-sm sm:justify-start dark:border-zinc-700"
      >
        Applied on{" "}
        {existing.appliedAt.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}{" "}
        ·<StatusBadge tone={label.tone}>{label.candidate}</StatusBadge>
      </Link>
    );
  }

  if (!profile || cvs.length === 0) {
    return (
      <Link
        href={`/candidate/profile?next=${encodeURIComponent(`/jobs/${jobId}`)}`}
        className={linkClass}
      >
        Add your CV to apply
      </Link>
    );
  }

  return (
    <ApplyForm
      jobId={jobId}
      jobTitle={jobTitle}
      cvs={cvs.map(({ id, originalFilename }) => ({ id, originalFilename }))}
    />
  );
}
