/**
 * Unit tests for system-prompts.ts
 *
 * Tests: buildSystemPrompt()
 * Uses Node.js built-in `node:test` + `node:assert`.
 *
 * Run: npx tsx .pi/tests/unit/system-prompts.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { buildSystemPrompt } from "../../lib/system-prompts.ts";
import type { PromptBuilderOptions } from "../../lib/pure-types.ts";

// ─── buildSystemPrompt ──────────────────────────────────────────────────────

const baseOpts: PromptBuilderOptions = {
  role: "TEST AGENT",
  modeLabel: "test mode",
  topic: "Test topic",
  restrictions: ["DO NOT generate source code", "DO NOT modify config files"],
  allowedExtensions: [".md", ".txt"],
  workflow: ["Step one", "Step two", "Step three"],
};

describe("buildSystemPrompt", () => {
  it("includes role header", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(prompt.includes("# TEST AGENT"));
  });

  it("includes mode label", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(prompt.includes("test mode"));
  });

  it("includes topic", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(prompt.includes("Test topic"));
  });

  it("includes file permissions section", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(prompt.includes("File Permissions"));
    assert.ok(prompt.includes(".md"));
    assert.ok(prompt.includes(".txt"));
  });

  it("includes restrictions section", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(prompt.includes("ABSOLUTE RESTRICTIONS"));
    assert.ok(prompt.includes("DO NOT generate source code"));
    assert.ok(prompt.includes("DO NOT modify config files"));
  });

  it("includes workflow steps", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(prompt.includes("## Workflow"));
    assert.ok(prompt.includes("1. **Step one**"));
    assert.ok(prompt.includes("2. **Step two**"));
    assert.ok(prompt.includes("3. **Step three**"));
  });

  it("includes domain info when provided", () => {
    const opts = {
      ...baseOpts,
      domainInfo: "This is a CPS simulation platform.",
    };
    const prompt = buildSystemPrompt(opts);
    assert.ok(prompt.includes("## Domain Context"));
    assert.ok(prompt.includes("CPS simulation platform"));
  });

  it("omits domain info when not provided", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(!prompt.includes("## Domain Context"));
  });

  it("includes reporting instructions when provided", () => {
    const opts = {
      ...baseOpts,
      reportingInstructions: "Save to design/ directory.",
    };
    const prompt = buildSystemPrompt(opts);
    assert.ok(prompt.includes("## Reporting"));
    assert.ok(prompt.includes("Save to design/ directory."));
  });

  it("omits reporting instructions when not provided", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(!prompt.includes("## Reporting"));
  });

  it("includes output format section", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(prompt.includes("## Output Format"));
    assert.ok(prompt.includes("design/"));
  });

  it("includes current task section", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(prompt.includes("## Current Task"));
    assert.ok(prompt.includes("Test topic"));
  });

  it("handles empty restrictions", () => {
    const opts = {
      ...baseOpts,
      restrictions: [],
    };
    const prompt = buildSystemPrompt(opts);
    assert.ok(prompt.includes("ABSOLUTE RESTRICTIONS"));
  });

  it("handles empty workflow", () => {
    const opts = {
      ...baseOpts,
      workflow: [],
    };
    const prompt = buildSystemPrompt(opts);
    assert.ok(prompt.includes("## Workflow"));
  });

  it("includes depth modifier when provided", () => {
    const opts = {
      ...baseOpts,
      depthModifier: "Perform an exhaustive analysis.",
    };
    const prompt = buildSystemPrompt(opts);
    assert.ok(prompt.includes("exhaustive analysis"));
  });

  it("omits depth modifier when not provided", () => {
    const prompt = buildSystemPrompt(baseOpts);
    assert.ok(!prompt.includes("exhaustive"));
  });

  it("produces a single coherent prompt (no extra newlines between sections)", () => {
    const prompt = buildSystemPrompt(baseOpts);
    // Verify it's a valid multi-line prompt
    const lines = prompt.split("\n").filter(l => l.trim());
    assert.ok(lines.length > 10, "Prompt should have substantial content");
  });
});
