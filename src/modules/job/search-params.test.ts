import { describe, expect, it } from "vitest";
import {
  decodeCursor,
  encodeCursor,
  escapeLike,
  parseSearchParams,
} from "./search-params";

describe("parseSearchParams", () => {
  it("reads keyword, location and repeatable filters", () => {
    const p = parseSearchParams(
      new URLSearchParams(
        "q=engineer&location=Leeds&workMode=REMOTE&workMode=HYBRID&jobType=FULL_TIME",
      ),
    );
    expect(p).toMatchObject({
      q: "engineer",
      location: "Leeds",
      workMode: ["REMOTE", "HYBRID"],
      jobType: ["FULL_TIME"],
      limit: 20,
    });
  });

  it("ignores bad input instead of failing (public, user-typed URLs)", () => {
    const p = parseSearchParams(
      new URLSearchParams(
        `q=${"x".repeat(500)}&workMode=MOON&jobType=FULL_TIME&jobType=FULL_TIME&limit=9999`,
      ),
    );
    expect(p.q).toBe("");
    expect(p.workMode).toEqual([]);
    expect(p.jobType).toEqual(["FULL_TIME"]); // de-duplicated
    expect(p.limit).toBe(20);
  });

  it("accepts a page's searchParams object", () => {
    expect(
      parseSearchParams({ q: "nurse", workMode: ["ON_SITE"] }),
    ).toMatchObject({
      q: "nurse",
      workMode: ["ON_SITE"],
    });
  });
});

describe("cursor", () => {
  it("round-trips", () => {
    const c = {
      publishedAt: new Date("2026-11-12T10:00:00.000Z"),
      id: "01a1cd0d-dc07-78b7-898d-42f24fd57db7",
    };
    expect(decodeCursor(encodeCursor(c))).toEqual(c);
  });

  it("rejects tampered cursors", () => {
    expect(decodeCursor("not-a-cursor")).toBeNull();
    expect(
      decodeCursor(Buffer.from("2026-01-01|' OR 1=1 --").toString("base64url")),
    ).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
  });
});

describe("escapeLike", () => {
  it("escapes wildcards", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});
