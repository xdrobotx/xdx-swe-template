/**
 * Systems Engineer Extension
 *
 * Provides a **systems engineering subagent** responsible for systems design,
 * architecture, and requirements engineering. Imports shared infrastructure
 * from ../lib/.
 *
 * Three interaction modes:
 *   1. `/sys-design <topic>` / `/sys-requirements <topic>` / `/sys-architecture <topic>`
 *      — Quick reports with live progress
 *   2. Interactive dialogue sessions (same commands with follow-up)
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
  type SubagentDetails,
  type SubagentResult,
  type PromptBuilderOptions,
} from "../lib/index.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDetails(results: SubagentResult[]): SubagentDetails {
  return { results };
}

function buildSystemsEngineerPrompt(
  mode: "design" | "requirements" | "architecture",
  topic: string,
): string {
  const modeLabel = mode === "design" ? "system design"
    : mode === "requirements" ? "requirements engineering"
    : "system architecture";

  const workflow = [
    "Discover existing design artifacts, feasibility studies, and research in the project",
    "Read and analyze any collaborator agent results you find",
    "Build upon existing work if it exists, or start fresh if not",
    "Generate appropriate design artifacts (documents, diagrams, requirements)",
    "Save documents to the design/ directory",
  ];

  const opts: PromptBuilderOptions = {
    role: "SYSTEMS ENGINEER",
    modeLabel,
    topic,
    restrictions: [
      "DO NOT generate, write, or modify any source code files",
      "DO NOT create files with extensions: .ts, .js, .tsx, .jsx, .py, .java, .cpp, .c, .h, .hpp, .cs, .go, .rs, .swift, .kt, .scala, .rb, .php, .html, .css, .scss, .json, .xml, .yaml, .yml, .toml, .ini, .cfg, .conf",
      "DO NOT write configuration files, build scripts, or deployment artifacts",
      "DO NOT run build tools, test suites, or deployment scripts",
    ],
    allowedExtensions: [".md", ".txt", ".adoc", ".mmd", ".puml", ".plantuml"],
    workflow,
    reportingInstructions: "After your analysis, save your findings as design documents:\n" +
      "- System design → design/system-design.md\n" +
      "- Requirements → design/requirements.md\n" +
      "- Architecture → design/architecture.md\n" +
      "Use the write tool to create the file. Include text-based diagrams (Mermaid, PlantUML, ASCII).",
  };

  return buildSystemPrompt(opts);
}

// ─── Extension ───────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Tool: systems_engineer (for main agent to call) ──

  pi.registerTool({
    name: "systems_engineer",
    label: "Systems Engineer",
    description: [
      "Spawn a systems engineering subagent for system design, requirements engineering, and architecture.",
      "The systems engineer CAN generate design artifact files (diagrams, requirements, docs) but CANNOT generate or modify source code.",
      "Works from feasibility studies and research produced by the collaborator agent.",
      "Use mode: 'design' for system design, 'requirements' for requirements engineering, 'architecture' for system architecture.",
    ].join(" "),
    parameters: Type.Object({
      mode: StringEnum(["design", "requirements", "architecture"] as const, {
        description: "Mode: 'design' for system design, 'requirements' for requirements engineering, 'architecture' for system architecture.",
      }),
      topic: Type.String({ description: "The system, feature, or component to design, specify requirements for, or architect." }),
      requirementsFormat: StringEnum(["formal", "lightweight"] as const, {
        description: "Requirements format. 'formal' = IEEE 830-style (ID, statement, rationale, priority, verification). 'lightweight' = user stories with acceptance criteria. Only used when mode is 'requirements'.",
        default: "formal",
      }),
    }),

    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const prompt = buildSystemsEngineerPrompt(params.mode, params.topic);
      return spawnQuickReport(
        ctx.cwd,
        params.topic,
        prompt,
        "read,write,edit,bash,find,grep,ls",
        signal,
        onUpdate,
        makeDetails,
      );
    },

    renderCall(args, theme, _context) {
      const modeLabel = args.mode === "design" ? "system design"
        : args.mode === "requirements" ? "requirements"
        : "architecture";
      const icon = args.mode === "design" ? "🔧"
        : args.mode === "requirements" ? "📋"
        : "🏗️";
      let text = theme.fg("toolTitle", theme.bold("systems_engineer "))
        + theme.fg("accent", modeLabel)
        + theme.fg("muted", ` ${icon}`);
      const preview = args.topic.length > 60 ? `${args.topic.slice(0, 60)}...` : args.topic;
      text += `\n  ${theme.fg("dim", preview)}`;
      return new Text(text, 0, 0);
    },

    renderResult(result, { expanded }, theme, _context) {
      return renderToolResult(result, { expanded }, theme, _context, {
        icon: "⚙️",
        title: "Systems Engineer",
        modeLabel: "system design",
      });
    },
  });

  // ── Command: /sys-design (interactive dialogue) ──

  pi.registerCommand("sys-design", {
    description: "System design. Generates component models, interfaces, data flows, and behavior diagrams.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify(
          "Usage: /system-design <topic>\n\n" +
          "Generates system design artifacts:\n" +
          "  • Component breakdown and interfaces\n" +
          "  • Data flow and behavior models\n" +
          "  • Text-based diagrams (Mermaid, PlantUML, ASCII)\n" +
          "  • Design decisions with rationale\n" +
          "Type 'quit' in the interactive session to end.",
          "warning",
        );
        return;
      }

      ctx.ui.notify(`Starting interactive system design on: "${args}"`, "info");

      try {
        await runInteractiveDialogue(
          ctx.cwd,
          "system design",
          args,
          (history) => {
            const historyStr = history.length > 0
              ? `\n\n--- Previous conversation ---\n${history.join("\n\n")}`
              : "";
            return buildSystemsEngineerPrompt("design", args) + historyStr;
          },
          { ui: ctx.ui, signal: ctx.signal, theme: ctx.ui.theme },
        );
      } catch (err) {
        ctx.ui.notify(`System design error: ${(err as Error).message}`, "error");
      }
    },
  });

  // ── Command: /sys-requirements (interactive dialogue) ──

  pi.registerCommand("sys-requirements", {
    description: "Requirements engineering. Generates formal (IEEE 830) or lightweight (user story) requirements.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify(
          "Usage: /system-requirements <topic>\n\n" +
          "Generates requirements artifacts:\n" +
          "  • Formal IEEE 830-style requirements (ID, statement, rationale, priority, verification)\n" +
          "  • Lightweight user stories with acceptance criteria\n" +
          "  • Requirements traceability\n" +
          "  • Requirements prioritization\n" +
          "Type 'quit' in the interactive session to end.",
          "warning",
        );
        return;
      }

      ctx.ui.notify(`Starting interactive requirements engineering on: "${args}"`, "info");

      try {
        await runInteractiveDialogue(
          ctx.cwd,
          "requirements engineering",
          args,
          (history) => {
            const historyStr = history.length > 0
              ? `\n\n--- Previous conversation ---\n${history.join("\n\n")}`
              : "";
            return buildSystemsEngineerPrompt("requirements", args) + historyStr;
          },
          { ui: ctx.ui, signal: ctx.signal, theme: ctx.ui.theme },
        );
      } catch (err) {
        ctx.ui.notify(`Requirements engineering error: ${(err as Error).message}`, "error");
      }
    },
  });

  // ── Command: /sys-architecture (interactive dialogue) ──

  pi.registerCommand("sys-architecture", {
    description: "System architecture. Generates structural decomposition, technology selection, and deployment views.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify(
          "Usage: /system-architecture <topic>\n\n" +
          "Generates architecture artifacts:\n" +
          "  • Structural decomposition and component relationships\n" +
          "  • Technology and platform selection rationale\n" +
          "  • Deployment topology and infrastructure\n" +
          "  • Cross-cutting concerns (security, reliability, performance)\n" +
          "  • Architectural patterns and trade-offs\n" +
          "Type 'quit' in the interactive session to end.",
          "warning",
        );
        return;
      }

      ctx.ui.notify(`Starting interactive system architecture on: "${args}"`, "info");

      try {
        await runInteractiveDialogue(
          ctx.cwd,
          "system architecture",
          args,
          (history) => {
            const historyStr = history.length > 0
              ? `\n\n--- Previous conversation ---\n${history.join("\n\n")}`
              : "";
            return buildSystemsEngineerPrompt("architecture", args) + historyStr;
          },
          { ui: ctx.ui, signal: ctx.signal, theme: ctx.ui.theme },
        );
      } catch (err) {
        ctx.ui.notify(`System architecture error: ${(err as Error).message}`, "error");
      }
    },
  });
}
