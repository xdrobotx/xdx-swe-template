/**
 * Software Engineer Extension
 *
 * Provides a **software engineering subagent** responsible for:
 * - Reading, writing, analyzing, and testing source code in any language
 * - Generating Software Detailed Design (SDD) from SRS/system design
 * - Implementing approved designs into modular, tested source code
 * - Following software engineering best practices
 * - Adapting to different workflows via skills
 *
 * Two interaction modes:
 *   1. `/swe-<command> <topic>` — Quick report with live progress
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
  getFinalOutput,
  type SubagentDetails,
  type SubagentResult,
  type PromptBuilderOptions,
} from "../lib/index.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDetails(results: SubagentResult[]): SubagentDetails {
  return { results };
}

function buildSoftwareEngineerPrompt(
  mode: "analyze" | "design" | "implement" | "review" | "refactor" | "build",
  topic: string,
  skill?: string,
): string {
  const modeLabel = mode === "analyze" ? "codebase analysis"
    : mode === "design" ? "software detailed design (SDD)"
    : mode === "implement" ? "software implementation"
    : mode === "review" ? "code review"
    : mode === "refactor" ? "code refactoring"
    : "build/config proposal";

  const restrictions = [
    "DO NOT generate, write, or modify any design-only documents (that's the Systems Engineer's role)",
    "DO NOT write configuration files, build scripts, or deployment artifacts without user approval",
    "DO NOT run build tools, test suites, or deployment scripts without user approval",
  ];

  const allowedExtensions = [
    ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".cpp", ".hpp", ".c", ".h",
    ".rs", ".go", ".cs", ".rb", ".php", ".swift", ".kt", ".scala", ".html",
    ".css", ".scss", ".json", ".xml", ".yaml", ".yml", ".toml", ".md",
    ".txt", ".adoc", ".mmd", ".puml", ".plantuml",
  ];

  const workflow = mode === "analyze"
    ? [
        "Discover — Read existing codebase, requirements, and design documents",
        "Analyze — Understand current state, architecture, and dependencies",
        "Report — Summarize findings with actionable insights",
      ]
    : mode === "design"
      ? [
          "Discover — Read SRS and system design documents from the Systems Engineer",
          "Analyze — Understand requirements and system architecture",
          "Decompose — Break system design into concrete modules and components",
          "Specify — Define interfaces, data structures, and algorithms",
          "Trace — Generate requirements traceability matrix (SRS → SDD)",
          "Document — Save SDD to design/sdd-<topic>.md",
        ]
      : mode === "implement"
        ? [
            "Discover — Read SDD and existing codebase",
            "Plan — Create implementation plan from SDD",
            "Test — Generate test specs (component, integration, system)",
            "Implement — Write source code following the SDD",
            "Verify — Run development tools (linters, formatters, type checkers)",
            "Document — Generate documentation as needed",
            "Trace — Update traceability matrix with source and test file mappings",
          ]
        : mode === "review"
          ? [
              "Discover — Read code to review",
              "Self-Review — Analyze code against best practices",
              "Report — Present findings with specific suggestions",
              "Iterate — Accept user decisions on each finding",
            ]
          : mode === "refactor"
            ? [
                "Discover — Read code to refactor",
                "Analyze Impact — Use GitNexus for impact analysis if available",
                "Propose — Format refactoring proposal with risks",
                "Execute — Apply approved changes",
                "Verify — Ensure tests still pass after refactoring",
              ]
            : [
                "Analyze — Detect what build/config changes are needed",
                "Propose — Format changes with rationale",
                "Consult — Present proposal to user for approval",
                "Apply — Apply only user-approved changes",
              ];

  const opts: PromptBuilderOptions = {
    role: "SOFTWARE ENGINEER",
    modeLabel,
    topic,
    restrictions,
    allowedExtensions,
    workflow,
    reportingInstructions: mode === "design"
      ? "Save your SDD to design/sdd-<topic>.md. Include traceability matrix."
      : mode === "implement"
        ? "Save source code to src/ and tests to tests/ (component/, integration/, system/ subfolders)."
        : "Save design artifacts to design/ directory.",
  };

  let prompt = buildSystemPrompt(opts);

  // Append skill augmentation if provided
  if (skill) {
    const { getSkillPromptAugmentation } = require("../lib/swe-skill-manager.js");
    const skillAug = getSkillPromptAugmentation(skill, topic);
    if (skillAug) {
      prompt += skillAug;
    }
  }

  return prompt;
}

// ─── Extension ───────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Tool: software_engineer (for main agent to call) ──

  pi.registerTool({
    name: "software_engineer",
    label: "Software Engineer",
    description: [
      "Spawn a software engineering subagent for code analysis, detailed design, implementation, review, refactoring, and build proposal.",
      "The software engineer CAN write, modify, and test source code in any programming language.",
      "Build/config changes require user approval — the agent proposes but never applies unilaterally.",
      "Use mode: 'analyze' for codebase analysis, 'design' for SDD generation, 'implement' for code implementation,",
      "'review' for code review, 'refactor' for refactoring, 'build' for build/config proposals.",
    ].join(" "),
    parameters: Type.Object({
      mode: StringEnum(["analyze", "design", "implement", "review", "refactor", "build"] as const, {
        description: "Mode: 'analyze' for codebase analysis, 'design' for SDD generation, 'implement' for code implementation, 'review' for code review, 'refactor' for refactoring, 'build' for build/config proposals.",
      }),
      topic: Type.String({ description: "The topic, feature, or component to work on." }),
      skill: Type.Optional(Type.String({ description: "Optional skill to apply (e.g., 'tdd-workflow', 'clean-architecture'). The agent proposes by default." })),
      target: Type.Optional(Type.String({ description: "Optional target file or module to analyze/review/refactor." })),
    }),

    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const prompt = buildSoftwareEngineerPrompt(params.mode, params.topic, params.skill);
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
      const modeLabel = args.mode === "analyze" ? "analyze"
        : args.mode === "design" ? "SDD design"
        : args.mode === "implement" ? "implement"
        : args.mode === "review" ? "review"
        : args.mode === "refactor" ? "refactor"
        : "build proposal";
      const icon = args.mode === "analyze" ? "🔍"
        : args.mode === "design" ? "📐"
        : args.mode === "implement" ? "🔨"
        : args.mode === "review" ? "🔎"
        : args.mode === "refactor" ? "♻️"
        : "🔧";
      let text = theme.fg("toolTitle", theme.bold("software_engineer "))
        + theme.fg("accent", modeLabel)
        + theme.fg("muted", ` ${icon}`);
      if (args.skill) {
        text += theme.fg("dim", ` [${args.skill}]`);
      }
      const preview = args.topic.length > 60 ? `${args.topic.slice(0, 60)}...` : args.topic;
      text += `\n  ${theme.fg("dim", preview)}`;
      return new Text(text, 0, 0);
    },

    renderResult(result, { expanded }, theme, _context) {
      return renderToolResult(result, { expanded }, theme, _context, {
        icon: "👷",
        title: "Software Engineer",
        modeLabel: "software engineering",
      });
    },
  });

  // ── Command: /swe-analyze (quick report + dialogue) ──

  pi.registerCommand("swe-analyze", {
    description: "Analyze existing codebase, requirements, or design documents.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify("Usage: /swe-analyze <target>\n\nAnalyzes existing codebase, requirements, or design documents.", "warning");
        return;
      }

      ctx.ui.setWorkingMessage("Software engineer is analyzing...");
      ctx.ui.setWorkingVisible(true);

      const prompt = buildSoftwareEngineerPrompt("analyze", args);
      let lastUpdate = "";
      const result = await spawnQuickReport(
        ctx.cwd,
        args,
        prompt,
        "read,write,edit,bash,find,grep,ls",
        ctx.signal,
        (partial) => {
          const text = partial.content[0]?.type === "text" ? partial.content[0].text : "";
          if (text && text !== lastUpdate && text !== "(working...)") {
            lastUpdate = text;
            const preview = text.length > 120 ? text.slice(0, 120) + "..." : text;
            ctx.ui.setWorkingMessage(`Analysis: ${preview}`);
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
      ctx.ui.notify(`### Codebase Analysis\n\n${preview}`, "info");
    },
  });

  // ── Command: /swe-design (quick report + dialogue) ──

  pi.registerCommand("swe-design", {
    description: "Generate Software Detailed Design (SDD) from requirements.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify("Usage: /swe-design <topic>\n\nGenerates detailed design from SRS/system design documents.", "warning");
        return;
      }

      ctx.ui.setWorkingMessage("Software engineer is designing...");
      ctx.ui.setWorkingVisible(true);

      const prompt = buildSoftwareEngineerPrompt("design", args);
      let lastUpdate = "";
      const result = await spawnQuickReport(
        ctx.cwd,
        args,
        prompt,
        "read,write,edit,bash,find,grep,ls",
        ctx.signal,
        (partial) => {
          const text = partial.content[0]?.type === "text" ? partial.content[0].text : "";
          if (text && text !== lastUpdate && text !== "(working...)") {
            lastUpdate = text;
            const preview = text.length > 120 ? text.slice(0, 120) + "..." : text;
            ctx.ui.setWorkingMessage(`Design: ${preview}`);
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
      ctx.ui.notify(`### Software Detailed Design\n\n${preview}`, "info");
    },
  });

  // ── Command: /swe-implement (quick report + dialogue) ──

  pi.registerCommand("swe-implement", {
    description: "Implement approved design into source code with tests.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify("Usage: /swe-implement <topic>\n\nImplements approved design into source code with complete test suite.", "warning");
        return;
      }

      ctx.ui.setWorkingMessage("Software engineer is implementing...");
      ctx.ui.setWorkingVisible(true);

      const prompt = buildSoftwareEngineerPrompt("implement", args);
      let lastUpdate = "";
      const result = await spawnQuickReport(
        ctx.cwd,
        args,
        prompt,
        "read,write,edit,bash,find,grep,ls",
        ctx.signal,
        (partial) => {
          const text = partial.content[0]?.type === "text" ? partial.content[0].text : "";
          if (text && text !== lastUpdate && text !== "(working...)") {
            lastUpdate = text;
            const preview = text.length > 120 ? text.slice(0, 120) + "..." : text;
            ctx.ui.setWorkingMessage(`Implementation: ${preview}`);
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
      ctx.ui.notify(`### Implementation Report\n\n${preview}`, "info");
    },
  });

  // ── Command: /swe-review (quick report + dialogue) ──

  pi.registerCommand("swe-review", {
    description: "Code review — self-review or triggered review with staged editing.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify("Usage: /swe-review <target>\n\nSelf-review or triggered review. Agent proposes changes, user approves.", "warning");
        return;
      }

      ctx.ui.setWorkingMessage("Software engineer is reviewing...");
      ctx.ui.setWorkingVisible(true);

      const prompt = buildSoftwareEngineerPrompt("review", args);
      let lastUpdate = "";
      const result = await spawnQuickReport(
        ctx.cwd,
        args,
        prompt,
        "read,write,edit,bash,find,grep,ls",
        ctx.signal,
        (partial) => {
          const text = partial.content[0]?.type === "text" ? partial.content[0].text : "";
          if (text && text !== lastUpdate && text !== "(working...)") {
            lastUpdate = text;
            const preview = text.length > 120 ? text.slice(0, 120) + "..." : text;
            ctx.ui.setWorkingMessage(`Review: ${preview}`);
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
      ctx.ui.notify(`### Code Review Report\n\n${preview}`, "info");
    },
  });

  // ── Command: /swe-refactor (quick report + dialogue) ──

  pi.registerCommand("swe-refactor", {
    description: "Refactor existing code with impact analysis.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify("Usage: /swe-refactor <target>\n\nRefactors existing code with impact analysis. Uses GitNexus when available.", "warning");
        return;
      }

      ctx.ui.setWorkingMessage("Software engineer is analyzing refactoring...");
      ctx.ui.setWorkingVisible(true);

      const prompt = buildSoftwareEngineerPrompt("refactor", args);
      let lastUpdate = "";
      const result = await spawnQuickReport(
        ctx.cwd,
        args,
        prompt,
        "read,write,edit,bash,find,grep,ls",
        ctx.signal,
        (partial) => {
          const text = partial.content[0]?.type === "text" ? partial.content[0].text : "";
          if (text && text !== lastUpdate && text !== "(working...)") {
            lastUpdate = text;
            const preview = text.length > 120 ? text.slice(0, 120) + "..." : text;
            ctx.ui.setWorkingMessage(`Refactor: ${preview}`);
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
      ctx.ui.notify(`### Refactoring Proposal\n\n${preview}`, "info");
    },
  });

  // ── Command: /swe-build (quick report + dialogue) ──

  pi.registerCommand("swe-build", {
    description: "Propose build/config changes (requires user approval before applying).",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify("Usage: /swe-build <topic>\n\nProposes build/config changes. Agent proposes, user approves and finalizes.", "warning");
        return;
      }

      ctx.ui.setWorkingMessage("Software engineer is analyzing build needs...");
      ctx.ui.setWorkingVisible(true);

      const prompt = buildSoftwareEngineerPrompt("build", args);
      let lastUpdate = "";
      const result = await spawnQuickReport(
        ctx.cwd,
        args,
        prompt,
        "read,write,edit,bash,find,grep,ls",
        ctx.signal,
        (partial) => {
          const text = partial.content[0]?.type === "text" ? partial.content[0].text : "";
          if (text && text !== lastUpdate && text !== "(working...)") {
            lastUpdate = text;
            const preview = text.length > 120 ? text.slice(0, 120) + "..." : text;
            ctx.ui.setWorkingMessage(`Build: ${preview}`);
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
      ctx.ui.notify(`### Build/Config Proposal\n\n${preview}`, "info");
    },
  });
}
