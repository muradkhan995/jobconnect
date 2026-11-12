import { expect, test } from "@playwright/test";
import {
  TEST_PASSWORD,
  createPublishedJobs,
  createUser,
  createVerifiedEmployer,
  resetRateLimits,
} from "./db";
import { login, shot } from "./helpers";

// Core loop step 3, second half (docs/02-product-strategy/06-mvp-definition.md §2, J4):
// a candidate adds a profile and CV, applies, and sees the real status.
test.describe.configure({ mode: "serial" });
test.beforeEach(resetRateLimits);

const TOKEN = `ap${Date.now().toString(36)}`;
const PDF = {
  name: "Amira Hassan CV.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.7\n% test CV for e2e\n"),
};
let jobId = "";
let applicationUrl = "";
let candidate: { email: string };
let employer: { email: string };

test.beforeAll(async () => {
  const e = await createVerifiedEmployer("Ada Employer", `Apply Ltd ${TOKEN}`);
  employer = e;
  [jobId] = (await createPublishedJobs(e.companyId, [
    { title: `Data Analyst ${TOKEN}` },
  ])) as [string];
  candidate = await createUser("CANDIDATE", "Amira Hassan");
});

test("80–83 a new candidate is guided to add a profile and CV (FR-CAN-001/005)", async ({
  page,
}) => {
  await login(page, candidate.email, TEST_PASSWORD);
  await page.goto(`/jobs/${jobId}`);
  await page.getByRole("link", { name: "Add your CV to apply" }).click();
  await expect(page).toHaveURL(/\/candidate\/profile\?next=/);
  await expect(
    page.getByText("Add your name and at least one CV"),
  ).toBeVisible();
  await shot(page, "80-profile-empty");

  await page.getByLabel("Full name").fill("Amira Hassan");
  await page.getByLabel("Headline (optional)").fill("Junior data analyst");
  await page.getByLabel("Location (optional)").fill("Manchester");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Profile saved",
  );
  await shot(page, "81-profile-saved");

  // A text file renamed to .pdf is refused – the type is checked from the content.
  await page.getByLabel("Upload a CV").setInputFiles({
    name: "not-really.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("hello, I am not a PDF"),
  });
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Upload a PDF or Word (.docx) file.",
  );
  await shot(page, "82-cv-wrong-type");

  await page.getByLabel("Upload a CV").setInputFiles(PDF);
  await expect(page.getByRole("list", { name: "Your CVs" })).toContainText(
    "Amira Hassan CV.pdf",
  );
  await expect(page.getByText("You're ready to apply.")).toBeVisible();
  await shot(page, "83-cv-uploaded");
});

test("84–86 applies in two clicks and sees the real status (FR-CAN-010/013, NFR-UX-003)", async ({
  page,
}) => {
  await login(page, candidate.email, TEST_PASSWORD);
  await page.goto(`/candidate/profile?next=/jobs/${jobId}`);
  await page.getByRole("link", { name: "Back to the job" }).click();
  await page.getByRole("button", { name: "Apply now" }).click(); // click 1
  await expect(
    page.getByRole("radio", { name: "Amira Hassan CV.pdf" }),
  ).toBeChecked();
  await page
    .getByLabel("Cover letter (optional)")
    .fill("I love turning messy data into clear decisions.");
  await shot(page, "84-apply-sheet");
  await page.getByRole("button", { name: "Send application" }).click(); // click 2

  await expect(page).toHaveURL(/\/candidate\/applications\/.+\?applied=1/);
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Application sent",
  );
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();
  applicationUrl = page.url().split("?")[0]!;
  await shot(page, "85-application-detail");

  await page.goto(`/jobs/${jobId}`);
  await expect(
    page.getByRole("link", { name: /Applied on .* Application sent/ }),
  ).toBeVisible();
  await shot(page, "86-job-already-applied");
});

test("87 my applications lists it with its status (FR-CAN-013)", async ({
  page,
}) => {
  await login(page, candidate.email, TEST_PASSWORD);
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "My applications" })
    .click();
  const list = page.getByRole("list", { name: "Your applications" });
  await expect(list).toContainText(`Data Analyst ${TOKEN}`);
  await expect(list).toContainText("Application sent");
  await shot(page, "87-my-applications");
});

test("88 another candidate can't see it (MVP acceptance criterion)", async ({
  page,
  request,
}) => {
  const other = await createUser("CANDIDATE", "Ben Other");
  await login(page, other.email, TEST_PASSWORD);
  await page.goto(applicationUrl);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  expect(await page.content()).not.toContain("messy data");
  const cookies = (await page.context().cookies())
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const id = applicationUrl.split("/").pop()!;
  const api = await request.get(`/api/v1/candidate/applications/${id}`, {
    headers: { cookie: cookies },
  });
  expect(api.status()).toBe(404);
  await page.goto("/candidate/applications");
  await expect(
    page.getByText("You haven't applied to any jobs yet."),
  ).toBeVisible();
});

test("89 the employer's job list shows the application count (FR-EMP-013)", async ({
  page,
}) => {
  await login(page, employer.email, TEST_PASSWORD);
  await page.goto("/employer/jobs");
  const row = page.getByRole("row", {
    name: new RegExp(`Data Analyst ${TOKEN}`),
  });
  await expect(row.getByRole("cell").nth(2)).toHaveText("1");
  await shot(page, "89-employer-application-count");
});

test("90 candidate pages are candidate-only (real 404 for other roles)", async ({
  page,
}) => {
  await login(page, employer.email, TEST_PASSWORD);
  const res = await page.goto("/candidate/applications");
  expect(res?.status()).toBe(404);
});

test("91 profile & CVs on a phone (NFR-UX-001)", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await login(page, candidate.email, TEST_PASSWORD);
  await page.goto("/candidate/profile");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await shot(page, "91-profile-mobile-360px");
  await page.close();
});

test("92–93 phones: candidate tab bar navigates; apply bar sits above it (D-07)", async ({
  browser,
}) => {
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await login(page, candidate.email, TEST_PASSWORD);
  const tabs = page.getByRole("navigation", { name: "Candidate" });
  await expect(tabs.getByRole("link")).toHaveText([
    "Find jobs",
    "Applied",
    "Me",
  ]);
  await tabs.getByRole("link", { name: "Applied" }).click();
  await expect(page).toHaveURL(/\/candidate\/applications$/);
  await expect(tabs.getByRole("link", { name: "Applied" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await shot(page, "92-candidate-tab-bar-360px");

  await page.goto(`/jobs/${jobId}`);
  const applied = page.getByRole("link", { name: /Applied on/ });
  const appliedBox = (await applied.boundingBox())!;
  const tabBox = (await tabs.boundingBox())!;
  expect(appliedBox.y + appliedBox.height).toBeLessThanOrEqual(tabBox.y); // no overlap
  await shot(page, "93-job-apply-bar-above-tabs-360px");
  await page.close();
});

test("94 phones: employers get their navigation too", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await login(page, employer.email, TEST_PASSWORD);
  const nav = page.getByRole("navigation", { name: "Main (mobile)" });
  await expect(nav.getByRole("link", { name: "Jobs" })).toBeVisible();
  await nav.getByRole("link", { name: "Jobs" }).click();
  await expect(page).toHaveURL(/\/employer\/jobs$/);
  await page.close();
});
