import { describe, expect, it } from "vitest";
import { getHealth } from "./health";

describe("getHealth", () => {
  it("reports ok", () => {
    expect(getHealth()).toEqual({ status: "ok" });
  });

  it("exposes no internal details", () => {
    expect(Object.keys(getHealth())).toEqual(["status"]);
  });
});
