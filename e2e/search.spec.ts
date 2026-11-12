import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD } from "../prisma/demo-users";
import {
  createPublishedJobs,
  createVerifiedEmployer,
  resetRateLimits,
} from "./db";
import { login, shot } from "./helpers";

// Core loop step 3 (docs/07 §2, docs/11 J4 first half): anyone finds and reads jobs.
test.describe.configure({ mode: "serial" });
test.beforeEach(resetRateLimits);

// A made-up word only this run uses, so leftover local data never matches.
const TOKEN = `kx${Date.now().toString(36)}`;
let jobIds: string[] = [];
let pausedId = "";

test.beforeAll(async () => {
  const employer = await createVerifiedEmployer(
    "Mary Seacole",
    `Seacole Logistics ${TOKEN}`,
  );
  jobIds = await createPublishedJobs(employer.companyId, [
    {
      title: `Warehouse Supervisor ${TOKEN}`,
      location: "Leeds",
      workMode: "ON_SITE",
      jobType: "FULL_TIME",
    },
    {
      title: `Route Planner ${TOKEN}`,
      location: null,
      workMode: "REMOTE",
      jobType: "CONTRACT",
    },
    ...Array.from({ length: 21 }, (_, i) => ({
      title: `Picker Packer ${i + 1} ${TOKEN}`,
    })),
  ]);
  const paused = await createPublishedJobs(employer.companyId, [
    { title: `Paused Driver ${TOKEN}`, status: "PAUSED" },
  ]);
  pausedId = paused[0] ?? "";
});

test("60 visitors can search from the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("search", { name: "Search jobs" })).toBeVisible();
  await shot(page, "60-home-search");
  await page.getByLabel("What").fill(`supervisor ${TOKEN}`);
  await page.getByRole("button", { name: "Search jobs" }).click();
  await expect(page).toHaveURL(/\/jobs\?q=/);
  await expect(page.getByText("1 job", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: new RegExp(`Warehouse Supervisor ${TOKEN}`),
    }),
  ).toBeVisible();
  await shot(page, "61-search-results");
});

test("62 filters narrow the results; no match shows a way back (FR-CAN-007)", async ({
  page,
}) => {
  await page.goto(`/jobs?q=${TOKEN}`);
  await page.getByRole("checkbox", { name: "Remote" }).check();
  await page.getByRole("button", { name: "Search jobs" }).click();
  await expect(page).toHaveURL(/workMode=REMOTE/);
  await expect(page.getByText("1 job", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(`Route Planner ${TOKEN}`) }),
  ).toBeVisible();
  await shot(page, "62-search-filtered-remote");

  await page.getByLabel("Where").fill("Atlantis");
  await page.getByRole("button", { name: "Search jobs" }).click();
  await expect(
    page.getByText("No jobs match. Try removing a filter."),
  ).toBeVisible();
  await shot(page, "63-search-no-results");
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/jobs$/);
});

test("64 'Load more' pages through results without JavaScript-only tricks", async ({
  page,
}) => {
  await page.goto(`/jobs?q=${TOKEN}`);
  await expect(page.getByText("23 jobs", { exact: true })).toBeVisible(); // paused job excluded
  const results = page
    .getByRole("list", { name: "Search results" })
    .getByRole("listitem");
  await expect(results).toHaveCount(20);
  await page.getByRole("link", { name: "Load more" }).click();
  await expect(results).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Load more" })).toHaveCount(0);
});

test("65–66 job details: visitors are asked to log in, and come back afterwards (FR-CAN-008)", async ({
  page,
}) => {
  await page.goto(`/jobs?q=supervisor ${TOKEN}`);
  await page
    .getByRole("link", { name: new RegExp(`Warehouse Supervisor ${TOKEN}`) })
    .click();
  await expect(
    page.getByRole("heading", { name: `Warehouse Supervisor ${TOKEN}` }),
  ).toBeVisible();
  await expect(page.getByText("✓ Verified employer")).toBeVisible();
  await expect(page).toHaveTitle(
    new RegExp(`Warehouse Supervisor ${TOKEN} at Seacole Logistics`),
  );
  await shot(page, "65-job-details-visitor");

  await page.getByRole("link", { name: "Log in to apply" }).click();
  await page.getByLabel("Email").fill("candidate@demo.jobconnect.local");
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(new RegExp(`/jobs/${jobIds[0]}$`));
  await expect(page.getByText("Applying opens soon")).toBeVisible();
  await shot(page, "66-job-details-candidate");
});

test("67 a hidden or unknown job is a real 404 (D-20)", async ({
  page,
  request,
}) => {
  for (const path of [
    `/jobs/${pausedId}`,
    "/jobs/01a1cd0d-0000-7000-8000-000000000000",
    "/jobs/not-a-job",
  ]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(404);
    await expect(page.getByText("This page could not be found.")).toBeVisible();
  }
  expect(await page.content()).not.toContain(`Paused Driver ${TOKEN}`);
  const api = await request.get(`/api/v1/jobs/${pausedId}`);
  expect(api.status()).toBe(404);
});

test("68 candidates land on job search after login", async ({ page }) => {
  await login(page, "candidate@demo.jobconnect.local", DEMO_PASSWORD);
  await expect(page).toHaveURL(/\/jobs$/);
  await expect(
    page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Find jobs" }),
  ).toBeVisible();
});

test("69 search and job details on a phone: no sideways scrolling, sticky apply bar", async ({
  browser,
}) => {
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await page.goto(`/jobs?q=${TOKEN}`);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await shot(page, "69-search-mobile-360px");
  await page.goto(`/jobs/${jobIds[0]}`);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  // Header links stay on one line (each link is one line tall).
  for (const name of ["Find jobs", "Log in", "Sign up"]) {
    const box = await page
      .getByRole("navigation", { name: "Account" })
      .getByRole("link", { name })
      .boundingBox();
    expect(box!.height, name).toBeLessThan(48);
  }
  await expect(
    page.getByRole("link", { name: "Log in to apply" }),
  ).toBeInViewport();
  await shot(page, "70-job-details-mobile-360px");
  await page.close();
});

test("71 public pages have no CSP violations (NFR-SEC-005)", async ({
  page,
}) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text()))
      violations.push(m.text());
  });
  for (const path of [`/jobs?q=${TOKEN}`, `/jobs/${jobIds[0]}`]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(violations).toEqual([]);
});

test("72 the public API returns search results and job details", async ({
  request,
}) => {
  const res = await request.get(`/api/v1/jobs?q=${TOKEN}&limit=5`);
  expect(res.status()).toBe(200);
  const body = (await res.json()) as {
    items: { id: string }[];
    nextCursor: string | null;
    total: number;
  };
  expect(body.total).toBe(23);
  expect(body.items).toHaveLength(5);
  expect(body.nextCursor).toBeTruthy();
  const detail = await request.get(`/api/v1/jobs/${jobIds[0]}`);
  expect(detail.status()).toBe(200);
  expect(await detail.json()).not.toHaveProperty("statusReason");
});
