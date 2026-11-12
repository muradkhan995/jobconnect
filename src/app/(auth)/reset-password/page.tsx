import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password · JobConnect",
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const params = await searchParams;
  const token =
    typeof params["token"] === "string" && !params["error"]
      ? params["token"]
      : null;
  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
