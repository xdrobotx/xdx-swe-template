/**
 * Pure message processing utilities.
 *
 * These functions operate on Message arrays with no external dependencies.
 * Used by subagent-runner.ts and result-renderer.ts.
 */

import type { Message } from "@mariozechner/pi-ai";
import type { DisplayItem, TextItem, ToolCallItem } from "./types.ts";

// ─── getFinalOutput ──────────────────────────────────────────────────────────

export function getFinalOutput(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "assistant") {
      for (const part of msg.content) {
        if (part.type === "text") return part.text;
      }
    }
  }
  return "";
}

// ─── getDisplayItems ─────────────────────────────────────────────────────────

export function getDisplayItems(messages: Message[]): DisplayItem[] {
  const items: DisplayItem[] = [];
  for (const msg of messages) {
    if (msg.role === "assistant") {
      for (const part of msg.content) {
        if (part.type === "text") items.push({ type: "text", text: part.text });
        else if (part.type === "toolCall") items.push({ type: "toolCall", name: part.name, args: part.arguments });
      }
    }
  }
  return items;
}
