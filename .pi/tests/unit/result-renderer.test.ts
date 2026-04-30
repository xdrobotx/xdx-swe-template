/**
 * Unit tests for result-renderer.ts
 *
 * Tests: formatTokens(), formatUsage(), formatToolCall()
 * Uses Node.js built-in `node:test` + `node:assert`.
 *
 * Run: npx tsx .pi/tests/unit/result-renderer.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import os from "node:os";
import { formatTokens, formatUsage, formatToolCall } from "../../lib/result-formatters.ts";

// ─── formatTokens ────────────────────────────────────────────────────────────

describe("formatTokens", () => {
  it("returns '0' for 0", () => {
    assert.strictEqual(formatTokens(0), "0");
  });

  it("returns '999' for 999", () => {
    assert.strictEqual(formatTokens(999), "999");
  });

  it("returns '1.0k' for 1000", () => {
    assert.strictEqual(formatTokens(1000), "1.0k");
  });

  it("returns '1.5k' for 1500", () => {
    assert.strictEqual(formatTokens(1500), "1.5k");
  });

  it("returns '9.9k' for 9900", () => {
    assert.strictEqual(formatTokens(9900), "9.9k");
  });

  it("returns '10k' for 10000", () => {
    assert.strictEqual(formatTokens(10000), "10k");
  });

  it("returns '100k' for 100000", () => {
    assert.strictEqual(formatTokens(100000), "100k");
  });

  it("returns '1.0M' for 1000000", () => {
    assert.strictEqual(formatTokens(1000000), "1.0M");
  });

  it("returns '1.5M' for 1500000", () => {
    assert.strictEqual(formatTokens(1500000), "1.5M");
  });

  it("returns '10.0M' for 10000000", () => {
    assert.strictEqual(formatTokens(10000000), "10.0M");
  });

  it("handles large numbers", () => {
    assert.strictEqual(formatTokens(999999999), "1000.0M");
    assert.strictEqual(formatTokens(1500000000), "1500.0M");
  });
});

// ─── formatUsage ─────────────────────────────────────────────────────────────

describe("formatUsage", () => {
  it("returns empty string for zero usage", () => {
    const usage = {
      input: 0, output: 0, cacheRead: 0, cacheWrite: 0,
      cost: 0, contextTokens: 0, turns: 0,
    };
    assert.strictEqual(formatUsage(usage), "");
  });

  it("includes turns when present", () => {
    const usage = {
      input: 1000, output: 500, cacheRead: 0, cacheWrite: 0,
      cost: 0.001, contextTokens: 0, turns: 3,
    };
    const result = formatUsage(usage);
    assert.ok(result.includes("3 turns"));
  });

  it("uses singular 'turn' for 1 turn", () => {
    const usage = {
      input: 1000, output: 500, cacheRead: 0, cacheWrite: 0,
      cost: 0.001, contextTokens: 0, turns: 1,
    };
    const result = formatUsage(usage);
    assert.ok(result.includes("1 turn"));
    assert.ok(!result.includes("turns"));
  });

  it("includes input tokens with arrow", () => {
    const usage = {
      input: 1500, output: 0, cacheRead: 0, cacheWrite: 0,
      cost: 0, contextTokens: 0, turns: 0,
    };
    const result = formatUsage(usage);
    assert.ok(result.includes("↑1.5k"));
  });

  it("includes output tokens with arrow", () => {
    const usage = {
      input: 0, output: 25000, cacheRead: 0, cacheWrite: 0,
      cost: 0, contextTokens: 0, turns: 0,
    };
    const result = formatUsage(usage);
    assert.ok(result.includes("↓25k"));
  });

  it("includes cache read/write", () => {
    const usage = {
      input: 0, output: 0, cacheRead: 5000, cacheWrite: 2000,
      cost: 0, contextTokens: 0, turns: 0,
    };
    const result = formatUsage(usage);
    assert.ok(result.includes("R5.0k"));
    assert.ok(result.includes("W2.0k"));
  });

  it("includes cost", () => {
    const usage = {
      input: 0, output: 0, cacheRead: 0, cacheWrite: 0,
      cost: 0.0045, contextTokens: 0, turns: 0,
    };
    const result = formatUsage(usage);
    assert.ok(result.includes("$0.0045"));
  });

  it("includes model name", () => {
    const usage = {
      input: 0, output: 0, cacheRead: 0, cacheWrite: 0,
      cost: 0, contextTokens: 0, turns: 0,
    };
    const result = formatUsage(usage, "claude-sonnet-4-20250514");
    assert.ok(result.includes("claude-sonnet-4-20250514"));
  });

  it("combines all fields", () => {
    const usage = {
      input: 3500, output: 850, cacheRead: 2000, cacheWrite: 500,
      cost: 0.0025, contextTokens: 0, turns: 5,
    };
    const result = formatUsage(usage, "claude-sonnet-4-20250514");
    assert.ok(result.includes("5 turns"));
    assert.ok(result.includes("↑3.5k"));
    assert.ok(result.includes("↓850"));
    assert.ok(result.includes("R2.0k"));
    assert.ok(result.includes("W500"));
    assert.ok(result.includes("$0.0025"));
    assert.ok(result.includes("claude-sonnet-4-20250514"));
  });
});

// ─── formatToolCall ──────────────────────────────────────────────────────────

describe("formatToolCall", () => {
  // Simple mock fg function
  const fg = (_color: any, text: string) => text;

  it("formats bash tool", () => {
    const result = formatToolCall("bash", { command: "ls -la" }, fg);
    assert.ok(result.includes("$"));
    assert.ok(result.includes("ls -la"));
  });

  it("truncates long bash commands", () => {
    const longCmd = "echo " + "a".repeat(100);
    const result = formatToolCall("bash", { command: longCmd }, fg);
    assert.ok(result.length < 100);
    assert.ok(result.includes("..."));
  });

  it("formats read tool with file_path", () => {
    const result = formatToolCall("read", { file_path: "/home/user/project/src/main.ts" }, fg);
    assert.ok(result.includes("read"));
  });

  it("formats read tool with path", () => {
    const result = formatToolCall("read", { path: "/home/user/project/src/main.ts" }, fg);
    assert.ok(result.includes("read"));
  });

  it("formats write tool", () => {
    const result = formatToolCall("write", { file_path: "./design/test.md" }, fg);
    assert.ok(result.includes("write"));
  });

  it("formats edit tool", () => {
    const result = formatToolCall("edit", { file_path: "./src/app.ts" }, fg);
    assert.ok(result.includes("edit"));
  });

  it("formats find tool", () => {
    const result = formatToolCall("find", { pattern: "*.ts", path: "./src" }, fg);
    assert.ok(result.includes("find"));
    assert.ok(result.includes("*.ts"));
  });

  it("formats grep tool", () => {
    const result = formatToolCall("grep", { pattern: "hello", path: "./src" }, fg);
    assert.ok(result.includes("grep"));
    assert.ok(result.includes("/hello/"));
  });

  it("formats ls tool", () => {
    const result = formatToolCall("ls", { path: "./src" }, fg);
    assert.ok(result.includes("ls"));
  });

  it("handles unknown tool with JSON", () => {
    const result = formatToolCall("custom_tool", { foo: "bar", baz: 42 }, fg);
    assert.ok(result.includes("custom_tool"));
    assert.ok(result.includes("foo"));
    assert.ok(result.includes("bar"));
  });

  it("shortens paths with home directory", () => {
    const home = os.homedir();
    const result = formatToolCall("read", { file_path: home + "/project/src/main.ts" }, fg);
    assert.ok(result.includes("~"));
    assert.ok(!result.includes(home));
  });
});
