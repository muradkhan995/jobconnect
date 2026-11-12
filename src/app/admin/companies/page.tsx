import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CompanyStatus } from "@/generated/prisma/enums";
import { requireUser } from "@/modules/auth/session";
import { COMPANY_STATUS_LABEL } from "@/modules/company/labels";
import {
  countCompaniesByStatus,
  listCompaniesForAdmin,
} from "@/modules/company/service";

export const metadata: Metadata = { title: "Companies · Admin · JobConnect" };

const TABS: CompanyStatus[] = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"];
const DONE: Record<string, string> = {
  verify: "Company verified. The employer has been emailed.",
  reject: "Company rejected. The employer has been emailed with your reason.",
  suspend: "Company suspended. The employer has been emailed with your reason.",
  reinstate: "Company reinstated. The employer has been emailed.",
};

function waiting(since: Date): string {
  const days = Math.floor((Date.now() - since.getTime()) / 86_400_000);
  return days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`;
}

export default async function AdminCompanies({
  searchParams,
}: PageProps<"/admin/companies">) {
  const admin = await requireUser(["ADMIN"], "/admin/companies");
  const params = await searchParams;
  const status = TABS.find((t) => t === params["status"]) ?? "PENDING";
  const done =
    typeof params["done"] === "string" ? DONE[params["done"]] : undefined;
  const [companies, counts] = await Promise.all([
    listCompaniesForAdmin(admin, status),
    countCompaniesByStatus(admin),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Companies</h1>
      {done && <Alert tone="success">{done}</Alert>}

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/companies?status=${t}`}
            aria-current={t === status ? "page" : undefined}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm aria-[current=page]:border-zinc-900 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-white dark:border-zinc-700 dark:aria-[current=page]:bg-zinc-100 dark:aria-[current=page]:text-zinc-900"
          >
            {COMPANY_STATUS_LABEL[t].admin} ({counts[t]})
          </Link>
        ))}
      </nav>

      {companies.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          {status === "PENDING"
            ? "Nothing to review. 🎉"
            : "No companies with this status."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              {COMPANY_STATUS_LABEL[status].admin} companies
            </caption>
            <thead className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Company
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Industry
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Location
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {status === "PENDING" ? "Waiting" : "Status"}
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.industry.name}</td>
                  <td className="px-4 py-3">{c.location}</td>
                  <td className="px-4 py-3">
                    {status === "PENDING" ? (
                      waiting(c.submittedAt)
                    ) : (
                      <StatusBadge
                        tone={COMPANY_STATUS_LABEL[c.verificationStatus].tone}
                      >
                        {COMPANY_STATUS_LABEL[c.verificationStatus].admin}
                      </StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/companies/${c.id}`}
                      className="font-medium underline"
                    >
                      Review<span className="sr-only"> {c.name}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
