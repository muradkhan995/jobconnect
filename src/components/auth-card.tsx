import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </div>
      {footer && (
        <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {footer}
        </div>
      )}
    </main>
  );
}
