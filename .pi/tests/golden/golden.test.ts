/**
 * Golden file tests for structural regression tracking.
 *
 * Compares fixture outputs against baseline expectations to catch format drift.
 * Uses the fixtures as the "golden" baseline since they represent the expected
 * output structure.
 *
 * Run: npx tsx .pi/tests/golden/golden.test.ts
 */

import { describe, it, before } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import { getFinalOutput } from "../../lib/utl-message-utils.ts";
import type { Message } from "@mariozechner/pi-ai";

// ─── Fixture loader ─────────────────────────────────────────────────────────

function loadFixture(name: string): string {
  const fixturePath = path.join(import.meta.dirname, "../fixtures", name);
  return fs.readFileSync(fixturePath, "utf-8");
}

// ─── JSONL parser ───────────────────────────────────────────────────────────

interface JsonlEvent {
  type: string;
  message?: Message;
}

function parseJsonl(lines: string[]): Message[] {
  const messages: Message[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let event: JsonlEvent;
    try { event = JSON.parse(trimmed); } catch { continue; }
    if (event.type === "message_end" && event.message) {
      messages.push(event.message as Message);
    }
    if (event.type === "tool_result_end" && event.message) {
      messages.push(event.message as Message);
    }
  }
  return messages;
}

// ─── Golden: Feasibility Study ──────────────────────────────────────────────

describe("Golden: Feasibility Study", () => {
  let output: string;

  before(() => {
    const content = loadFixture("feasibility-study.jsonl");
    const messages = parseJsonl(content.split("\n"));
    output = getFinalOutput(messages);
  });

  it("has markdown structure (## sections)", () => {
    const sections = output.match(/^##/gm) || [];
    assert.ok(sections.length >= 4, `Expected ≥4 sections, found ${sections.length}`);
  });

  it("has subsections (###)", () => {
    const subsections = output.match(/^###/gm) || [];
    assert.ok(subsections.length >= 2, `Expected ≥2 subsections, found ${subsections.length}`);
  });

  it("has bullet points", () => {
    assert.ok(output.includes("-"), "Should have bullet points");
  });

  it("contains topic-relevant content", () => {
    assert.ok(output.toLowerCase().includes("feasibility"), "Should mention feasibility");
  });

  it("has a risk assessment section", () => {
    assert.ok(output.toLowerCase().includes("risk"), "Should contain risk assessment");
  });

  it("has a recommendation", () => {
    assert.ok(output.toLowerCase().includes("recommend") || output.toLowerCase().includes("proceed"),
      "Should contain recommendation");
  });

  it("has a next steps section", () => {
    assert.ok(output.toLowerCase().includes("next step"), "Should contain next steps");
  });

  it("output is substantial (>500 chars)", () => {
    assert.ok(output.length > 500, `Output should be substantial, got ${output.length} chars`);
  });
});

// ─── Golden: System Design ──────────────────────────────────────────────────

describe("Golden: System Design", () => {
  let output: string;

  before(() => {
    const content = loadFixture("system-design.jsonl");
    const messages = parseJsonl(content.split("\n"));
    output = getFinalOutput(messages);
  });

  it("has markdown structure (## sections)", () => {
    const sections = output.match(/^##/gm) || [];
    assert.ok(sections.length >= 4, `Expected ≥4 sections, found ${sections.length}`);
  });

  it("has a component architecture section", () => {
    assert.ok(output.toLowerCase().includes("component") && output.toLowerCase().includes("architecture"),
      "Should have component architecture");
  });

  it("has a diagram", () => {
    assert.ok(output.includes("graph") || output.includes("```"), "Should have a diagram");
  });

  it("has interface definitions", () => {
    assert.ok(output.toLowerCase().includes("interface"), "Should have interface definitions");
  });

  it("has design decisions", () => {
    assert.ok(output.toLowerCase().includes("design decision") || output.toLowerCase().includes("decision"),
      "Should have design decisions");
  });

  it("has deployment considerations", () => {
    assert.ok(output.toLowerCase().includes("deployment"), "Should have deployment section");
  });

  it("has data flow description", () => {
    assert.ok(output.toLowerCase().includes("data flow") || output.includes("-->"),
      "Should have data flow");
  });
});

// ─── Golden: Error Output ───────────────────────────────────────────────────

describe("Golden: Error Output", () => {
  let output: string;

  before(() => {
    const content = loadFixture("error-output.jsonl");
    const messages = parseJsonl(content.split("\n"));
    output = getFinalOutput(messages);
  });

  it("mentions error in output", () => {
    assert.ok(output.toLowerCase().includes("error"), "Output should mention error");
  });

  it("is shorter than a complete output", () => {
    assert.ok(output.length < 500, `Error output should be shorter, got ${output.length} chars`);
  });
});

// ─── Golden: Software Engineer ──────────────────────────────────────────────

describe("Golden: Software Engineer", () => {
  let output: string;

  before(() => {
    const content = loadFixture("software-engineer-output.jsonl");
    const messages = parseJsonl(content.split("\n"));
    output = getFinalOutput(messages);
  });

  it("has markdown structure (## sections)", () => {
    const sections = output.match(/^##/gm) || [];
    assert.ok(sections.length >= 4, `Expected ≥4 sections, found ${sections.length}`);
  });

  it("has module breakdown section", () => {
    assert.ok(output.includes("Module Breakdown"), "Should have module breakdown");
  });

  it("has architecture diagram (mermaid)", () => {
    assert.ok(output.includes("mermaid"), "Should have mermaid diagram");
    assert.ok(output.includes("graph TD"), "Should have graph TD");
  });

  it("has requirements traceability", () => {
    assert.ok(output.includes("Requirements Traceability"), "Should have traceability section");
    assert.ok(output.includes("REQ-001"), "Should reference requirements");
  });

  it("has implementation notes", () => {
    assert.ok(output.includes("Implementation Notes"), "Should have implementation notes");
  });

  it("has traceability references", () => {
    assert.ok(output.includes("Requirements Traceability"), "Should have traceability section");
    assert.ok(output.includes("REQ-001"), "Should reference requirements");
  });

  it("output is substantial (>500 chars)", () => {
    assert.ok(output.length > 500, `Output should be substantial, got ${output.length} chars`);
  });
});

// ─── Golden: Aborted Output ─────────────────────────────────────────────────

describe("Golden: Aborted Output", () => {
  let output: string;

  before(() => {
    const content = loadFixture("aborted-output.jsonl");
    const messages = parseJsonl(content.split("\n"));
    output = getFinalOutput(messages);
  });

  it("has partial output", () => {
    assert.ok(output.length > 0, "Should have partial output");
  });

  it("contains topic reference", () => {
    assert.ok(output.toLowerCase().includes("feasibility") || output.toLowerCase().includes("cps"),
      "Should reference the topic");
  });

  it("is shorter than a complete output", () => {
    assert.ok(output.length < 300, `Aborted output should be shorter, got ${output.length} chars`);
  });
});
