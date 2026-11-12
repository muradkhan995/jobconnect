import { describe, expect, it } from "vitest";
import {
  ADMIN_TRANSITIONS,
  canEmployerEdit,
  isAdminCompanyAction,
  statusAfterEmployerEdit,
} from "./rules";
import { CompanyInput } from "./schemas";

describe("company lifecycle (BR §2)", () => {
  it("only pending companies can be verified or rejected", () => {
    expect(ADMIN_TRANSITIONS.verify.from).toBe("PENDING");
    expect(ADMIN_TRANSITIONS.reject.from).toBe("PENDING");
  });

  it("requires a reason to reject or suspend (BR-CMP-002)", () => {
    expect(ADMIN_TRANSITIONS.reject.needsReason).toBe(true);
    expect(ADMIN_TRANSITIONS.suspend.needsReason).toBe(true);
    expect(ADMIN_TRANSITIONS.verify.needsReason).toBe(false);
  });

  it("suspend and reinstate move between VERIFIED and SUSPENDED", () => {
    expect(ADMIN_TRANSITIONS.suspend).toMatchObject({
      from: "VERIFIED",
      to: "SUSPENDED",
    });
    expect(ADMIN_TRANSITIONS.reinstate).toMatchObject({
      from: "SUSPENDED",
      to: "VERIFIED",
    });
  });

  it("recognises only known actions", () => {
    expect(isAdminCompanyAction("verify")).toBe(true);
    expect(isAdminCompanyAction("delete")).toBe(false);
    expect(isAdminCompanyAction("toString")).toBe(false);
  });

  it("sends a rejected company back to review when edited, and leaves others alone", () => {
    expect(statusAfterEmployerEdit("REJECTED")).toBe("PENDING");
    expect(statusAfterEmployerEdit("VERIFIED")).toBe("VERIFIED");
    expect(statusAfterEmployerEdit("PENDING")).toBe("PENDING");
  });

  it("blocks edits while suspended", () => {
    expect(canEmployerEdit("SUSPENDED")).toBe(false);
    expect(canEmployerEdit("REJECTED")).toBe(true);
  });
});

describe("CompanyInput", () => {
  const valid = {
    name: "ABC Ltd",
    description: "We build software for logistics companies across the UK.",
    industryId: "01a1cd0d-dc07-78b7-898d-42f24fd57db7",
    size: "SIZE_51_200",
    location: "Manchester",
    website: "https://abc.example",
  };

  it("accepts a complete profile", () => {
    expect(CompanyInput.parse(valid)).toMatchObject({
      name: "ABC Ltd",
      website: "https://abc.example",
    });
  });

  it("treats an empty website as none", () => {
    expect(CompanyInput.parse({ ...valid, website: "" }).website).toBeNull();
    expect(
      CompanyInput.parse({ ...valid, website: undefined }).website,
    ).toBeNull();
  });

  it.each(["http://abc.example", "javascript:alert(1)", "abc.example"])(
    "rejects the website %s",
    (website) => {
      expect(CompanyInput.safeParse({ ...valid, website }).success).toBe(false);
    },
  );

  it("trims and length-checks text fields", () => {
    expect(CompanyInput.parse({ ...valid, name: "  ABC Ltd  " }).name).toBe(
      "ABC Ltd",
    );
    expect(
      CompanyInput.safeParse({ ...valid, description: "too short" }).success,
    ).toBe(false);
  });

  it("rejects unknown sizes", () => {
    expect(CompanyInput.safeParse({ ...valid, size: "HUGE" }).success).toBe(
      false,
    );
  });
});
