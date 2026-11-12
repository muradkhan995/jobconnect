import type { Metadata } from "next";
import Link from "next/link";
import { safeNext } from "@/modules/auth/safe-next";
import { requireUser } from "@/modules/auth/session";
import { CvManager } from "@/modules/candidate/components/cv-manager";
import { ProfileForm } from "@/modules/candidate/components/profile-form";
import { CV_MAX_COUNT } from "@/modules/candidate/cv-file";
import { getMyProfile, listMyCvs } from "@/modules/candidate/service";

export const metadata: Metadata = { title: "Profile & CVs · JobConnect" };

/** FR-CAN-001 + FR-CAN-005. ?next= returns the candidate to the job they wanted to apply for. */
export default async function CandidateProfilePage({
  searchParams,
}: PageProps<"/candidate/profile">) {
  const user = await requireUser(["CANDIDATE"], "/candidate/profile");
  const params = await searchParams;
  const next =
    typeof params["next"] === "string" ? safeNext(params["next"], "") : "";
  const [profile, cvs] = await Promise.all([
    getMyProfile(user),
    listMyCvs(user),
  ]);
  const ready = Boolean(profile) && cvs.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Profile & CVs</h1>
      {next && (
        <p className="rounded-lg border border-zinc-300 p-4 text-sm dark:border-zinc-700">
          {ready ? (
            <>
              You&apos;re ready to apply.{" "}
              <Link href={next} className="font-medium underline">
                Back to the job
              </Link>
            </>
          ) : (
            "Add your name and at least one CV, then you can apply."
          )}
        </p>
      )}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold">Your profile</h2>
        <ProfileForm initial={profile} />
      </section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold">Your CVs</h2>
        {profile ? (
          <CvManager
            max={CV_MAX_COUNT}
            cvs={cvs.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
            }))}
          />
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Save your profile first, then upload your CVs.
          </p>
        )}
      </section>
    </main>
  );
}
