import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/modules/auth/session";
import { COMPANY_STATUS_LABEL } from "@/modules/company/labels";
import { getMyCompany } from "@/modules/company/service";

export const metadata: Metadata = { title: "Employer · JobConnect" };

const NEXT_STEP = {
  PENDING:
    "Our team is checking your company. You'll get an email when it's done – usually within 1 working day.",
  VERIFIED: "You're verified. Job posting is coming next.",
  REJECTED:
    "Your company needs changes before it can be verified. See the reason below, edit and resubmit.",
  SUSPENDED:
    "Your company is suspended and its jobs are hidden. Contact support.",
} as const;

export default async function EmployerHome({
  searchParams,
}: PageProps<"/employer">) {
  const user = await requireUser(["EMPLOYER"], "/employer");
  const company = await getMyCompany(user);
  const saved = (await searchParams)["saved"] === "1";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Welcome, {user.name.split(" ")[0]}
      </h1>
      {saved && (
        <Alert tone="success">Your company profile has been saved.</Alert>
      )}

      {!company ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">Create your company profile</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Before you can post jobs, our team verifies every company. This
            keeps scam adverts off JobConnect.
          </p>
          <Link
            href="/employer/company"
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Create company profile
          </Link>
        </section>
      ) : (
        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{company.name}</h2>
            <StatusBadge
              tone={COMPANY_STATUS_LABEL[company.verificationStatus].tone}
            >
              {COMPANY_STATUS_LABEL[company.verificationStatus].employer}
            </StatusBadge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            {NEXT_STEP[company.verificationStatus]}
          </p>
          {company.statusReason && (
            <Alert
              tone={
                company.verificationStatus === "REJECTED" ? "error" : "info"
              }
            >
              <strong>Reason from our team:</strong> {company.statusReason}
            </Alert>
          )}
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Industry</dt>
              <dd>{company.industry.name}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Location</dt>
              <dd>{company.location}</dd>
            </div>
          </dl>
          {company.verificationStatus !== "SUSPENDED" && (
            <Link
              href="/employer/company"
              className="self-start text-sm font-medium underline"
            >
              {company.verificationStatus === "REJECTED"
                ? "Edit and resubmit"
                : "Edit company profile"}
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
