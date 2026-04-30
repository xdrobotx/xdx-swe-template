/**
 * Result formatting and TUI rendering utilities.
 *
 * Provides shared formatting functions and the result renderer
 * used by ALL agent extensions for consistent TUI display.
 *
 * Pure formatting utilities are in result-formatters.ts for testability.
 */

import {
  Container,
  Markdown,
  Spacer,
  Text,
} from "@mariozechner/pi-tui";
import {
  type DisplayItem,
  type TextItem,
  type ToolCallItem,
  type RenderOptions,
  type SubagentResult,
  type SubagentDetails,
  type ToolResultRenderer,
} from "./types.ts";
import { getFinalOutput, getDisplayItems } from "./subagent-runner.ts";
import { getMarkdownTheme, type ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
  formatTokens,
  formatUsage,
  formatToolCall,
} from "./result-formatters.ts";

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_PREVIEW = 8;

// ─── Result Renderer ────────────────────────────────────────────────────────

export const renderToolResult: ToolResultRenderer = (
  result,
  { expanded },
  theme,
  _context,
  options,
) => {
  const details = result.details as SubagentDetails | undefined;
  if (!details || details.results.length === 0) {
    const text = result.content[0];
    return new Text(text?.type === "text" ? text.text : "(no output)", 0, 0);
  }

  const r = details.results[0];
  const isError = r.exitCode !== 0 || r.stopReason === "error" || r.stopReason === "aborted";
  const icon = isError ? theme.fg("error", "✗") : theme.fg("success", "✓");
  const displayItems = getDisplayItems(r.messages);
  const finalOutput = getFinalOutput(r.messages);

  if (expanded) {
    return renderExpanded(r, icon, displayItems, finalOutput, options, theme);
  }

  return renderCollapsed(r, icon, displayItems, finalOutput, options, theme);
};

// ─── Expanded View ──────────────────────────────────────────────────────────

function renderExpanded(
  r: SubagentResult,
  icon: ReturnType<ExtensionAPI["ui"]["theme"]["fg"]>,
  displayItems: DisplayItem[],
  finalOutput: string,
  options: RenderOptions,
  theme: ExtensionAPI["ui"]["theme"],
): Container {
  const container = new Container();
  container.addChild(new Text(icon + " " + theme.fg("toolTitle", theme.bold(options.title)), 0, 0));

  if (isError(r) && r.errorMessage) {
    container.addChild(new Text(theme.fg("error", `Error: ${r.errorMessage}`), 0, 0));
  }

  container.addChild(new Spacer(1));
  container.addChild(new Text(theme.fg("muted", "─── Task ───"), 0, 0));
  container.addChild(new Text(theme.fg("dim", r.task), 0, 0));
  container.addChild(new Spacer(1));
  container.addChild(new Text(theme.fg("muted", "─── Output ───"), 0, 0));

  if (displayItems.length === 0 && !finalOutput) {
    container.addChild(new Text(theme.fg("muted", "(no output)"), 0, 0));
  } else {
    for (const item of displayItems) {
      if (item.type === "toolCall") {
        container.addChild(new Text(
          theme.fg("muted", "→ ") + formatToolCall(item.name, item.args, theme.fg.bind(theme)),
          0, 0,
        ));
      }
    }
    if (finalOutput) {
      container.addChild(new Spacer(1));
      container.addChild(new Markdown(finalOutput.trim(), 0, 0, getMarkdownTheme()));
    }
  }

  // Extra lines (if provided)
  if (options.extraLines) {
    container.addChild(new Spacer(1));
    for (const line of options.extraLines) {
      container.addChild(new Text(theme.fg("muted", line), 0, 0));
    }
  }

  const usageStr = formatUsage(r.usage, r.model);
  if (usageStr) {
    container.addChild(new Spacer(1));
    container.addChild(new Text(theme.fg("dim", usageStr), 0, 0));
  }

  return container;
}

// ─── Collapsed View ─────────────────────────────────────────────────────────

function renderCollapsed(
  r: SubagentResult,
  icon: ReturnType<ExtensionAPI["ui"]["theme"]["fg"]>,
  displayItems: DisplayItem[],
  finalOutput: string,
  options: RenderOptions,
  theme: ExtensionAPI["ui"]["theme"],
): Text {
  let text = icon + " " + theme.fg("toolTitle", theme.bold(options.title));

  if (isError(r)) {
    if (r.stopReason) text += ` ${theme.fg("error", `[${r.stopReason}]`)}`;
    if (r.errorMessage) text += `\n${theme.fg("error", `Error: ${r.errorMessage}`)}`;
  } else if (displayItems.length === 0) {
    text += `\n${theme.fg("muted", "(no output)")}`;
  } else {
    text += `\n${renderItems(displayItems, MAX_PREVIEW, theme)}`;
  }

  const usageStr = formatUsage(r.usage, r.model);
  if (usageStr) text += `\n${theme.fg("dim", usageStr)}`;
  text += `\n${theme.fg("muted", "(Ctrl+O to expand)")}`;

  return new Text(text, 0, 0);
}

// ─── Helper: Render Items ───────────────────────────────────────────────────

function renderItems(
  items: DisplayItem[],
  limit: number,
  theme: ExtensionAPI["ui"]["theme"],
): string {
  const toShow = items.slice(-limit);
  let s = "";
  for (const item of toShow) {
    if (item.type === "text") {
      const preview = item.text.split("\n").slice(0, 3).join("\n");
      s += `${theme.fg("toolOutput", preview)}\n`;
    } else {
      s += `${theme.fg("muted", "→ ")}${formatToolCall(item.name, item.args, theme.fg.bind(theme))}\n`;
    }
  }
  return s.trimEnd();
}

// ─── Helper: Check Error ────────────────────────────────────────────────────

function isError(r: SubagentResult): boolean {
  return r.exitCode !== 0 || r.stopReason === "error" || r.stopReason === "aborted";
}
