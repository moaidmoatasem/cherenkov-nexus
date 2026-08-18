/**
 * Seal rules snapshots: recompute each snapshot's content-addressed id.
 *
 * Run after editing any file in data/snapshots. A snapshot whose id does not
 * match its content fails validation at load — that is deliberate, so an
 * edited-but-unsealed snapshot can never quietly produce verdicts.
 *
 *   npm run oracle:seal          # rewrite ids in place
 *   npm run oracle:seal -- --check   # exit 1 if any id is stale (for CI)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expectedId, listSnapshots, SNAPSHOT_DIR } from "../src/oracle/snapshot";
import type { RulesSnapshot } from "../src/oracle/types";

const checkOnly = process.argv.includes("--check");

const files = listSnapshots();
if (files.length === 0) {
  console.error(`No snapshots found in ${SNAPSHOT_DIR}`);
  process.exit(1);
}

let stale = 0;

for (const file of files) {
  const path = join(SNAPSHOT_DIR, file);
  const raw = JSON.parse(readFileSync(path, "utf8")) as RulesSnapshot;
  const { id: declared, ...body } = raw;
  const expected = expectedId(body);

  if (declared === expected) {
    console.log(`  ok     ${file}  ${expected}`);
    continue;
  }

  stale += 1;
  if (checkOnly) {
    console.error(`  STALE  ${file}`);
    console.error(`         declared: ${declared}`);
    console.error(`         expected: ${expected}`);
    continue;
  }

  // Keep `id` first in the file so it reads like a header.
  const resealed = { id: expected, ...body };
  writeFileSync(path, `${JSON.stringify(resealed, null, 2)}\n`, "utf8");
  console.log(`  sealed ${file}  ${declared} -> ${expected}`);
}

if (checkOnly && stale > 0) {
  console.error(`\n${stale} snapshot(s) out of date. Run \`npm run oracle:seal\`.`);
  process.exit(1);
}

if (!checkOnly && stale > 0) {
  console.log(`\nSealed ${stale} snapshot(s).`);
}
