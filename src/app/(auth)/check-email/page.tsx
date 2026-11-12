import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";

export const metadata: Metadata = { title: "Check your email · JobConnect" };

export default async function CheckEmailPage({
  searchParams,
}: PageProps<"/check-email">) {
  const params = await searchParams;
  const email = typeof params["email"] === "string" ? params["email"] : null;
  return (
    <AuthCard
      title="Check your email"
      subtitle={
        <>
          We&apos;ve sent a confirmation link to{" "}
          {email ? <strong>{email}</strong> : "your email"}. Click it to
          activate your account. The link expires in 24 hours.
        </>
      }
      footer={
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Back to log in
        </Link>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Can&apos;t find it? Check your spam folder. If you log in before
        confirming, we&apos;ll send a new link.
      </p>
    </AuthCard>
  );
}
