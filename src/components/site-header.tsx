import Link from "next/link";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { getCurrentUser } from "@/modules/auth/session";

const ROLE_LABEL = {
  CANDIDATE: "Candidate",
  EMPLOYER: "Employer",
  ADMIN: "Admin",
} as const;

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          JobConnect
        </Link>
        <nav aria-label="Account" className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-zinc-600 sm:inline dark:text-zinc-400">
                {user.name} · {ROLE_LABEL[user.role]}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-zinc-900 px-3 py-2 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
