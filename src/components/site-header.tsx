import Link from "next/link";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { getCurrentUser } from "@/modules/auth/session";

const ROLE_LABEL = {
  CANDIDATE: "Candidate",
  EMPLOYER: "Employer",
  ADMIN: "Admin",
} as const;

/** Main navigation per role (docs/11 §2.1). Grows as features land. */
const ROLE_NAV: Record<
  keyof typeof ROLE_LABEL,
  { href: string; label: string }[]
> = {
  CANDIDATE: [],
  EMPLOYER: [
    { href: "/employer", label: "Dashboard" },
    { href: "/employer/company", label: "Company" },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/companies", label: "Companies" },
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
