import type { Metadata } from "next";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@/modules/auth/signup-rules";

export const metadata: Metadata = { title: "Privacy Policy · JobConnect" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Version {CURRENT_PRIVACY_POLICY_VERSION}
      </p>
      <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        Placeholder: the full policy text must be written and reviewed before
        launch.
      </div>
      <div className="mt-6 flex flex-col gap-4 text-zinc-700 dark:text-zinc-300">
        <p>
          JobConnect collects only the data needed to run the service: your
          account details, and – if you are a candidate – your profile, CVs and
          applications.
        </p>
        <p>
          Employers see your application details only for jobs you applied to.
          Your contact details are shared only once you are shortlisted. You can
          delete your account at any time, and your personal data is erased
          within 30 days.
        </p>
        <p>Your data is hosted in the UK/EU and is never sold.</p>
      </div>
    </main>
  );
}
