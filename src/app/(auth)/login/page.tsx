import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { Alert } from "@/components/ui/alert";
import { LoginForm } from "@/modules/auth/components/login-form";
import { safeNext } from "@/modules/auth/safe-next";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Log in · JobConnect" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params["next"] === "string" ? params["next"] : null;
  // Already logged in (e.g. right after this form succeeds): go where they were heading.
  if (await getCurrentUser()) redirect(safeNext(next));
  const verified = params["verified"] === "1";
  const expired =
    params["error"] === "invalid_token" || params["error"] === "token_expired";
  return (
    <AuthCard
      title="Log in"
      footer={
        <>
          New to JobConnect?{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Create an account
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {verified && (
          <Alert tone="success">
            Your email is confirmed. You can log in now.
          </Alert>
        )}
        {expired && (
          <Alert tone="error">
            That confirmation link has expired or was already used. Log in and
            we&apos;ll send a new one.
          </Alert>
        )}
        <LoginForm next={next} />
      </div>
    </AuthCard>
  );
}
