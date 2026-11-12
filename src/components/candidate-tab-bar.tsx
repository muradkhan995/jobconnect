"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/jobs",
    label: "Find jobs",
    match: (p: string) => p === "/jobs" || p.startsWith("/jobs/"),
    icon: "M21 21l-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z",
  },
  {
    href: "/candidate/applications",
    label: "Applied",
    match: (p: string) => p.startsWith("/candidate/applications"),
    icon: "M9 12l2 2 4-4M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
  },
  {
    href: "/candidate/profile",
    label: "Me",
    match: (p: string) => p.startsWith("/candidate/profile"),
    icon: "M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
];

/**
 * Candidate bottom tab bar on phones (PO decision D-07, docs/04-design/01-ui-flows.md §2.1):
 * three tabs, icon + text, ≥ 44 px targets. Hidden from 640 px up, where the header nav shows.
 */
export function CandidateTabBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Candidate"
      className="fixed inset-x-0 bottom-0 z-20 grid h-16 grid-cols-3 border-t border-zinc-200 bg-white sm:hidden dark:border-zinc-800 dark:bg-zinc-950"
    >
      {TABS.map((t) => {
        const active = t.match(path);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs font-medium text-zinc-600 aria-[current=page]:text-zinc-900 dark:text-zinc-400 dark:aria-[current=page]:text-zinc-100"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={t.icon} />
            </svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
