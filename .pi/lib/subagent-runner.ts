/**
 * Core subagent spawning mechanism.
 *
 * Spawns pi as a subprocess with an appended system prompt,
 * parses JSONL output, handles abort, and emits progress updates.
 *
 * This is the shared infrastructure used by ALL agent extensions.
 */

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { Message } from "@mariozechner/pi-ai";
import {
  type SubagentResult,
  type SubagentUsage,
  type SubagentDetails,
  type SubagentRunner,
} from "./types.ts";
import { withFileMutationQueue } from "@mariozechner/pi-coding-agent";

// ─── Subagent Runner ────────────────────────────────────────────────────────

export const runSubagent: SubagentRunner = async (
  cwd: string,
  task: string,
  systemPrompt: string,
  tools: string,
  signal: AbortSignal | undefined,
  onUpdate: ((partial: AgentToolResult<SubagentDetails>) => void) | undefined,
  makeDetails: (results: SubagentResult[]) => SubagentDetails,
): Promise<SubagentResult> => {
  const result: SubagentResult = {
    task,
    exitCode: 0,
    messages: [],
    stderr: "",
    usage: createEmptyUsage(),
  };

  const emitUpdate = () => {
    if (onUpdate) {
      onUpdate({
        content: [{ type: "text", text: getFinalOutput(result.messages) || "(working...)" }],
        details: makeDetails([result]),
      });
    }
  };

  // Write system prompt to temp file
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "pi-subagent-"));
  const promptFile = path.join(tmpDir, "subagent-system.md");
  await withFileMutationQueue(promptFile, async () => {
    await fs.promises.writeFile(promptFile, systemPrompt, { encoding: "utf-8", mode: 0o600 });
  });

  try {
    // Build subprocess arguments
    const args: string[] = [
      "--mode", "json",
      "-p",
      "--no-session",
      "--no-extensions",
      "--no-skills",
      "--no-prompt-templates",
      "--no-themes",
      "--no-context-files",
      "--append-system-prompt", promptFile,
      "--tools", tools,
      task,
    ];

    // Determine command and arguments
    const currentScript = process.argv[1];
    const isBunVirtual = currentScript?.startsWith("/$bunfs/root/");
    let command: string;
    let spawnArgs: string[];

    if (currentScript && !isBunVirtual && fs.existsSync(currentScript)) {
      command = process.execPath;
      spawnArgs = [currentScript, ...args];
    } else {
      const execName = path.basename(process.execPath).toLowerCase();
      const isGeneric = /^(node|bun)(\.exe)?$/.test(execName);
      if (!isGeneric) {
        command = process.execPath;
        spawnArgs = args;
      } else {
        command = "pi";
        spawnArgs = args;
      }
    }

    let wasAborted = false;

    const exitCode = await new Promise<number>((resolve) => {
      const proc = spawn(command, spawnArgs, {
        cwd,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let buffer = "";

      const processLine = (line: string) => {
        if (!line.trim()) return;
        let event: any;
        try { event = JSON.parse(line); } catch { return; }

        if (event.type === "message_end" && event.message) {
          const msg = event.message as Message;
          result.messages.push(msg);
          if (msg.role === "assistant") {
            result.usage.turns++;
            const u = msg.usage;
            if (u) {
              result.usage.input += u.input || 0;
              result.usage.output += u.output || 0;
              result.usage.cacheRead += u.cacheRead || 0;
              result.usage.cacheWrite += u.cacheWrite || 0;
              result.usage.cost += u.cost?.total || 0;
              result.usage.contextTokens = u.totalTokens || 0;
            }
            if (!result.model && msg.model) result.model = msg.model;
            if (msg.stopReason) result.stopReason = msg.stopReason;
            if (msg.errorMessage) result.errorMessage = msg.errorMessage;
          }
          emitUpdate();
        }
        if (event.type === "tool_result_end" && event.message) {
          result.messages.push(event.message as Message);
          emitUpdate();
        }
      };

      proc.stdout.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) processLine(line);
      });

      proc.stderr.on("data", (data) => {
        result.stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (buffer.trim()) processLine(buffer);
        resolve(code ?? 0);
      });

      proc.on("error", () => resolve(1));

      if (signal) {
        const kill = () => {
          wasAborted = true;
          proc.kill("SIGTERM");
          setTimeout(() => { if (!proc.killed) proc.kill("SIGKILL"); }, 5000);
        };
        if (signal.aborted) kill();
        else signal.addEventListener("abort", kill, { once: true });
      }
    });

    result.exitCode = exitCode;
    if (wasAborted) throw new Error("Subagent was aborted");
    return result;
  } finally {
    try { fs.unlinkSync(promptFile); } catch { /* ignore */ }
    try { fs.rmdirSync(tmpDir); } catch { /* ignore */ }
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createEmptyUsage(): SubagentUsage {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    cost: 0,
    contextTokens: 0,
    turns: 0,
  };
}

// Re-export pure message utilities for testability
export { getFinalOutput, getDisplayItems } from "./message-utils.ts";
