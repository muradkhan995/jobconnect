import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { RegisterForm } from "@/modules/auth/components/register-form";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Create account · JobConnect" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <AuthCard
      title="Create your account"
      subtitle="Free for candidates and employers."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
