/**
 * Pure types for subagent-based extension agents.
 *
 * These types have no external dependencies and can be imported in isolation.
 * For types that need pi-coding-agent/pi-agent-core, see types.ts.
 */

// ─── Subagent Result ────────────────────────────────────────────────────────

export interface SubagentResult {
  task: string;
  exitCode: number;
  messages: Array<{
    role: string;
    content: Array<{ type: string; text?: string; toolCallId?: string; name?: string; arguments?: Record<string, unknown> }>;
    usage?: {
      input?: number;
      output?: number;
      cacheRead?: number;
      cacheWrite?: number;
      cost?: { total?: number };
      totalTokens?: number;
    };
    model?: string;
    stopReason?: string;
    errorMessage?: string;
  }>;
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

export interface SpawnerResult {
  content: Array<{ type: string; text: string }>;
  details?: SubagentDetails;
  isError?: boolean;
}

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
