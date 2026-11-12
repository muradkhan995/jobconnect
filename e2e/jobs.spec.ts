import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD } from "../prisma/demo-users";
import { TEST_PASSWORD, createVerifiedEmployer, resetRateLimits } from "./db";
import { MAILPIT, login, shot, waitForEmail } from "./helpers";

// Core loop step 2 (docs/02-product-strategy/06-mvp-definition.md §2, docs/04-design/01-ui-flows.md J3): an employer posts a job, an admin approves it,
// a material edit sends it back for approval, and the admin rejects it with a reason.
test.describe.configure({ mode: "serial" });
test.beforeEach(resetRateLimits);

const title = `Backend Developer ${Date.now()}`;
const inDays = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
let employer: { email: string };

test.beforeAll(async () => {
  employer = await createVerifiedEmployer(
    "Ada Lovelace",
    `Analytical Engines ${Date.now()}`,
  );
});

async function asAdmin(page: import("@playwright/test").Page) {
  await login(page, "admin@demo.jobconnect.local", DEMO_PASSWORD);
}

test("40–43 employer writes a job and saves a draft (FR-EMP-006/007)", async ({
  page,
}) => {
  await login(page, employer.email, TEST_PASSWORD);
  await page.getByRole("link", { name: "Jobs", exact: true }).click();
  await expect(page.getByText("No jobs yet")).toBeVisible();
  await shot(page, "40-employer-jobs-empty");

  await page.getByRole("link", { name: "Post a job" }).click();
  await page.getByLabel("Work mode").selectOption("ON_SITE");
  await page.getByLabel("Minimum (£)").fill("60000");
  await page.getByLabel("Maximum (£)").fill("50000");
  await page.getByRole("button", { name: "Save as draft" }).click();
  await expect(
    page.getByText("Add a location (or choose Remote)."),
  ).toBeVisible();
  await expect(
    page.getByText("Maximum salary must be at least the minimum."),
  ).toBeVisible();
  await shot(page, "41-job-form-validation");

  await page.getByLabel("Job title").fill(title);
  await page
    .getByLabel("About the role")
    .fill(
      "Build the APIs behind our route-planning product, used by 300 delivery firms across the UK.",
    );
  await page
    .getByLabel("Requirements")
    .fill("Three years with Node.js or TypeScript; SQL; testing habits.");
  await page.getByLabel("Work mode").selectOption("HYBRID");
  await page.getByLabel("Location", { exact: true }).fill("Manchester");
  await page.getByLabel("Job type").selectOption("FULL_TIME");
  await page.getByLabel("Experience level").selectOption("MID");
  await page.getByLabel("Minimum (£)").fill("45000");
  await page.getByLabel("Maximum (£)").fill("55000");
  await page.getByLabel("Closing date").fill(inDays(30));
  await shot(page, "42-job-form-filled");
  await page.getByRole("button", { name: "Save as draft" }).click();

  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Draft saved",
  );
  await expect(page.getByText("£45,000 – £55,000 per year")).toBeVisible();
  await shot(page, "43-job-draft-saved");
});

test("44–45 employer submits it for approval (FR-EMP-008)", async ({
  page,
}) => {
  await login(page, employer.email, TEST_PASSWORD);
  await page.goto("/employer/jobs");
  await page.getByRole("link", { name: `Open ${title}` }).click();
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await shot(page, "44-job-submit-confirm");
  await page
    .getByRole("button", { name: "Confirm: Submit for approval" })
    .click();
  await expect(
    page.getByText("Waiting for approval", { exact: true }),
  ).toBeVisible();
  await shot(page, "45-job-waiting-for-approval");
});

test("46–48 admin reviews and approves it (FR-ADM-009/010)", async ({
  page,
}) => {
  await asAdmin(page);
  await expect(page.getByText("Jobs awaiting approval")).toBeVisible();
  await shot(page, "46-admin-dashboard-jobs");
  await page.getByRole("link", { name: "Open the job queue" }).click();
  await expect(
    page.getByRole("cell", { name: title, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: `Review ${title}` }).click();
  await expect(page.getByText("As candidates will see it")).toBeVisible();
  await shot(page, "47-admin-job-review");
  await page.getByRole("button", { name: "Approve and publish" }).click();
  await page
    .getByRole("button", { name: "Confirm: Approve and publish" })
    .click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Job approved",
  );
  await shot(page, "48-admin-job-approved");
});

test("49–50 employer sees it live; a material edit sends it back (BR-JOB-004)", async ({
  page,
}) => {
  const email = await waitForEmail(employer.email, "Your job is live");
  expect(email.Subject).toContain("live");

  await login(page, employer.email, TEST_PASSWORD);
  await page.goto("/employer/jobs");
  await expect(page.getByText("Live", { exact: true })).toBeVisible();
  await shot(page, "49-employer-job-live");

  await page.getByRole("link", { name: `Open ${title}` }).click();
  await page.getByRole("link", { name: "Edit job" }).click();
  await expect(
    page.getByText("This job is live. Changing the title"),
  ).toBeVisible();
  await page.getByLabel("Maximum (£)").fill("65000");
  await shot(page, "50-job-edit-live-notice");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByText("Waiting for approval", { exact: true }),
  ).toBeVisible();
});

test("51–52 admin rejects with a reason; employer sees it and is emailed (FR-ADM-010)", async ({
  browser,
}) => {
  const admin = await browser.newPage();
  await asAdmin(admin);
  await admin.goto("/admin/jobs");
  await admin.getByRole("link", { name: `Review ${title}` }).click();
  await admin.getByRole("button", { name: "Reject" }).click();
  await admin
    .getByLabel("Reason (shown to the employer)")
    .fill("Please say whether the hybrid role needs office days each week.");
  await shot(admin, "51-admin-job-reject-reason");
  await admin.getByRole("button", { name: "Confirm: Reject" }).click();
  await expect(admin.getByRole("main").getByRole("status")).toContainText(
    "Job rejected",
  );
  await admin.close();

  const page = await browser.newPage();
  const email = await waitForEmail(employer.email, "needs changes");
  await page.goto(`${MAILPIT}/view/${email.ID}.html`);
  await expect(page.getByText("office days")).toBeVisible();

  await login(page, employer.email, TEST_PASSWORD);
  await page.goto("/employer/jobs");
  await page.getByRole("link", { name: `Open ${title}` }).click();
  await expect(page.getByText("Changes needed", { exact: true })).toBeVisible();
  await expect(page.getByText("office days each week")).toBeVisible();
  await shot(page, "52-employer-job-changes-needed");
  await page.close();
});

test("53 employers can't see another company's job", async ({
  page,
  request,
}) => {
  const other = await createVerifiedEmployer(
    "Charles Babbage",
    `Difference Ltd ${Date.now()}`,
  );
  await login(page, employer.email, TEST_PASSWORD);
  await page.goto("/employer/jobs");
  const href = (await page
    .getByRole("link", { name: `Open ${title}` })
    .getAttribute("href"))!;
  const jobId = href.split("/").pop()!;
  await page.context().clearCookies();
  await login(page, other.email, TEST_PASSWORD);

  // Page: the not-found screen, and none of the job's content anywhere in the HTML.
  // (Status stays 200 on streamed pages – D-20; the API below is the real boundary.)
  await page.goto(href);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  expect(await page.content()).not.toContain(title);

  // API: a real 404 – the other company's job "doesn't exist" (API design §1.2).
  const cookies = (await page.context().cookies())
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const res = await request.get(`/api/v1/employer/jobs/${jobId}`, {
    headers: { cookie: cookies },
  });
  expect(res.status()).toBe(404);
});
