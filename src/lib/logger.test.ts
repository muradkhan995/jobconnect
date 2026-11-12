import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger } from "./logger";

function capture() {
  const lines: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      lines.push(JSON.parse(chunk.toString()));
      cb();
    },
  });
  return { log: createLogger(stream), lines };
}

describe("logger", () => {
  it("writes JSON with a text level and ISO time", () => {
    const { log, lines } = capture();
    log.info("hello");
    expect(lines[0]).toMatchObject({ level: "info", msg: "hello" });
    expect(String(lines[0]?.["time"])).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("redacts personal data at the top level", () => {
    const { log, lines } = capture();
    log.info(
      { email: "amira@example.com", password: "hunter2hunter2" },
      "signup",
    );
    const out = JSON.stringify(lines[0]);
    expect(out).not.toContain("amira@example.com");
    expect(out).not.toContain("hunter2hunter2");
    expect(lines[0]?.["email"]).toBe("[REDACTED]");
  });

  it("redacts personal data one level deep", () => {
    const { log, lines } = capture();
    log.info(
      {
        user: {
          id: "u1",
          email: "amira@example.com",
          fullName: "Amira Hassan",
        },
      },
      "x",
    );
    const out = JSON.stringify(lines[0]);
    expect(out).not.toContain("amira@example.com");
    expect(out).not.toContain("Amira Hassan");
    expect(out).toContain("u1");
  });

  it("redacts cookies and authorization headers", () => {
    const { log, lines } = capture();
    log.info(
      {
        req: {
          headers: { cookie: "session=abc", authorization: "Bearer xyz" },
        },
      },
      "x",
    );
    const out = JSON.stringify(lines[0]);
    expect(out).not.toContain("session=abc");
    expect(out).not.toContain("Bearer xyz");
  });
});
