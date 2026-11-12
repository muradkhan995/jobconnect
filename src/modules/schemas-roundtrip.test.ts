import { describe, expect, it } from "vitest";
import { ApplyInput } from "./application/schemas";
import { ProfileInput } from "./candidate/schemas";
import { CompanyInput } from "./company/schemas";
import { JobInput } from "./job/schemas";

/**
 * Forms validate with the same schema as the API and then SEND THE PARSED VALUE, which the API
 * parses again. So every input schema must accept its own output (e.g. "" → null → null).
 * Regression test for defect #26: an empty phone/location became null and the API rejected it.
 */
const cases = [
  [
    "ProfileInput",
    ProfileInput,
    { fullName: "Amira Hassan", headline: "", location: "", phone: "" },
  ],
  [
    "JobInput (remote, no location)",
    JobInput,
    {
      title: "Remote analyst",
      description:
        "A fully remote analyst role working with logistics data across the UK.",
      requirements: "SQL, Python and plenty of curiosity.",
      workMode: "REMOTE",
      location: "",
      jobType: "FULL_TIME",
      experienceLevel: "MID",
      industryId: "01a1cd0d-dc07-78b7-898d-42f24fd57db7",
      salaryMin: "30000",
      salaryMax: "40000",
      salaryPeriod: "YEAR",
      deadline: "2026-12-31",
    },
  ],
  [
    "CompanyInput (no website)",
    CompanyInput,
    {
      name: "ABC Ltd",
      description: "We build software for logistics companies across the UK.",
      industryId: "01a1cd0d-dc07-78b7-898d-42f24fd57db7",
      size: "SIZE_11_50",
      location: "Leeds",
      website: "",
    },
  ],
  [
    "ApplyInput (no cover letter)",
    ApplyInput,
    {
      jobId: "01a1cd0d-dc07-78b7-898d-42f24fd57db7",
      cvId: "01a1cd0d-dc07-78b7-898d-42f24fd57db7",
      coverLetter: "",
    },
  ],
] as const;

describe("input schemas accept their own output (form → API)", () => {
  it.each(cases)("%s", (_name, schema, raw) => {
    const once = (schema as { parse: (v: unknown) => unknown }).parse(raw);
    const twice = (schema as { parse: (v: unknown) => unknown }).parse(once);
    expect(twice).toEqual(once);
  });
});
