/**
 * Quick report spawner.
 * Separated from ext-system-prompts.ts to avoid pulling in @mariozechner/pi-coding-agent.
 */

import type { SubagentResult, SubagentDetails, SpawnerResult } from "./types.ts";
import { getFinalOutput } from "./utl-message-utils.ts";

export async function spawnQuickReport(
  cwd: string,
  task: string,
  systemPrompt: string,
  tools: string,
  signal: AbortSignal | undefined,
  onUpdate: ((partial: import("@mariozechner/pi-agent-core").AgentToolResult<SubagentDetails>) => void) | undefined,
  makeDetails: (results: SubagentResult[]) => SubagentDetails,
): Promise<SpawnerResult> {
  const { runSubagent } = await import("./ext-subagent-runner.ts");
  const result = await runSubagent(cwd, task, systemPrompt, tools, signal, onUpdate, makeDetails);
  const isError = result.exitCode !== 0 || result.stopReason === "error" || result.stopReason === "aborted";
  if (isError) {
    const errorMsg = result.errorMessage || result.stderr || getFinalOutput(result.messages) || "(no output)";
    return {
      content: [{ type: "text", text: (result.stopReason || "Subagent") + ": " + errorMsg }],
      isError: true,
      details: makeDetails([result]),
    };
  }
  return {
    content: [{ type: "text", text: getFinalOutput(result.messages) }],
    isError: false,
    details: makeDetails([result]),
  };
}