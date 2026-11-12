/**
 * Regenerates docs/08-testing/03-test-cases.md from the test files themselves, so the catalogue
 * always matches the real tests.
 *
 *   npm run docs:test-cases
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["src", "e2e"];
const OUT = "docs/08-testing/03-test-cases.md";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name === "generated" || name === "node_modules") return [];
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const kindOf = (file) =>
  file.startsWith("e2e/")
    ? "E2E"
    : file.endsWith(".int.test.ts")
      ? "Integration"
      : "Unit";

// describe("…") / it("…") / it.each([...])("…") / test("…") – first string argument, any quote style.
const TITLE =
  /\b(describe|it(?:\.each\([\s\S]*?\))?|test)\(\s*(["'`])((?:\\.|(?!\2)[\s\S])*?)\2/g;

const files = ROOTS.flatMap(walk)
  .filter((f) => /\.(int\.)?test\.ts$|\.spec\.ts$/.test(f))
  .map((f) => relative(".", f))
  .sort();

const rows = [];
const counts = { Unit: 0, Integration: 0, E2E: 0 };
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const kind = kindOf(file);
  let suite = "";
  for (const m of src.matchAll(TITLE)) {
    const title = m[3].replace(/\s+/g, " ").replace(/\|/g, "\\|");
    if (m[1] === "describe") {
      suite = title;
      continue;
    }
    counts[kind]++;
    rows.push(
      `| ${kind} | \`${file}\` | ${suite ? `${suite} › ` : ""}${title} |`,
    );
  }
}

const total = counts.Unit + counts.Integration + counts.E2E;
const md = `# Test Case Catalogue

> **Generated** by \`npm run docs:test-cases\` from the test files – do not edit by hand.
> Parameterised cases (\`it.each\`) count once here but run once per value.

| Kind | Test cases |
|---|---|
| Unit | ${counts.Unit} |
| Integration (real PostgreSQL + Mailpit) | ${counts.Integration} |
| End-to-end (Playwright, production build) | ${counts.E2E} |
| **Total** | **${total}** |

How each kind is used: [01-test-strategy.md](01-test-strategy.md).

| Kind | File | Case |
|---|---|---|
${rows.join("\n")}
`;

writeFileSync(OUT, md);
console.log(
  `Wrote ${OUT}: ${total} cases (${counts.Unit} unit, ${counts.Integration} integration, ${counts.E2E} e2e)`,
);
