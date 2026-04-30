/**
 * Collaborator Agent Extension
 *
 * Provides an **interactive collaborator** for idea generation, feasibility
 * studies, and research. Imports shared infrastructure from ../lib/.
 *
 * Two interaction modes:
 *   1. `/collaborate <mode> <topic> [depth]` — Quick report with live progress
 *   2. `/brainstorm <topic>` / `/feasibility <topic>` / `/research <topic>`
 *      — Interactive dialogue session
 */

import { StringEnum } from "@mariozechner/pi-ai";
import { type ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "typebox";

import {
  runSubagent,
  runInteractiveDialogue,
  renderToolResult,
  buildSystemPrompt,
  spawnQuickReport,
  getFinalOutput,
  type SubagentDetails,
  type SubagentResult,
  type PromptBuilderOptions,
} from "../lib/index.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDetails(results: SubagentResult[]): SubagentDetails {
  return { results };
}

function buildCollaboratorPrompt(
  mode: "study" | "research" | "brainstorm",
  topic: string,
  depth: "quick" | "standard" | "deep",
): string {
  const depthModifier = depth === "deep"
    ? "Perform an exhaustive analysis. Leave no stone unturned."
    : depth === "quick"
      ? "Provide a concise analysis. Focus on key points only."
      : "";

  const modeLabel = mode === "study" ? "feasibility study"
    : mode === "research" ? "internet research"
    : "idea brainstorming";

  const task = mode === "research"
    ? `Research: ${topic}`
    : `${mode === "study" ? "Conduct a feasibility study" : "Brainstorm and explore ideas"} for: ${topic}`;

  const workflow = mode === "research"
    ? [
        "Read relevant codebase files for context",
        "Use curl to fetch documentation and articles from the internet",
        "Use find and grep to explore the project",
        "Compare options objectively",
        "Cite sources with URLs",
      ]
    : [
        "Explore the codebase to understand context",
        "Share insights in digestible chunks",
        "Ask clarifying questions",
        "Iterate based on responses",
      ];

  const opts: PromptBuilderOptions = {
    role: "COLLABORATOR AGENT",
    modeLabel,
    topic: task,
    depthModifier,
    restrictions: [
      "DO NOT generate, write, or modify any source code files",
      "DO NOT create files with extensions: .ts, .js, .tsx, .jsx, .py, .java, .cpp, .c, .h, .hpp, .cs, .go, .rs, .swift, .kt, .scala, .rb, .php, .html, .css, .scss, .json, .xml, .yaml, .yml, .toml, .ini, .cfg, .conf",
      "DO NOT write configuration files, build scripts, or deployment artifacts",
      "DO NOT run build tools, test suites, or deployment scripts",
      "DO NOT install packages or modify package.json",
    ],
    allowedExtensions: [".md", ".txt", ".adoc"],
    workflow,
    reportingInstructions: "After your analysis, save your findings as a document file:\n" +
      "- Feasibility study → design/feasibility-study.md\n" +
      "- Research report → design/research-report.md\n" +
      "- Brainstorm notes → design/brainstorm-notes.md\n" +
      "Use the write tool to create the file. Structure it with clear sections.",
  };

  return buildSystemPrompt(opts);
}

// ─── Extension ───────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Tool: collaborate (for main agent to call) ──

  pi.registerTool({
    name: "collaborate",
    label: "Collaborate",
    description: [
      "Spawn a collaborator subagent for idea generation, feasibility studies, and research.",
      "The collaborator CAN write design/research documents (.md, .txt) but CANNOT write source code.",
      "Returns a structured feasibility report.",
      "Use mode: 'study' for feasibility analysis, 'research' for internet research, 'brainstorm' for idea generation.",
    ].join(" "),
    parameters: Type.Object({
      mode: StringEnum(["study", "research", "brainstorm"] as const, {
        description: "Mode: 'study' for feasibility analysis, 'research' for internet research, 'brainstorm' for idea generation.",
      }),
      topic: Type.String({ description: "The topic, idea, or question to analyze/research." }),
      depth: StringEnum(["quick", "standard", "deep"] as const, {
        description: "Research depth. 'quick' = brief overview, 'standard' = full report, 'deep' = exhaustive analysis.",
        default: "standard",
      }),
    }),

    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const prompt = buildCollaboratorPrompt(params.mode, params.topic, params.depth);
      const task = params.mode === "research"
        ? prompt
        : `${params.mode === "study" ? "Conduct a feasibility study" : "Brainstorm and explore ideas"} for: ${params.topic}`;
      return spawnQuickReport(
        ctx.cwd,
        task,
        prompt,
        "read,write,edit,bash,find,grep,ls",
        signal,
        onUpdate,
        makeDetails,
      );
    },

    renderCall(args, theme, _context) {
      const modeLabel = args.mode === "study" ? "feasibility study"
        : args.mode === "research" ? "research"
        : "brainstorm";
      const depthLabel = args.depth === "quick" ? "⚡" : args.depth === "deep" ? "🔬" : "📋";
      let text = theme.fg("toolTitle", theme.bold("collaborate "))
        + theme.fg("accent", modeLabel)
        + theme.fg("muted", ` ${depthLabel}`);
      const preview = args.topic.length > 60 ? `${args.topic.slice(0, 60)}...` : args.topic;
      text += `\n  ${theme.fg("dim", preview)}`;
      return new Text(text, 0, 0);
    },

    renderResult(result, { expanded }, theme, _context) {
      return renderToolResult(result, { expanded }, theme, _context, {
        icon: "🤝",
        title: "Collaborator",
        modeLabel: "feasibility study",
      });
    },
  });

  // ── Command: /collaborate (quick report with live progress) ──

  pi.registerCommand("collaborate", {
    description: "Quick collaborator report with live progress. Use /brainstorm for interactive dialogue.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify(
          "Usage: /collaborate <mode> <topic> [depth]\n" +
          "Modes: study, research, brainstorm\n" +
          "Depth: quick, standard, deep\n" +
          "Tip: Use /brainstorm for interactive dialogue",
          "warning",
        );
        return;
      }

      const parts = args.trim().split(/\s+/);
      const mode = parts[0] as "study" | "research" | "brainstorm";
      const lastWord = parts[parts.length - 1].toLowerCase() as "quick" | "standard" | "deep";
      const isDepth = ["quick", "standard", "deep"].includes(lastWord);
      const depth = isDepth ? lastWord : "standard";
      const topic = parts.slice(1, isDepth ? parts.length - 1 : parts.length).join(" ");

      if (!["study", "research", "brainstorm"].includes(mode)) {
        ctx.ui.notify(`Unknown mode: "${mode}". Use: study, research, or brainstorm`, "error");
        return;
      }

      if (!topic) {
        ctx.ui.notify("Please provide a topic to analyze.", "warning");
        return;
      }

      ctx.ui.setWorkingMessage("Collaborator is working...");
      ctx.ui.setWorkingVisible(true);

      const prompt = buildCollaboratorPrompt(mode, topic, depth);
      const task = mode === "research"
        ? prompt
        : `${mode === "study" ? "Conduct a feasibility study" : "Brainstorm and explore ideas"} for: ${topic}`;

      let lastUpdate = "";
      const result = await spawnQuickReport(
        ctx.cwd,
        task,
        prompt,
        "read,write,edit,bash,find,grep,ls",
        ctx.signal,
        (partial) => {
          const text = partial.content[0]?.type === "text" ? partial.content[0].text : "";
          if (text && text !== lastUpdate && text !== "(working...)") {
            lastUpdate = text;
            const preview = text.length > 120 ? text.slice(0, 120) + "..." : text;
            ctx.ui.setWorkingMessage(`Collaborator: ${preview}`);
          }
        },
        makeDetails,
      );

      ctx.ui.setWorkingVisible(false);

      if (result.isError) {
        ctx.ui.notify(result.content[0].text, "error");
        return;
      }

      const report = result.content[0].text;
      const preview = report.length > 3000 ? report.slice(0, 3000) + "\n\n... (truncated, full report in tool details)" : report;
      ctx.ui.notify(`### Collaborator Report (${mode})\n\n${preview}`, "info");
    },
  });

  // ── Command: /brainstorm (interactive dialogue) ──

  pi.registerCommand("brainstorm", {
    description: "Interactive brainstorming session with the collaborator. Exchanges insights back and forth.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify(
          "Usage: /brainstorm <topic>\n\n" +
          "Starts an interactive dialogue where the collaborator:\n" +
          "  1. Explores the codebase for context\n" +
          "  2. Shares initial insights\n" +
          "  3. Asks you questions\n" +
          "  4. Iterates based on your responses\n" +
          "Type 'quit' to end the session.",
          "warning",
        );
        return;
      }

      ctx.ui.notify(`Starting interactive brainstorming on: "${args}"`, "info");

      try {
        await runInteractiveDialogue(
          ctx.cwd,
          "brainstorming",
          args,
          (history) => {
            const historyStr = history.length > 0
              ? `\n\n--- Previous conversation ---\n${history.join("\n\n")}`
              : "";
            return buildCollaboratorPrompt("brainstorm", args, "standard") + historyStr;
          },
          { ui: ctx.ui, signal: ctx.signal, theme: ctx.ui.theme },
        );
      } catch (err) {
        ctx.ui.notify(`Brainstorming error: ${(err as Error).message}`, "error");
      }
    },
  });

  // ── Command: /feasibility (interactive feasibility study) ──

  pi.registerCommand("feasibility", {
    description: "Interactive feasibility study. Discuss trade-offs, risks, and recommendations.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify(
          "Usage: /feasibility <topic>\n\n" +
          "Starts an interactive dialogue where the collaborator:\n" +
          "  1. Explores the codebase for context\n" +
          "  2. Analyzes technical feasibility\n" +
          "  3. Discusses risks and trade-offs\n" +
          "  4. Provides recommendations\n" +
          "Type 'quit' to end the session.",
          "warning",
        );
        return;
      }

      ctx.ui.notify(`Starting interactive feasibility study on: "${args}"`, "info");

      try {
        await runInteractiveDialogue(
          ctx.cwd,
          "feasibility study",
          args,
          (history) => {
            const historyStr = history.length > 0
              ? `\n\n--- Previous conversation ---\n${history.join("\n\n")}`
              : "";
            return buildCollaboratorPrompt("study", args, "standard") + historyStr;
          },
          { ui: ctx.ui, signal: ctx.signal, theme: ctx.ui.theme },
        );
      } catch (err) {
        ctx.ui.notify(`Feasibility study error: ${(err as Error).message}`, "error");
      }
    },
  });

  // ── Command: /research (interactive research session) ──

  pi.registerCommand("research", {
    description: "Interactive research session. The collaborator gathers information and discusses findings.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify(
          "Usage: /research <topic>\n\n" +
          "Starts an interactive dialogue where the collaborator:\n" +
          "  1. Searches documentation and the internet\n" +
          "  2. Analyzes existing patterns in the codebase\n" +
          "  3. Shares findings and compares options\n" +
          "  4. Answers your follow-up questions\n" +
          "Type 'quit' to end the session.",
          "warning",
        );
        return;
      }

      ctx.ui.notify(`Starting interactive research on: "${args}"`, "info");

      try {
        await runInteractiveDialogue(
          ctx.cwd,
          "research",
          args,
          (history) => {
            const historyStr = history.length > 0
              ? `\n\n--- Previous conversation ---\n${history.join("\n\n")}`
              : "";
            return buildCollaboratorPrompt("research", args, "standard") + historyStr;
          },
          { ui: ctx.ui, signal: ctx.signal, theme: ctx.ui.theme },
        );
      } catch (err) {
        ctx.ui.notify(`Research session error: ${(err as Error).message}`, "error");
      }
    },
  });
}
