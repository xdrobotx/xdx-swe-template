#!/usr/bin/env npx tsx
/**
 * Test runner for mocked JSONL pipeline tests.
 *
 * Runs all mocked tests using Node.js built-in test runner.
 *
 * Usage:
 *   npx tsx .pi/tests/mocked/run.ts              # Run all mocked tests
 *   npx tsx .pi/tests/mocked/run.ts pipeline     # Run specific test file
 */

import { spawn } from "node:child_process";
import * as path from "node:path";
import * as process from "node:process";

const testDir = path.join(import.meta.dirname);
const testFiles = process.argv[2]
  ? [`${process.argv[2]}.test.ts`]
  : ["pipeline.test.ts"];

let failed = 0;
let passed = 0;

async function runTest(file: string): Promise<boolean> {
  const fullPath = path.join(testDir, file);
  console.log(`\n▶ ${file}`);

  return new Promise((resolve) => {
    const proc = spawn(
      process.execPath,
      ["--test", "--test-name-pattern=.*", fullPath],
      {
        cwd: process.cwd(),
        stdio: ["inherit", "pipe", "pipe"],
        env: { ...process.env, TSX_DISABLE_CACHE: "1" },
      },
    );

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    proc.on("close", (code) => {
      if (code === 0) {
        const passMatch = stdout.match(/pass (\d+)/);
        if (passMatch) passed += parseInt(passMatch[1]);
        console.log(`  ✓ ${file}`);
      } else {
        const failMatch = stdout.match(/fail (\d+)/);
        if (failMatch) failed += parseInt(failMatch[1]);
        console.log(`  ✗ ${file}`);
      }
      resolve(code === 0);
    });
  });
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Mocked JSONL Pipeline Tests");
  console.log("=".repeat(60));

  for (const file of testFiles) {
    await runTest(file);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
