/**
 * Unit tests for ext-subagent-runner.ts
 *
 * Tests: getFinalOutput(), getDisplayItems()
 * Uses Node.js built-in `node:test` + `node:assert`.
 *
 * Run: npx tsx .pi/tests/unit/subagent-runner.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import type { Message } from "@mariozechner/pi-ai";
import { getFinalOutput, getDisplayItems } from "../../lib/utl-message-utils.ts";

// ─── Helper: create a text message ──────────────────────────────────────────

function textMsg(role: string, text: string): Message {
  return { role, content: [{ type: "text" as const, text }] };
}

function toolCallMsg(toolId: string, name: string, args: Record<string, unknown>): Message {
  return {
    role: "assistant",
    content: [{ type: "toolCall" as const, toolCallId: toolId, name, arguments: args }],
  };
}

// ─── getFinalOutput ──────────────────────────────────────────────────────────

describe("getFinalOutput", () => {
  it("returns empty string for empty messages", () => {
    assert.strictEqual(getFinalOutput([]), "");
  });

  it("returns last assistant text content", () => {
    const messages: Message[] = [
      textMsg("assistant", "first response"),
      textMsg("assistant", "second response"),
    ];
    assert.strictEqual(getFinalOutput(messages), "second response");
  });

  it("skips non-assistant messages", () => {
    const messages: Message[] = [
      textMsg("user", "hello"),
      textMsg("assistant", "reply"),
      textMsg("user", "follow-up"),
    ];
    assert.strictEqual(getFinalOutput(messages), "reply");
  });

  it("returns first text from last assistant message with multiple parts", () => {
    const messages: Message[] = [
      {
        role: "assistant",
        content: [
          { type: "text" as const, text: "first part" },
          { type: "text" as const, text: "second part" },
        ],
      },
    ];
    // Returns the first text part of the last assistant message
    assert.strictEqual(getFinalOutput(messages), "first part");
  });

  it("returns empty string when assistant has only tool calls", () => {
    const messages: Message[] = [
      toolCallMsg("call_1", "bash", { command: "ls" }),
    ];
    assert.strictEqual(getFinalOutput(messages), "");
  });

  it("handles mixed text and tool calls in assistant message", () => {
    const messages: Message[] = [
      {
        role: "assistant",
        content: [
          { type: "text" as const, text: "thinking..." },
          { type: "toolCall" as const, toolCallId: "call_1", name: "bash", arguments: { command: "ls" } },
          { type: "text" as const, text: "done" },
        ],
      },
    ];
    assert.strictEqual(getFinalOutput(messages), "thinking...");
  });

  it("returns text from second assistant message even after tool results", () => {
    const messages: Message[] = [
      textMsg("assistant", "initial"),
      textMsg("toolResult", "file content"),
      textMsg("assistant", "final"),
    ];
    assert.strictEqual(getFinalOutput(messages), "final");
  });
});

// ─── getDisplayItems ─────────────────────────────────────────────────────────

describe("getDisplayItems", () => {
  it("returns empty array for empty messages", () => {
    assert.deepStrictEqual(getDisplayItems([]), []);
  });

  it("extracts text content from assistant messages", () => {
    const messages: Message[] = [
      textMsg("assistant", "Hello world"),
    ];
    const items = getDisplayItems(messages);
    assert.strictEqual(items.length, 1);
    assert.deepStrictEqual(items[0], { type: "text", text: "Hello world" });
  });

  it("extracts tool calls from assistant messages", () => {
    const messages: Message[] = [
      toolCallMsg("call_1", "bash", { command: "ls -la" }),
    ];
    const items = getDisplayItems(messages);
    assert.strictEqual(items.length, 1);
    assert.deepStrictEqual(items[0], {
      type: "toolCall",
      name: "bash",
      args: { command: "ls -la" },
    });
  });

  it("skips non-assistant messages", () => {
    const messages: Message[] = [
      textMsg("user", "hello"),
      textMsg("toolResult", "result"),
    ];
    assert.strictEqual(getDisplayItems(messages).length, 0);
  });

  it("preserves order of text and tool calls", () => {
    const messages: Message[] = [
      {
        role: "assistant",
        content: [
          { type: "text" as const, text: "Let me check" },
          { type: "toolCall" as const, toolCallId: "call_1", name: "bash", arguments: { command: "ls" } },
          { type: "text" as const, text: "Found files" },
        ],
      },
    ];
    const items = getDisplayItems(messages);
    assert.strictEqual(items.length, 3);
    assert.strictEqual(items[0].type, "text");
    assert.strictEqual(items[1].type, "toolCall");
    assert.strictEqual(items[2].type, "text");
  });

  it("collects items from multiple assistant messages", () => {
    const messages: Message[] = [
      textMsg("assistant", "first"),
      toolCallMsg("call_1", "read", { file_path: "test.md" }),
      textMsg("assistant", "second"),
    ];
    const items = getDisplayItems(messages);
    assert.strictEqual(items.length, 3);
    assert.strictEqual((items[0] as any).text, "first");
    assert.strictEqual((items[1] as any).name, "read");
    assert.strictEqual((items[2] as any).text, "second");
  });
});
