/**
 * Shared types for subagent-based extension agents.
 *
 * Used by all agent extensions (collaborator, systems-engineer, etc.)
 * to maintain consistent data structures for results, usage, and rendering.
 */

import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { Message } from "@mariozechner/pi-ai";
import type { ExtensionAPI, Component } from "@mariozechner/pi-coding-agent";

// ─── Subagent Result ────────────────────────────────────────────────────────

export interface SubagentResult {
  task: string;
  exitCode: number;
  messages: Message[];
  stderr: string;
  usage: SubagentUsage;
  model?: string;
  stopReason?: string;
  errorMessage?: string;
}

export interface SubagentUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  contextTokens: number;
  turns: number;
}

export interface SubagentDetails {
  results: SubagentResult[];
}

// ─── Display Items ──────────────────────────────────────────────────────────

export interface TextItem {
  type: "text";
  text: string;
}

export interface ToolCallItem {
  type: "toolCall";
  name: string;
  args: Record<string, any>;
}

export type DisplayItem = TextItem | ToolCallItem;

// ─── Dialogue Context ───────────────────────────────────────────────────────

export interface DialogueContext {
  ui: ExtensionAPI["ui"];
  signal: AbortSignal | undefined;
  theme: ExtensionAPI["ui"]["theme"];
}

// ─── Render Options ─────────────────────────────────────────────────────────

export interface RenderOptions {
  icon: string;
  title: string;
  modeLabel: string;
  extraLines?: string[];
}

// ─── Tool Result Helper ─────────────────────────────────────────────────────

export interface SpawnerResult {
  content: Array<{ type: string; text: string }>;
  details?: SubagentDetails;
  isError?: boolean;
}

// ─── Subagent Runner Contract ───────────────────────────────────────────────

/**
 * Signature for the subagent runner function.
 * All agent extensions use this to spawn pi subprocesses.
 */
export type SubagentRunner = (
  cwd: string,
  task: string,
  systemPrompt: string,
  tools: string,
  signal: AbortSignal | undefined,
  onUpdate: ((partial: AgentToolResult<SubagentDetails>) => void) | undefined,
  makeDetails: (results: SubagentResult[]) => SubagentDetails,
) => Promise<SubagentResult>;

/**
 * Signature for the interactive dialogue runner function.
 * All agent extensions use this for multi-turn dialogue sessions.
 */
export type InteractiveDialogueRunner = (
  cwd: string,
  modeLabel: string,
  topic: string,
  buildPrompt: (conversationHistory: string[]) => string,
  ctx: DialogueContext,
) => Promise<void>;

/**
 * Signature for the tool result renderer.
 * All agent extensions use this for TUI display of results.
 */
export type ToolResultRenderer = (
  result: AgentToolResult<SubagentDetails>,
  options: { expanded: boolean },
  theme: ExtensionAPI["ui"]["theme"],
  context: unknown,
  renderOptions: RenderOptions,
) => Component;

// ─── Prompt Builder ─────────────────────────────────────────────────────────

/**
 * Options for constructing system prompts via buildSystemPrompt().
 * Used by all agent extensions.
 */
export interface PromptBuilderOptions {
  role: string;
  modeLabel: string;
  topic: string;
  depthModifier?: string;
  restrictions: string[];
  allowedExtensions: string[];
  workflow: string[];
  domainInfo?: string;
  reportingInstructions?: string;
}
