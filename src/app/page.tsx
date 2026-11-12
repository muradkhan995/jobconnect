import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

const NEXT_STEP = {
  CANDIDATE: "Next you'll be able to search jobs and track every application.",
} as const;

export default async function Home() {
  const user = await getCurrentUser();
  // Each role has its own home (docs/11 §2). Candidates get /jobs once search exists.
  if (user?.role === "EMPLOYER") redirect("/employer");
  if (user?.role === "ADMIN") redirect("/admin");
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      {user ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome, {user.name.split(" ")[0]}
          </h1>
          <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            {NEXT_STEP.CANDIDATE}
          </p>
        </>
      ) : (
        <>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Jobs from verified employers. Real status on every application.
          </h1>
          <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            No more applications disappearing into a void. See where each one
            stands, from submission to decision.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center rounded-lg bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Create a free account
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-lg border border-zinc-300 px-5 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Log in
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
