/**
 * Pure formatting utilities for subagent results.
 *
 * These functions have no external dependencies and can be tested in isolation.
 * Used by result-renderer.ts for TUI display.
 */

import * as os from "node:os";
import type { SubagentResult } from "./types.ts";

// ─── Formatting Utilities ───────────────────────────────────────────────────

export function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1000000) return `${Math.round(count / 1000)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
}

export function formatUsage(
  usage: SubagentResult["usage"],
  model?: string,
): string {
  const parts: string[] = [];
  if (usage.turns) parts.push(`${usage.turns} turn${usage.turns > 1 ? "s" : ""}`);
  if (usage.input) parts.push(`↑${formatTokens(usage.input)}`);
  if (usage.output) parts.push(`↓${formatTokens(usage.output)}`);
  if (usage.cacheRead) parts.push(`R${formatTokens(usage.cacheRead)}`);
  if (usage.cacheWrite) parts.push(`W${formatTokens(usage.cacheWrite)}`);
  if (usage.cost) parts.push(`$${usage.cost.toFixed(4)}`);
  if (model) parts.push(model);
  return parts.join(" ");
}

export function formatToolCall(
  toolName: string,
  args: Record<string, unknown>,
  fg: (color: any, text: string) => string,
): string {
  const shorten = (p: string) => {
    const home = os.homedir();
    return p.startsWith(home) ? `~${p.slice(home.length)}` : p;
  };

  switch (toolName) {
    case "bash": {
      const cmd = (args.command as string) || "...";
      const preview = cmd.length > 60 ? `${cmd.slice(0, 60)}...` : cmd;
      return fg("muted", "$ ") + fg("toolOutput", preview);
    }
    case "read": {
      const p = (args.file_path || args.path || "...") as string;
      return fg("muted", "read ") + fg("accent", shorten(p));
    }
    case "write": {
      const p = (args.file_path || args.path || "...") as string;
      return fg("muted", "write ") + fg("accent", shorten(p));
    }
    case "edit": {
      const p = (args.file_path || args.path || "...") as string;
      return fg("muted", "edit ") + fg("accent", shorten(p));
    }
    case "find": {
      const pattern = (args.pattern || "*") as string;
      const p = (args.path || ".") as string;
      return fg("muted", "find ") + fg("accent", pattern) + fg("dim", ` in ${shorten(p)}`);
    }
    case "grep": {
      const pattern = (args.pattern || "") as string;
      const p = (args.path || ".") as string;
      return fg("muted", "grep ") + fg("accent", `/${pattern}/`) + fg("dim", ` in ${shorten(p)}`);
    }
    case "ls": {
      const p = (args.path || ".") as string;
      return fg("muted", "ls ") + fg("accent", shorten(p));
    }
    default: {
      const s = JSON.stringify(args);
      const preview = s.length > 50 ? `${s.slice(0, 50)}...` : s;
      return fg("accent", toolName) + fg("dim", ` ${preview}`);
    }
  }
}
