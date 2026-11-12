import Link from "next/link";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { getCurrentUser } from "@/modules/auth/session";

const ROLE_LABEL = {
  CANDIDATE: "Candidate",
  EMPLOYER: "Employer",
  ADMIN: "Admin",
} as const;

/** Main navigation per role (docs/04-design/01-ui-flows.md §2.1). Grows as features land. */
const ROLE_NAV: Record<
  keyof typeof ROLE_LABEL,
  { href: string; label: string }[]
> = {
  CANDIDATE: [
    { href: "/jobs", label: "Find jobs" },
    { href: "/candidate/applications", label: "My applications" },
    { href: "/candidate/profile", label: "Profile & CVs" },
  ],
  EMPLOYER: [
    { href: "/employer", label: "Dashboard" },
    { href: "/employer/jobs", label: "Jobs" },
    { href: "/employer/company", label: "Company" },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/companies", label: "Companies" },
    { href: "/admin/jobs", label: "Jobs" },
  ],
};

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            JobConnect
          </Link>
          {user && ROLE_NAV[user.role].length > 0 && (
            <nav aria-label="Main" className="hidden gap-4 text-sm sm:flex">
              {ROLE_NAV[user.role].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-zinc-700 hover:underline dark:text-zinc-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <nav
          aria-label="Account"
          className="flex items-center gap-1 text-sm sm:gap-3"
        >
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
                href="/jobs"
                className="rounded-lg px-2 py-2 font-medium whitespace-nowrap sm:px-3 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Find jobs
              </Link>
              <Link
                href="/login"
                className="rounded-lg px-2 py-2 font-medium whitespace-nowrap sm:px-3 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-zinc-900 px-2 py-2 font-medium whitespace-nowrap sm:px-3 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
      {/* Phones: employers and admins get their links as a second row (candidates use the
          bottom tab bar – components/candidate-tab-bar.tsx). */}
      {user && user.role !== "CANDIDATE" && ROLE_NAV[user.role].length > 0 && (
        <nav
          aria-label="Main (mobile)"
          className="flex gap-5 overflow-x-auto border-t border-zinc-100 px-4 py-2 text-sm sm:hidden dark:border-zinc-900"
        >
          {ROLE_NAV[user.role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap py-1.5 font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
