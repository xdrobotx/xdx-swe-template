#!/usr/bin/env npx tsx
/**
 * Test runner for unit tests.
 *
 * Runs all unit tests using Node.js built-in test runner.
 *
 * Usage:
 *   npx tsx .pi/tests/unit/run.ts              # Run all unit tests
 *   npx tsx .pi/tests/unit/run.ts result-renderer  # Run specific test file
 */

import { spawn } from "node:child_process";
import * as path from "node:path";
import * as process from "node:process";

const testDir = path.join(import.meta.dirname);
const testFiles = process.argv[2]
  ? [`${process.argv[2]}.test.ts`]
  : ["result-renderer.test.ts", "subagent-runner.test.ts", "system-prompts.test.ts"];

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
        // Count passed tests from Node.js test runner output
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
  console.log("  Unit Tests");
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
