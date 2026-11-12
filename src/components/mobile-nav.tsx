import { CandidateTabBar } from "@/components/candidate-tab-bar";
import { getCurrentUser } from "@/modules/auth/session";

/** Phone-only navigation that sits below the page: the candidate tab bar plus a spacer. */
export async function MobileNav() {
  const user = await getCurrentUser();
  if (user?.role !== "CANDIDATE") return null;
  return (
    <>
      <div aria-hidden="true" className="h-16 sm:hidden" />
      <CandidateTabBar />
    </>
  );
}
