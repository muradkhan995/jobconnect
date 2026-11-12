/**
 * Demo accounts for local development and QA – NEVER for production.
 * Created by `npm run db:seed` (prisma/seed.ts); used by the e2e tests.
 * All three share DEMO_PASSWORD and are already email-confirmed.
 */
export const DEMO_PASSWORD = "Demo-Jobconnect-Local-2026";

export const DEMO_USERS = [
  {
    email: "candidate@demo.jobconnect.local",
    name: "Amira Hassan",
    role: "CANDIDATE",
  },
  {
    email: "employer@demo.jobconnect.local",
    name: "David Okafor",
    role: "EMPLOYER",
  },
  {
    email: "admin@demo.jobconnect.local",
    name: "Sophie Clarke",
    role: "ADMIN",
  },
] as const;
