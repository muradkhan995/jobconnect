import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { SearchForm } from "@/modules/job/components/search-form";

export default async function Home() {
  const user = await getCurrentUser();
  // Each role has its own home (docs/11 §2).
  if (user?.role === "CANDIDATE") redirect("/jobs");
  if (user?.role === "EMPLOYER") redirect("/employer");
  if (user?.role === "ADMIN") redirect("/admin");
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Jobs from verified employers. Real status on every application.
        </h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          No more applications disappearing into a void. See where each one
          stands, from submission to decision.
        </p>
      </div>
      <div className="max-w-3xl rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <SearchForm compact />
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Hiring?{" "}
        <Link
          href="/register"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Create a free employer account
        </Link>
      </p>
    </main>
  );
}
