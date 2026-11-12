import { describe, expect, it } from "vitest";
import {
  ADMIN_TRANSITIONS,
  EMPLOYER_TRANSITIONS,
  canEdit,
  dateFromDeadline,
  deadlineFromDate,
  isAdminJobAction,
  isEmployerJobAction,
  isFinal,
  isFuture,
  isMaterialChange,
  isWithinSubmitWindow,
  statusAfterEdit,
} from "./rules";
import { JobInput } from "./schemas";

const NOW = new Date("2026-11-12T12:00:00Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

describe("deadline (BR-JOB-002, FR-EMP-007)", () => {
  it("stores a closing date as the end of that day, and reads it back", () => {
    const d = deadlineFromDate("2026-12-01");
    expect(d.toISOString()).toBe("2026-12-01T23:59:59.999Z");
    expect(dateFromDeadline(d)).toBe("2026-12-01");
  });

  it("accepts 1 to 90 days ahead on submit", () => {
    expect(isWithinSubmitWindow(days(1), NOW)).toBe(true);
    expect(isWithinSubmitWindow(days(90), NOW)).toBe(true);
    expect(isWithinSubmitWindow(days(0.5), NOW)).toBe(false);
    expect(isWithinSubmitWindow(days(91), NOW)).toBe(false);
  });

  it("knows past from future", () => {
    expect(isFuture(days(1), NOW)).toBe(true);
    expect(isFuture(days(-1), NOW)).toBe(false);
  });
});

describe("lifecycle (BR §3)", () => {
  it("submits only drafts, and only admins publish", () => {
    expect(EMPLOYER_TRANSITIONS.submit).toMatchObject({
      from: ["DRAFT"],
      to: "PENDING_APPROVAL",
    });
    expect(ADMIN_TRANSITIONS.approve).toMatchObject({
      from: ["PENDING_APPROVAL"],
      to: "PUBLISHED",
    });
    expect(
      Object.values(EMPLOYER_TRANSITIONS).some((r) =>
        r.from.includes("PENDING_APPROVAL"),
      ),
    ).toBe(false);
  });

  it("pauses and resumes between PUBLISHED and PAUSED (FR-EMP-010)", () => {
    expect(EMPLOYER_TRANSITIONS.pause).toMatchObject({
      from: ["PUBLISHED"],
      to: "PAUSED",
    });
    expect(EMPLOYER_TRANSITIONS.resume).toMatchObject({
      from: ["PAUSED"],
      to: "PUBLISHED",
    });
  });

  it("requires reasons to reject or remove (FR-ADM-010/011, BR-JOB-008)", () => {
    expect(ADMIN_TRANSITIONS.reject.needsReason).toBe(true);
    expect(ADMIN_TRANSITIONS.remove.needsReason).toBe(true);
    expect(ADMIN_TRANSITIONS.approve.needsReason).toBe(false);
  });

  it("treats CLOSED and REMOVED as final (BR-JOB-007)", () => {
    expect(isFinal("CLOSED")).toBe(true);
    expect(isFinal("REMOVED")).toBe(true);
    expect(canEdit("CLOSED")).toBe(false);
    expect(canEdit("PUBLISHED")).toBe(true);
    for (const rule of [
      ...Object.values(EMPLOYER_TRANSITIONS),
      ...Object.values(ADMIN_TRANSITIONS),
    ]) {
      expect(rule.from).not.toContain("CLOSED");
      expect(rule.from).not.toContain("REMOVED");
    }
  });

  it("recognises only known actions", () => {
    expect(isEmployerJobAction("submit")).toBe(true);
    expect(isEmployerJobAction("approve")).toBe(false);
    expect(isAdminJobAction("approve")).toBe(true);
    expect(isAdminJobAction("constructor")).toBe(false);
  });
});

describe("editing (BR-JOB-004/005)", () => {
  const base = {
    title: "Engineer",
    description: "d",
    requirements: "r",
    salaryMin: 40000,
    salaryMax: 50000,
    salaryPeriod: "YEAR",
  };

  it("spots material changes only in title, text and salary", () => {
    expect(isMaterialChange(base, { ...base })).toBe(false);
    expect(isMaterialChange(base, { ...base, title: "Senior Engineer" })).toBe(
      true,
    );
    expect(isMaterialChange(base, { ...base, salaryMax: 60000 })).toBe(true);
  });

  it("sends a live job back for approval only on a material change", () => {
    expect(statusAfterEdit("PUBLISHED", true)).toBe("PENDING_APPROVAL");
    expect(statusAfterEdit("PAUSED", true)).toBe("PENDING_APPROVAL");
    expect(statusAfterEdit("PUBLISHED", false)).toBe("PUBLISHED"); // e.g. deadline extended
  });

  it("turns a rejected job back into a draft, and leaves drafts alone", () => {
    expect(statusAfterEdit("REJECTED", false)).toBe("DRAFT");
    expect(statusAfterEdit("DRAFT", true)).toBe("DRAFT");
  });
});

describe("JobInput", () => {
  const valid = {
    title: "Software Engineer",
    description:
      "Join our team building logistics software used by hundreds of shops.",
    requirements: "3+ years of TypeScript experience.",
    workMode: "HYBRID",
    location: "Manchester",
    jobType: "FULL_TIME",
    experienceLevel: "MID",
    industryId: "01a1cd0d-dc07-78b7-898d-42f24fd57db7",
    salaryMin: "40000",
    salaryMax: "50000",
    salaryPeriod: "YEAR",
    deadline: "2026-12-31",
  };

  it("accepts a complete job and turns form strings into numbers", () => {
    expect(JobInput.parse(valid)).toMatchObject({
      salaryMin: 40000,
      salaryMax: 50000,
    });
  });

  it("requires a location unless remote (BR-JOB-010)", () => {
    expect(JobInput.safeParse({ ...valid, location: "" }).success).toBe(false);
    expect(
      JobInput.parse({ ...valid, workMode: "REMOTE", location: "" }).location,
    ).toBeNull();
  });

  it("rejects max < min (BR-JOB-003)", () => {
    const r = JobInput.safeParse({ ...valid, salaryMin: "60000" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["salaryMax"]);
  });

  it("reports cross-field problems together with other field errors", () => {
    const r = JobInput.safeParse({
      ...valid,
      title: "",
      location: "",
      salaryMin: "60000",
    });
    const fields = r.error?.issues.map((i) => i.path[0]);
    expect(fields).toEqual(
      expect.arrayContaining(["title", "location", "salaryMax"]),
    );
  });

  it("skips the salary comparison while a salary itself is invalid", () => {
    const r = JobInput.safeParse({
      ...valid,
      salaryMin: "abc",
      salaryMax: "1",
    });
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(["salaryMin"]);
  });

  it("rejects decimals, negatives and missing dates", () => {
    expect(JobInput.safeParse({ ...valid, salaryMin: "40000.5" }).success).toBe(
      false,
    );
    expect(JobInput.safeParse({ ...valid, salaryMin: "-1" }).success).toBe(
      false,
    );
    expect(JobInput.safeParse({ ...valid, deadline: "" }).success).toBe(false);
  });
});
