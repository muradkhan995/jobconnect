import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/modules/auth/session";
import { countCompaniesByStatus } from "@/modules/company/service";

export const metadata: Metadata = { title: "Admin · JobConnect" };

export default async function AdminHome() {
  const admin = await requireUser(["ADMIN"], "/admin");
  const counts = await countCompaniesByStatus(admin);
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Welcome, {admin.name.split(" ")[0]}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Verify companies before their jobs can go live. Job approval is coming
        next.
      </p>
      <Link
        href="/admin/companies"
        className="flex max-w-sm flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-6 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Companies awaiting verification
        </span>
        <span className="text-4xl font-semibold">{counts.PENDING}</span>
        <span className="text-sm font-medium underline">Open the queue</span>
      </Link>
    </main>
  );
}
