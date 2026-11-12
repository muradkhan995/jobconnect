/**
 * Realistic DEMO DATA for local development and demos – never production.
 *
 *   npm run db:seed:demo                 # demo data
 *   npm run db:seed:demo -- --clean-test-data   # also remove leftovers of automated test runs
 *
 * Creates 100 companies (80 verified, 10 pending, 6 rejected, 4 suspended), one employer per company,
 * 50 candidates with profiles, 2 extra admins and ~240 jobs in every status (every verified company has 1–4). All names, companies and
 * websites are fictional (`.example` domains are reserved and never real).
 *
 * - Deterministic: a fixed random seed gives the same data on every run.
 * - Re-runnable: everything previously created by this script is removed first.
 * - Local only: refuses any non-local database.
 * - Every account uses DEMO_PASSWORD from prisma/demo-users.ts; emails end in DEMO_DOMAIN.
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  Prisma,
  PrismaClient,
  type CompanySize,
  type ExperienceLevel,
  type JobStatus,
  type JobType,
  type SalaryPeriod,
  type WorkMode,
} from "../src/generated/prisma/client";
import { uuidv7 } from "../src/lib/uuidv7";
import { hashPassword } from "../src/modules/auth/password";
import { CURRENT_PRIVACY_POLICY_VERSION } from "../src/modules/auth/signup-rules";
import { DEMO_PASSWORD } from "./demo-users";

config({ path: [".env.local", ".env"], quiet: true });

export const DEMO_DOMAIN = "demo-data.jobconnect.local";

// ── Deterministic randomness ─────────────────────────────────────────────────
let seed = 20261112;
function rand(): number {
  // mulberry32
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(list: readonly T[]): T =>
  list[Math.floor(rand() * list.length)]!;
const between = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));
const DAY = 86_400_000;

// ── Vocabulary (all fictional) ───────────────────────────────────────────────
const PREFIXES = [
  "Northwind",
  "Brightwave",
  "Oakridge",
  "Silverline",
  "Harbourview",
  "Redkite",
  "Bluefield",
  "Greenacre",
  "Stonebridge",
  "Riverside",
  "Summit",
  "Kestrel",
  "Lantern",
  "Meadowlark",
  "Copperleaf",
  "Ironbridge",
  "Westgate",
  "Highland",
  "Clearwater",
  "Foxglove",
  "Ashdown",
  "Bramble",
  "Cobalt",
  "Driftwood",
  "Elmstead",
  "Fenwick",
  "Granite",
  "Hollowell",
  "Juniper",
  "Larkspur",
  "Marlow",
  "Nettlebed",
  "Orchard",
  "Pennine",
  "Quayside",
  "Rowan",
  "Saltmarsh",
  "Thistle",
  "Underwood",
  "Wexford",
] as const;

/** Industry ids seeded by migration …_companies, each with a suffix and typical job titles. */
const SECTORS = [
  {
    industryId: "01a1cd0d-dc00-7a7b-a129-3bc02dd5503d",
    suffix: "Accounting",
    titles: [
      "Accounts Assistant",
      "Management Accountant",
      "Payroll Officer",
      "Audit Associate",
    ],
  },
  {
    industryId: "01a1cd0d-dc01-7a33-b0aa-4fb4100ec2cf",
    suffix: "Builders",
    titles: ["Site Manager", "Quantity Surveyor", "Electrician", "Carpenter"],
  },
  {
    industryId: "01a1cd0d-dc02-747e-93b7-2132f7e5d2af",
    suffix: "Design Studio",
    titles: [
      "Graphic Designer",
      "UX Designer",
      "Motion Designer",
      "Copywriter",
    ],
  },
  {
    industryId: "01a1cd0d-dc03-75b1-b2d7-8da8ed28e5a1",
    suffix: "Learning",
    titles: [
      "Maths Teacher",
      "Teaching Assistant",
      "Learning Designer",
      "SEN Coordinator",
    ],
  },
  {
    industryId: "01a1cd0d-dc04-73a5-a838-4906dc1155d6",
    suffix: "Engineering",
    titles: [
      "Mechanical Engineer",
      "CNC Machinist",
      "Quality Inspector",
      "Maintenance Technician",
    ],
  },
  {
    industryId: "01a1cd0d-dc05-72d5-9fa4-79f29d72cd7f",
    suffix: "Health",
    titles: [
      "Staff Nurse",
      "Healthcare Assistant",
      "Physiotherapist",
      "Pharmacy Technician",
    ],
  },
  {
    industryId: "01a1cd0d-dc06-7984-a6bf-8a67e5e4553b",
    suffix: "Hospitality",
    titles: [
      "Chef de Partie",
      "Front of House Manager",
      "Barista",
      "Hotel Receptionist",
    ],
  },
  {
    industryId: "01a1cd0d-dc07-78b7-898d-42f24fd57db7",
    suffix: "Analytics",
    titles: [
      "Software Engineer",
      "Data Analyst",
      "DevOps Engineer",
      "IT Support Technician",
      "Product Manager",
    ],
  },
  {
    industryId: "01a1cd0d-dc08-730d-a3f6-36f194ca48b3",
    suffix: "Legal",
    titles: [
      "Paralegal",
      "Conveyancing Solicitor",
      "Legal Secretary",
      "Compliance Officer",
    ],
  },
  {
    industryId: "01a1cd0d-dc09-7e6e-965f-d9cbbc47cb30",
    suffix: "Logistics",
    titles: [
      "Warehouse Operative",
      "HGV Driver",
      "Transport Planner",
      "Logistics Coordinator",
    ],
  },
  {
    industryId: "01a1cd0d-dc0a-718e-a3ef-0bbb69e799cf",
    suffix: "Marketing",
    titles: [
      "Marketing Executive",
      "SEO Specialist",
      "Sales Representative",
      "Social Media Manager",
    ],
  },
  {
    industryId: "01a1cd0d-dc0b-759a-ae36-2633a1612b3a",
    suffix: "Community Trust",
    titles: [
      "Support Worker",
      "Fundraising Officer",
      "Project Coordinator",
      "Volunteer Manager",
    ],
  },
  {
    industryId: "01a1cd0d-dc0c-7b18-8bf5-d80876cfe5c7",
    suffix: "Retail",
    titles: [
      "Store Manager",
      "Retail Assistant",
      "Visual Merchandiser",
      "Stock Controller",
    ],
  },
] as const;

const CITIES = [
  "London",
  "Manchester",
  "Birmingham",
  "Leeds",
  "Glasgow",
  "Bristol",
  "Liverpool",
  "Edinburgh",
  "Cardiff",
  "Sheffield",
  "Newcastle",
  "Nottingham",
  "Leicester",
  "Belfast",
  "Brighton",
  "York",
] as const;
const FIRST = [
  "Amira",
  "Ben",
  "Chloe",
  "Daniel",
  "Ella",
  "Farhan",
  "Grace",
  "Harry",
  "Isla",
  "Jamal",
  "Katie",
  "Liam",
  "Maya",
  "Noah",
  "Olivia",
  "Priya",
  "Rhys",
  "Sofia",
  "Tom",
  "Una",
  "Victor",
  "Wei",
  "Yasmin",
  "Zain",
  "Aisha",
  "Callum",
  "Darius",
  "Erin",
  "Kwame",
  "Niamh",
] as const;
const LAST = [
  "Hassan",
  "Clarke",
  "Okafor",
  "Patel",
  "Smith",
  "Jones",
  "Williams",
  "Brown",
  "Taylor",
  "Davies",
  "Evans",
  "Thomas",
  "Khan",
  "Wilson",
  "Roberts",
  "Walker",
  "Wright",
  "Robinson",
  "Thompson",
  "White",
  "Hughes",
  "Edwards",
  "Green",
  "Hall",
  "Wood",
  "Murphy",
  "Campbell",
  "Chen",
  "Ali",
  "Kaur",
] as const;
const SIZES: readonly CompanySize[] = [
  "SIZE_1_10",
  "SIZE_11_50",
  "SIZE_51_200",
  "SIZE_201_500",
  "SIZE_500_PLUS",
];
const REJECT_REASONS = [
  "Please add your Companies House registration number to the description.",
  "The website doesn't match the company name – please check it.",
  "Please describe what your company does in more detail.",
];
const SUSPEND_REASONS = [
  "Reported for asking candidates to pay a fee to apply.",
  "Jobs asked candidates for bank details before interview.",
];
const JOB_REJECT_REASONS = [
  "Please state whether the role needs office days each week.",
  "The salary range looks unrealistic for this role – please check it.",
];

const LEVEL_PAY: Record<ExperienceLevel, [number, number]> = {
  ENTRY: [21000, 26000],
  JUNIOR: [24000, 32000],
  MID: [32000, 48000],
  SENIOR: [48000, 70000],
  LEAD: [65000, 95000],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function assertLocalDatabase(url: string | undefined): string {
  if (!url) throw new Error("DATABASE_URL is not set");
  const host = new URL(url).hostname;
  if (
    process.env.NODE_ENV === "production" ||
    !["localhost", "127.0.0.1", "::1"].includes(host)
  ) {
    throw new Error(
      `Refusing to seed demo data into a non-local database (${host}).`,
    );
  }
  return url;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const pad = (n: number) => String(n).padStart(3, "0");

function userRow(
  id: string,
  email: string,
  name: string,
  role: "CANDIDATE" | "EMPLOYER" | "ADMIN",
) {
  return {
    id,
    email,
    name,
    role,
    emailVerified: true,
    status: "ACTIVE" as const,
    privacyConsentAt: new Date(),
    privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
  };
}

function jobFor(
  companyId: string,
  sector: (typeof SECTORS)[number],
  status: JobStatus,
  now: number,
) {
  const title = pick(sector.titles);
  const level = pick<ExperienceLevel>([
    "ENTRY",
    "JUNIOR",
    "MID",
    "MID",
    "SENIOR",
    "LEAD",
  ]);
  const workMode = pick<WorkMode>([
    "ON_SITE",
    "ON_SITE",
    "HYBRID",
    "HYBRID",
    "REMOTE",
  ]);
  const jobType = pick<JobType>([
    "FULL_TIME",
    "FULL_TIME",
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "TEMPORARY",
    "INTERNSHIP",
  ]);
  const period: SalaryPeriod = jobType === "CONTRACT" ? "DAY" : "YEAR";
  const [lo, hi] = LEVEL_PAY[level];
  let salaryMin = Math.round(between(lo, hi - 4000) / 500) * 500;
  let salaryMax = salaryMin + Math.round(between(2000, 12000) / 500) * 500;
  if (period === "DAY") {
    salaryMin = Math.round(salaryMin / 220 / 5) * 5;
    salaryMax = Math.round(salaryMax / 220 / 5) * 5;
  }
  const publishedAt =
    status === "PUBLISHED" || status === "PAUSED" || status === "CLOSED"
      ? new Date(now - between(0, 20) * DAY - between(0, 23) * 3_600_000)
      : null;
  return {
    id: uuidv7(),
    companyId,
    title,
    description:
      `We're looking for a ${title.toLowerCase()} to join our friendly team. You'll work with colleagues ` +
      `across the business, get proper training and a clear path to progress. We offer 25 days' holiday, ` +
      `a pension and flexible start times.`,
    requirements:
      `Experience as a ${title.toLowerCase()} or in a similar role; good communication; a positive, ` +
      `organised approach; the right to work in the UK.`,
    location: workMode === "REMOTE" ? null : pick(CITIES),
    workMode,
    jobType,
    experienceLevel: level,
    industryId: sector.industryId,
    salaryMin,
    salaryMax,
    salaryPeriod: period,
    deadline: new Date(now + between(7, 60) * DAY),
    status,
    statusReason: status === "REJECTED" ? pick(JOB_REJECT_REASONS) : null,
    submittedAt:
      status === "DRAFT" ? null : new Date(now - between(1, 25) * DAY),
    publishedAt,
    closedAt: status === "CLOSED" ? new Date(now - between(0, 3) * DAY) : null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const url = assertLocalDatabase(process.env["DATABASE_URL"]);
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
  const now = Date.now();
  try {
    // 0. Optional: remove leftovers of the AUTOMATED TESTS (accounts with test-only email prefixes at
    //    @example.com) so they don't crowd the demo. Never touches demo users or real sign-ups.
    if (process.argv.includes("--clean-test-data")) {
      const prefixes = ["e2e-", "qa-", "int-", "repro-", "timing-", "timing2-"];
      const testUsers = await db.user.findMany({
        where: {
          OR: prefixes.map((p) => ({ email: { startsWith: p } })),
          email: { endsWith: "@example.com" },
        },
        select: { id: true },
      });
      const testIds = testUsers.map((u) => u.id);
      const testCompanies = await db.company.findMany({
        where: { ownerUserId: { in: testIds } },
        select: { id: true },
      });
      const testCompanyIds = testCompanies.map((c) => c.id);
      await db.application.deleteMany({
        where: {
          OR: [
            { candidateId: { in: testIds } },
            { job: { companyId: { in: testCompanyIds } } },
          ],
        },
      });
      const jobsRemoved = await db.job.deleteMany({
        where: { companyId: { in: testCompanyIds } },
      });
      await db.company.deleteMany({ where: { id: { in: testCompanyIds } } });
      await db.user.deleteMany({ where: { id: { in: testIds } } });
      console.log(
        `✓ removed automated-test leftovers: ${testIds.length} users, ${testCompanyIds.length} companies, ${jobsRemoved.count} jobs`,
      );
    }

    // 1. Remove what an earlier run created (re-runnable).
    const old = await db.user.findMany({
      where: { email: { endsWith: `@${DEMO_DOMAIN}` } },
      select: { id: true },
    });
    const oldIds = old.map((u) => u.id);
    const oldCompanies = await db.company.findMany({
      where: { ownerUserId: { in: oldIds } },
      select: { id: true },
    });
    const oldCompanyIds = oldCompanies.map((c) => c.id);
    await db.application.deleteMany({
      where: { job: { companyId: { in: oldCompanyIds } } },
    });
    await db.application.deleteMany({ where: { candidateId: { in: oldIds } } });
    await db.job.deleteMany({ where: { companyId: { in: oldCompanyIds } } });
    await db.company.deleteMany({ where: { id: { in: oldCompanyIds } } });
    await db.user.deleteMany({ where: { id: { in: oldIds } } }); // cascades sessions, accounts, profiles, CVs

    const passwordHash = await hashPassword(DEMO_PASSWORD);
    const users: ReturnType<typeof userRow>[] = [];
    const accounts: {
      id: string;
      userId: string;
      accountId: string;
      providerId: string;
      password: string;
    }[] = [];
    const addUser = (
      email: string,
      name: string,
      role: "CANDIDATE" | "EMPLOYER" | "ADMIN",
    ) => {
      const id = uuidv7();
      users.push(userRow(id, email, name, role));
      accounts.push({
        id: uuidv7(),
        userId: id,
        accountId: id,
        providerId: "credential",
        password: passwordHash,
      });
      return id;
    };
    const person = () => `${pick(FIRST)} ${pick(LAST)}`;

    // 2. Companies + one employer each. Status mix gives the admin queues real work.
    const statuses = [
      ...Array<"VERIFIED">(80).fill("VERIFIED"),
      ...Array<"PENDING">(10).fill("PENDING"),
      ...Array<"REJECTED">(6).fill("REJECTED"),
      ...Array<"SUSPENDED">(4).fill("SUSPENDED"),
    ];
    for (let i = statuses.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [statuses[i], statuses[j]] = [statuses[j]!, statuses[i]!];
    }
    const usedNames = new Set<string>();
    const companies: Prisma.CompanyCreateManyInput[] = [];
    const jobs: ReturnType<typeof jobFor>[] = [];

    for (let n = 1; n <= 100; n++) {
      const sector = SECTORS[(n - 1) % SECTORS.length]!;
      let name = "";
      do name = `${pick(PREFIXES)} ${sector.suffix} Ltd`;
      while (usedNames.has(name));
      usedNames.add(name);
      const ownerUserId = addUser(
        `employer${pad(n)}@${DEMO_DOMAIN}`,
        person(),
        "EMPLOYER",
      );
      const status = statuses[n - 1]!;
      const companyId = uuidv7();
      const submittedAt = new Date(now - between(1, 30) * DAY);
      companies.push({
        id: companyId,
        ownerUserId,
        name,
        description:
          `${name.replace(" Ltd", "")} is an independent ${sector.suffix.toLowerCase()} business based in ` +
          `${pick(CITIES)}, serving customers across the UK. Company number ${between(10000000, 14999999)}.`,
        industryId: sector.industryId,
        size: pick(SIZES),
        website:
          rand() < 0.85
            ? `https://${slug(name.replace(" Ltd", ""))}.example`
            : null,
        location: pick(CITIES),
        verificationStatus: status,
        statusReason:
          status === "REJECTED"
            ? pick(REJECT_REASONS)
            : status === "SUSPENDED"
              ? pick(SUSPEND_REASONS)
              : null,
        submittedAt,
        verifiedAt:
          status === "VERIFIED" || status === "SUSPENDED"
            ? new Date(submittedAt.getTime() + DAY)
            : null,
      });

      // 3. Jobs: verified companies post 0–4 (mostly live); suspended ones keep live jobs that search hides;
      //    pending/rejected companies only have drafts.
      const plan: JobStatus[] =
        status === "VERIFIED"
          ? Array.from({ length: between(1, 4) }, () =>
              pick<JobStatus>([
                // mostly live, plus every other status so each screen and queue has examples
                "PUBLISHED",
                "PUBLISHED",
                "PUBLISHED",
                "PUBLISHED",
                "PUBLISHED",
                "PUBLISHED",
                "PENDING_APPROVAL",
                "DRAFT",
                "PAUSED",
                "CLOSED",
                "REJECTED",
              ]),
            )
          : status === "SUSPENDED"
            ? ["PUBLISHED"]
            : rand() < 0.5
              ? ["DRAFT"]
              : [];
      for (const s of plan) jobs.push(jobFor(companyId, sector, s, now));
    }

    // 4. Candidates with profiles, and two extra admins.
    const profiles: {
      userId: string;
      fullName: string;
      headline: string;
      location: string;
      phone: string | null;
    }[] = [];
    for (let n = 1; n <= 50; n++) {
      const name = person();
      const id = addUser(
        `candidate${pad(n)}@${DEMO_DOMAIN}`,
        name,
        "CANDIDATE",
      );
      const sector = pick(SECTORS);
      profiles.push({
        userId: id,
        fullName: name,
        headline: `${pick(["Aspiring", "Experienced", "Junior", "Senior", "Qualified"])} ${pick(sector.titles).toLowerCase()}`,
        location: pick(CITIES),
        phone:
          rand() < 0.6
            ? `07${between(100, 999)} ${between(100000, 999999)}`
            : null,
      });
    }
    for (let n = 1; n <= 2; n++)
      addUser(`admin${pad(n)}@${DEMO_DOMAIN}`, person(), "ADMIN");

    // 5. Write everything in one transaction.
    await db.$transaction([
      db.user.createMany({ data: users }),
      db.account.createMany({ data: accounts }),
      db.company.createMany({ data: companies }),
      db.job.createMany({ data: jobs }),
      db.candidateProfile.createMany({ data: profiles }),
    ]);

    // 6. Summary.
    const count = <T extends string>(list: T[]) =>
      Object.entries(
        list.reduce<Record<string, number>>(
          (a, s) => ({ ...a, [s]: (a[s] ?? 0) + 1 }),
          {},
        ),
      )
        .map(([k, v]) => `${k} ${v}`)
        .join(" · ");
    console.log(
      `✓ ${users.length} users: 100 employers, 50 candidates (with profiles), 2 admins`,
    );
    console.log(`✓ 100 companies: ${count(statuses)}`);
    console.log(`✓ ${jobs.length} jobs: ${count(jobs.map((j) => j.status))}`);
    console.log(
      `  Log in as employer001…employer100, candidate001…candidate050, admin001…admin002 @${DEMO_DOMAIN}`,
    );
    console.log("  Password: DEMO_PASSWORD in prisma/demo-users.ts");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
