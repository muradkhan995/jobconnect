import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StatusBadge } from "@/components/ui/status-badge";
import { DomainError } from "@/lib/http/errors";
import { requireUser } from "@/modules/auth/session";
import { CompanyDecision } from "@/modules/company/components/company-decision";
import { COMPANY_STATUS_LABEL } from "@/modules/company/labels";
import { COMPANY_SIZE_LABEL } from "@/modules/company/schemas";
import { getCompanyForAdmin } from "@/modules/company/service";

export const metadata: Metadata = {
  title: "Review company · Admin · JobConnect",
};

export default async function AdminCompanyReview({
  params,
}: PageProps<"/admin/companies/[id]">) {
  const { id } = await params;
  const admin = await requireUser(["ADMIN"], `/admin/companies/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();
  const company = await getCompanyForAdmin(admin, id).catch((err: unknown) => {
    if (err instanceof DomainError && err.status === 404) notFound();
    throw err;
  });
  const label = COMPANY_STATUS_LABEL[company.verificationStatus];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/admin/companies" className="text-sm underline">
        ← Back to queue
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {company.name}
        </h1>
        <StatusBadge tone={label.tone}>{label.admin}</StatusBadge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="font-semibold">Company details</h2>
          <p className="mt-3 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
            {company.description}
          </p>
          <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Industry</dt>
              <dd>{company.industry.name}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Size</dt>
              <dd>{COMPANY_SIZE_LABEL[company.size]}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Location</dt>
              <dd>{company.location}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Website</dt>
              <dd>
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline"
                  >
                    {company.website}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Submitted</dt>
              <dd>
                {company.submittedAt.toLocaleString("en-GB", {
                  timeZone: "Europe/London",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Owner</dt>
              <dd>
                {company.owner
                  ? `${company.owner.name} · ${company.owner.email}`
                  : "Account deleted"}
              </dd>
            </div>
          </dl>
          {company.statusReason && (
            <p className="mt-6 text-sm">
              <strong>Current reason:</strong> {company.statusReason}
            </p>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 font-semibold">Decision</h2>
          <CompanyDecision
            id={company.id}
            status={company.verificationStatus}
          />
        </section>
      </div>
    </main>
  );
}
