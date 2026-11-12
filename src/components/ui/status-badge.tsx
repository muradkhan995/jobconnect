const tones = {
  neutral:
    "bg-zinc-100 text-zinc-800 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700",
  success:
    "bg-green-50 text-green-800 ring-green-300 dark:bg-green-950 dark:text-green-200 dark:ring-green-900",
  warning:
    "bg-amber-50 text-amber-900 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900",
  danger:
    "bg-red-50 text-red-800 ring-red-300 dark:bg-red-950 dark:text-red-200 dark:ring-red-900",
};

/** Status shown as text, with colour only as a supporting cue (docs/11 P6). */
export function StatusBadge({
  tone,
  children,
}: {
  tone: keyof typeof tones;
  children: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
