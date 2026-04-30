# Testing Infrastructure for Agent Extensions

This directory contains the complete testing infrastructure for the `collaborator-agent` and `systems-engineer` extensions and their shared `subagent-lib` library.

## Quick Start

```bash
# From the .pi/ directory:
# Run all tests (unit + mocked + golden) — 112 tests total
cd .pi && npm test

# From the project root:
# Run individual suites
npx tsx .pi/tests/unit/run.ts
npx tsx .pi/tests/mocked/run.ts
npx tsx .pi/tests/golden/run.ts
```

## Test Suite Overview

The testing strategy follows a **hybrid approach** with four categories:

| Suite | Location | Tests | Deterministic | Needs LLM | CI Ready |
|-------|----------|-------|---------------|-----------|----------|
| **Unit** | `unit/` | 61 | ✅ | ❌ | ✅ |
| **Mocked** | `mocked/` | 31 | ✅ | ❌ | ✅ |
| **Golden** | `golden/` | 20 | ✅ | ❌ | ✅ |
| **Playground** | `../lib/playground.ts` | 4 | ❌ | ✅ | ❌ |

### 1. Unit Tests (`unit/`)

Pure utility functions tested with deterministic inputs/outputs. **Zero external dependencies** — no `@mariozechner/pi-coding-agent` or `@mariozechner/pi-tui` loaded.

**What's tested:**
- `formatTokens()` — number formatting (0, 999, 1000, 1M, 10M)
- `formatUsage()` — token usage display (input/output/cache/cost)
- `formatToolCall()` — tool call rendering (bash, read, write, edit, find, grep, ls)
- `getFinalOutput()` — extracting final text from message arrays
- `getDisplayItems()` — extracting display items (text + tool calls) from messages
- `buildSystemPrompt()` — system prompt generation with all options

**Run:**
```bash
npx tsx .pi/tests/unit/run.ts
```

**Example output:**
```
✔ formatTokens (7ms)
✔ formatUsage (2ms)
✔ formatToolCall (3ms)
✔ getFinalOutput (5ms)
✔ getDisplayItems (4ms)
✔ buildSystemPrompt (8ms)

Results: 61 passed, 0 failed
```

### 2. Mocked JSONL Pipeline Tests (`mocked/`)

Tests the JSONL parsing and rendering pipeline with **fixed fixture data**. Validates the entire parsing pipeline without hitting an LLM.

**What's tested:**
- JSONL parsing of feasibility study output
- JSONL parsing of system design output (with mermaid diagrams)
- JSONL parsing of error output (exit code 1)
- JSONL parsing of aborted output (stop reason: "aborted")
- `getDisplayItems()` extraction from parsed messages
- `formatUsage()` formatting from parsed usage data

**Run:**
```bash
npx tsx .pi/tests/mocked/run.ts
```

**Example output:**
```
✔ parseFeasibilityStudy (14ms)
✔ parseSystemDesign (3ms)
✔ parseErrorOutput (3ms)
✔ parseAbortedOutput (2ms)
✔ getDisplayItems from fixtures (4ms)
✔ formatUsage from fixture (3ms)

Results: 31 passed, 0 failed
```

### 3. Golden File Tests (`golden/`)

Structural regression tracking. Compares output against baseline files to catch format drift. Uses the same fixture data as mocked tests but validates content structure.

**What's tested:**
- Markdown structure (## sections, ### subsections)
- Content patterns (bullets, diagrams, requirement IDs)
- Output length thresholds
- Topic relevance

**Run:** 
```bash
npx tsx .pi/tests/golden/run.ts
```

**Example output:**
```
✔ Golden: Feasibility Study (6ms)
✔ Golden: System Design (2ms)
✔ Golden: Error Output (1ms)
✔ Golden: Aborted Output (1ms)

Results: 20 passed, 0 failed
```

### 4. Manual Playground (`../lib/playground.ts`)

Real-world validation using the `pi` CLI. Spawns `pi` as a subprocess with a fixed system prompt and validates the LLM output.

**What's tested:**
- Actual LLM integration
- End-to-end subagent spawning
- Real token usage and cost tracking
- Output quality validation

**Run:**
```bash
# Run all 4 test scenarios
node .pi/lib/playground.ts "Test topic" all

# Run a specific scenario
node .pi/lib/playground.ts "Test topic" feasibility

# Run with a custom topic
node .pi/lib/playground.ts "Your custom topic here" all
```

> **Note:** Run directly with `node` (not `npx tsx`). The subprocess spawning uses `cmd /c` with `shell: false` for Windows compatibility, which works reliably when executed directly but may hang when run through `npx tsx`.

**Example output:**
```
======================================================================
  Subagent Extension Playground
======================================================================

Topic: Test feasibility study
Mode: feasibility

──────────────────────────────────────────────────────────────────────
  Test: Feasibility Study
  Topic: Test feasibility study
──────────────────────────────────────────────────────────────────────
  ✓ Exit code: 0
  ✓ Output length: 2140 chars
  ✓ Turns: 12
  Patterns: 4/4 found
  Markdown structure: ✓
  Bullet points: ✓
  Sections (≥2): ✓
  Output saved to: C:\Users\...\pi-playground-output\feasibility-study.md
  Usage: ↑16k ↓1.5k $0.0000
```

## Fixture Files

Located in `fixtures/`. These are JSONL files that mirror the actual subagent output stream format.

| File | Description |
|------|-------------|
| `feasibility-study.jsonl` | Mock collaboration agent output (feasibility study) |
| `system-design.jsonl` | Mock systems engineer output (system design with mermaid) |
| `error-output.jsonl` | Mock error output (exit code 1, error message) |
| `aborted-output.jsonl` | Mock aborted output (stop reason: "aborted") |

**Adding a new fixture:**
1. Create a new `.jsonl` file in `fixtures/`
2. Add a test case in `mocked/pipeline.test.ts`
3. Add a golden test case in `golden/golden.test.ts`

## CI/CD Integration

Add to your CI pipeline (e.g., `.github/workflows/extension-tests.yml`):

```yaml
name: Extension Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm install
      - name: Run all tests
        run: cd .pi && npm test
```

**What runs in CI:**
- ✅ Unit tests (fast, deterministic, no LLM)
- ✅ Mocked JSONL tests (fast, deterministic, no LLM)
- ✅ Golden file tests (fast, deterministic, no LLM)
- ❌ Manual playground (slow, non-deterministic, needs API key)

## ESM Compatibility

All test files and runners have been updated for ESM compatibility (Node.js 24+):

- `__dirname` replaced with `import.meta.dirname` in all runner scripts and test files
- `require()` calls replaced with `import` statements (e.g., `os.homedir()`)
- The `@mariozechner/pi-tui` and `@mariozechner/pi-coding-agent` dependencies are not needed for unit/mocked/golden tests — the `renderToolResult` import was removed from the mocked tests since it's unused and pulls in external dependencies

These changes ensure tests run with **zero external dependencies** beyond what's listed in `.pi/package.json`.

## Updating Golden Files

When the shared library changes, update golden file baselines:

```bash
# 1. Re-run playground with real LLM to generate new baselines
node .pi/lib/playground.ts "Test topic" all

# 2. Run golden tests to verify structure
npx tsx .pi/tests/golden/run.ts

# 3. Update fixture files if needed
#    (edit .pi/tests/fixtures/*.jsonl)

# 4. Commit updated fixtures
git add .pi/tests/fixtures/
git commit -m "Update golden file fixtures after lib changes"
```

## Test Isolation Strategy

Unit tests are isolated from external dependencies by extracting pure functions into separate files:

| Pure Module | Purpose |
|-------------|---------|
| `pure-types.ts` | Type definitions (no imports) |
| `result-formatters.ts` | Formatting utilities (imports only `pure-types.ts`) |
| `message-utils.ts` | Message processing (imports only `pure-types.ts`) |
| `quick-report.ts` | Spawn helper (imports `message-utils.ts` and `pure-types.ts`) |

This ensures unit tests run in **<5 seconds** with **zero external dependencies**.

## Troubleshooting

### `ReferenceError: __dirname is not defined in ES module scope`
This happens when running test files through `tsx` in ESM mode. All test files and runners have been fixed to use `import.meta.dirname` instead of `__dirname`.

### `ERR_MODULE_NOT_FOUND: Cannot find package '@mariozechner/pi-tui'`
This occurs when importing `result-renderer.ts` in mocked/golden tests. The `renderToolResult` import was removed from mocked tests since it's unused and pulls in external dependencies not needed for pipeline testing.

### `ERR_MODULE_NOT_FOUND` (general)
```bash
cd .pi && npm install
```

### Test assertion failures
Check that assertions match actual implementation behavior:
- Token formatting: `1M` → `1.0M`, `5k` → `5.0k`
- Usage fields: check for `cacheRead`/`cacheWrite` vs `cache`/`cacheTotal`

### Playground spawn errors

**`pi` CLI not installed:**
```bash
npm install -g @mariozechner/pi-coding-agent
```

**Spawn fails with `ENOENT` or `EINVAL` (Windows):**
The `pi` CLI is a POSIX shell script (`#!/bin/sh`). On Windows, subprocess spawning requires `cmd /c` as the command with `shell: false`. The playground handles this automatically — ensure you're running it directly with `node`, not through `npx tsx` (which may hang due to environment differences).

```bash
# ✅ Works
node .pi/lib/playground.ts "Topic" all

# ❌ May hang (environment differences)
npx tsx .pi/lib/playground.ts "Topic" all
```

**Timeouts on complex topics:**
Complex topics (e.g., full feasibility studies, system designs) may take 2-3 minutes. Use longer timeouts if running in CI:
```bash
timeout 180 node .pi/lib/playground.ts "Complex topic" all
```

## Directory Structure

```
.pi/tests/
├── README.md                          # This file
├── fixtures/
│   ├── feasibility-study.jsonl        # Mock collaboration agent output
│   ├── system-design.jsonl            # Mock systems engineer output
│   ├── error-output.jsonl             # Mock error output
│   └── aborted-output.jsonl           # Mock aborted output
├── unit/
│   ├── run.ts                         # Unit test runner
│   ├── result-renderer.test.ts        # Format token/usage/tool call tests
│   ├── subagent-runner.test.ts        # Message processing tests
│   └── system-prompts.test.ts         # System prompt generation tests
├── mocked/
│   ├── run.ts                         # Mocked test runner
│   └── pipeline.test.ts               # JSONL parsing pipeline tests
└── golden/
    ├── run.ts                         # Golden test runner
    └── golden.test.ts                 # Content structure regression tests
```
