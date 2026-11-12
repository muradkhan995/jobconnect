import { resetRateLimits } from "./db";

/** Runs once before the e2e suite (local database only – enforced in ./db). */
export default async function globalSetup() {
  await resetRateLimits();
}
