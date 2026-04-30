# Project Guidelines

## Table of Contents

| Section | Description |
|---|---|
| [Architecture Overview](#architecture-overview) | Shared library pattern and project structure |
| [Skills Reference](#skills-reference) | Domain knowledge templates and conventions |
| [Collaborator Agent](#collaborator-agent) | Exploration, research, and brainstorming |
| [Systems Engineer](#systems-engineer) | Design, requirements, and architecture |
| [Adding New Extensions](#adding-new-extensions) | Guide → See [`.pi/EXTENSIONS-GUIDE.md`](.pi/EXTENSIONS-GUIDE.md) |

---

## Architecture Overview

Agent extensions use a **shared library pattern** to avoid code duplication:

```
.pi/
├── lib/                   # Shared infrastructure (spawn, dialogue, render, prompts)
├── extensions/
│   ├── collaborator-agent.ts   # Thin: ~350 lines — tool + commands
│   └── systems-engineer.ts     # Thin: ~260 lines — tool + commands
```

Each agent extension imports from `../lib/` for:
- **Subagent spawning** — `runSubagent()` spawns pi subprocess, parses JSONL
- **Interactive dialogue** — `runInteractiveDialogue()` TUI component
- **Result rendering** — `renderToolResult()` expanded/collapsed TUI display
- **System prompts** — `buildSystemPrompt()` structured prompt generation

When adding a new agent, import from `../lib/` and register only your tool + commands (~150-250 lines).

---

## Skills Reference

The project includes **5 domain-specific skills** in `.pi/skills/` that provide templates and conventions for design artifacts. These are automatically loaded by the **Collaborator Agent** and **Systems Engineer** when their tasks match the skill scope.

| Skill | Description | Triggered When |
|---|---|---|
| `design-doc-template` | Standard templates for feasibility studies, design documents, and architecture reports | Generating any design artifact document |
| `diagram-styles` | Conventions for Mermaid, PlantUML, and ASCII diagrams | Creating visual diagrams in design documents |
| `embedded-systems` | Domain knowledge for embedded systems, IoT, and cyber-physical system design | Working on embedded, IoT, or CPS projects |
| `game-dev-architecture` | Domain knowledge for game development (rendering, ECS, physics, AI, networking) | Working on game development projects |
| `requirements-format` | Templates for formal (IEEE 830) and lightweight (user story) requirements | Specifying requirements for a system |

**How skills work:** When a collaborator or systems engineer is invoked, the agent checks if the topic matches any skill description. If so, it loads the skill's SKILL.md and follows its conventions when generating artifacts.

---

## Collaborator Agent

A read-only subagent extension is available for exploration, research, and idea generation. It works as an **interactive thinking partner** — not a black-box report generator.

### When to Delegate

| User Intent | Action |
|---|---|
| New features or ideas | Call `collaborate` tool with `mode: "brainstorm"` |
| Feasibility studies | Call `collaborate` tool with `mode: "study"` |
| Research on technologies/libraries | Call `collaborate` tool with `mode: "research"` |
| Interactive deep-dive (user wants back-and-forth) | Suggest `/brainstorm`, `/feasibility`, or `/research` command |
| Quick single-shot analysis | Call `collaborate` tool directly or use `/collaborate` |

### Collaboration Workflow

1. **Understand** the user's request — is it exploration, research, or implementation?
2. **Delegate** to the `collaborate` tool for exploration/analysis tasks
3. **Review** the collaborator's output — it explores the codebase, shares insights, and asks questions
4. **Synthesize** findings with your own analysis
5. **Present** recommendations to the user
6. If the user wants to go deeper, suggest an **interactive dialogue** command (`/brainstorm`, `/feasibility`, `/research`)

### Command Types

The Collaborator Agent provides two types of commands:

**Quick Report** — Single-shot analysis with live progress:
- `/collaborate <mode> <topic> [depth]` — One-pass report (study, research, or brainstorm mode)
  - Modes: `study`, `research`, `brainstorm`
  - Depth: `quick`, `standard`, `deep` (optional)
  - Returns a complete report in a single pass

**Interactive Dialogue** — Multi-turn back-and-forth sessions:
- `/brainstorm <topic>` — Back-and-forth idea exchange
- `/feasibility <topic>` — Discuss trade-offs, risks, and recommendations
- `/research <topic>` — Gather info, compare options, answer follow-up questions
  - Opens a custom TUI component for iterative conversation
  - Agent shares insights, asks questions, user responds
  - Type `quit` to end the session

### Important Constraints

### Important Constraints

The collaborator agent **CAN write design/research documents** but **CANNOT write source code**:
- ✅ **CAN** write feasibility studies: `design/feasibility-study.md`
- ✅ **CAN** write research reports: `design/research-report.md`
- ✅ **CAN** write brainstorm notes: `design/brainstorm-notes.md`
- ✅ **CAN** write any `.md`, `.txt`, `.adoc` design documents
- ✅ Can read files (`read`, `find`, `grep`, `ls`)
- ✅ Can run research commands (`bash` with `curl`, etc.)
- ❌ **Cannot** write source code files
- ❌ **Cannot** write configuration files, build scripts, or deployment artifacts
- ❌ **Cannot** run builds, tests, or deployments

The collaborator **saves its analysis as markdown documents** in the `design/` directory after completing its work. These documents are available for the user to review and for the systems engineer to build upon.

The collaborator presents findings in **digestible chunks** and ends responses with **questions** to keep the dialogue going. Do not expect a massive report in one response — it works iteratively.

---

## Systems Engineer

A subagent extension responsible for **systems design, architecture, and requirements engineering**. It transforms feasibility studies and research from the collaborator agent into formalized design artifacts (diagrams, requirements documents, architecture descriptions).

### When to Delegate

| User Intent | Action |
|---|---|
| System design (components, interfaces, data flows) | Call `systems_engineer` tool with `mode: "design"` |
| Requirements engineering (formal or lightweight) | Call `systems_engineer` tool with `mode: "requirements"` |
| System architecture (structure, deployment, tech selection) | Call `systems_engineer` tool with `mode: "architecture"` |
| Interactive deep-dive on design/architecture | Suggest `/sys-design`, `/sys-requirements`, or `/sys-architecture` command |

### Collaboration Workflow

The systems engineer should **always**:
1. **Discover** — Search for existing design artifacts, feasibility studies, and research in the project
2. **Analyze** — Read and build upon collaborator agent results (feasibility/research documents)
3. **Design** — Generate appropriate design artifacts (documents, diagrams, requirements)
4. **Document** — Write structured design documents with clear rationale
5. **Visualize** — Include text-based diagrams (Mermaid, PlantUML, ASCII)
6. **Iterate** — Refine based on user feedback

### Interactive Dialogue Commands

- `/sys-design <topic>` — Component models, interfaces, data flows, behavior diagrams
- `/sys-requirements <topic>` — Formal (IEEE 830) or lightweight (user story) requirements
- `/sys-architecture <topic>` — Structural decomposition, technology selection, deployment views

These commands open a custom TUI component for interactive design dialogue. Type `quit` to end.

### Key Constraint

The systems engineer **CAN generate design artifact files** but **CANNOT generate source code**:
- ✅ **CAN** write `.md`, `.txt`, `.adoc`, `.mmd` (Mermaid), `.puml` (PlantUML) design artifacts
- ❌ **CANNOT** write or modify source code files (`.ts`, `.js`, `.py`, `.java`, `.cpp`, etc.)
- ❌ **CANNOT** write configuration files, build scripts, or deployment artifacts

### Design Artifact Standards

**Formal Requirements (IEEE 830):**
```
REQ-XXX: [Identifier]
Statement: [Testable requirement]
Type: [Functional | Non-Functional | Constraint | Interface]
Rationale: [Why this exists]
Priority: [Must | Should | Could | Won't]
Verification: [Inspection | Analysis | Test | Demo]
```

**Text-Based Diagramming (always used):**
- **Mermaid** — Block, sequence, state, deployment diagrams
- **PlantUML** — UML component and class diagrams
- **ASCII** — Simple layout diagrams

---

## Adding New Extensions

For complete instructions on creating new Pi extensions, see **[`.pi/EXTENSIONS-GUIDE.md`](.pi/EXTENSIONS-GUIDE.md)**.

The guide covers:
1. Official Pi extension documentation references
2. Shared library pattern and imports
3. Extension file structure with full template
4. Key implementation patterns (system prompts, tool registration, dialogue, rendering)
5. Testing requirements and infrastructure
6. Extension best practices
7. Lifecycle events
8. Quick reference checklist

> **Rule:** When adding a new agent extension, read `.pi/EXTENSIONS-GUIDE.md` in full before implementing. The shared library in `.pi/lib/` provides all common functionality — your extension should be ~150-250 lines.

Always refer to the official Pi extension documentation for API details:
- **Location**: `@mariozechner/pi-coding-agent/docs/extensions.md` (installed globally)
- **Key topics**: tool registration, event handling, UI components, lifecycle events
- **Examples**: `@mariozechner/pi-coding-agent/examples/extensions/`

### 2. Shared Library Pattern

All agent extensions import from `../lib/` to avoid code duplication. The shared library provides:

| Function | Purpose | File |
|----------|---------|------|
| `runSubagent()` | Spawns pi subprocess, parses JSONL output | `ext-subagent-runner.ts` |
| `runInteractiveDialogue()` | Interactive TUI dialogue component | `ext-dialogue-dialog.ts` |
| `renderToolResult()` | Expanded/collapsed TUI display | `ext-result-renderer.ts` |
| `buildSystemPrompt()` | Structured prompt generation | `ext-system-prompts.ts` |
| `spawnQuickReport()` | Quick single-shot report with live progress | `ext-quick-report.ts` |
| `getFinalOutput()` | Extract final text from messages | `utl-message-utils.ts` |
| `getDisplayItems()` | Extract display items from messages | `utl-message-utils.ts` |
| `formatTokens()` | Format token counts | `utl-result-formatters.ts` |
| `formatUsage()` | Format usage/cost display | `utl-result-formatters.ts` |
| `formatToolCall()` | Format tool call display | `utl-result-formatters.ts` |

**Import pattern:**
```typescript
import {
  runSubagent,
  runInteractiveDialogue,
  renderToolResult,
  buildSystemPrompt,
  spawnQuickReport,
  getFinalOutput,
  getDisplayItems,
  formatTokens,
  formatUsage,
  formatToolCall,
  type SubagentDetails,
  type SubagentResult,
  type PromptBuilderOptions,
} from "../lib/index.js";
```

### 3. Extension File Structure

Create a single file in `.pi/extensions/`:

```
.pi/extensions/
└── my-extension.ts          # Single file, ~150-250 lines
```

**File structure template:**
```typescript
/**
 * My Extension
 *
 * Brief description of what this extension does.
 * Two interaction modes:
 *   1. /my-command <topic> — Quick report with live progress
 *   2. /interactive <topic> — Interactive dialogue session
 */

import { StringEnum } from "@mariozechner/pi-ai";
import { type ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "typebox";

import { /* shared lib imports */ } from "../lib/index.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDetails(results: SubagentResult[]): SubagentDetails {
  return { results };
}

function buildMyPrompt(topic: string): string {
  const opts: PromptBuilderOptions = {
    role: "MY EXTENSION",
    modeLabel: "my mode",
    topic,
    restrictions: [
      "DO NOT generate, write, or modify any source code files",
      "DO NOT create files with extensions: .ts, .js, .tsx, .jsx, .py, .java, .cpp, .c, .h, .hpp, .cs, .go, .rs, .swift, .kt, .scala, .rb, .php, .html, .css, .scss, .json, .xml, .yaml, .yml, .toml, .ini, .cfg, .conf",
      "DO NOT write configuration files, build scripts, or deployment artifacts",
      "DO NOT run build tools, test suites, or deployment scripts",
    ],
    allowedExtensions: [".md", ".txt", ".adoc"],
    workflow: [
      "Step 1: Discover existing work",
      "Step 2: Analyze findings",
      "Step 3: Generate artifacts",
      "Step 4: Save to design/ directory",
    ],
    reportingInstructions: "Save findings as design documents in the design/ directory.",
  };
  return buildSystemPrompt(opts);
}

// ─── Extension ───────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Tool: my_tool (for main agent to call) ──

  pi.registerTool({
    name: "my_tool",
    label: "My Tool",
    description: "Description of what this tool does (shown to LLM)",
    parameters: Type.Object({
      topic: Type.String({ description: "The topic to analyze." }),
    }),

    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const prompt = buildMyPrompt(params.topic);
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
      let text = theme.fg("toolTitle", theme.bold("my_tool "))
        + theme.fg("accent", args.topic);
      return new Text(text, 0, 0);
    },

    renderResult(result, { expanded }, theme, _context) {
      return renderToolResult(result, { expanded }, theme, _context, {
        icon: "🔧",
        title: "My Extension",
        modeLabel: "my mode",
      });
    },
  });

  // ── Command: /my-command (quick report with live progress) ──

  pi.registerCommand("my-command", {
    description: "Quick report with live progress.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify("Usage: /my-command <topic>", "warning");
        return;
      }

      ctx.ui.setWorkingMessage("My extension is working...");
      ctx.ui.setWorkingVisible(true);

      const prompt = buildMyPrompt(args);
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
            ctx.ui.setWorkingMessage(`My extension: ${preview}`);
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
      ctx.ui.notify(`### My Extension Report\n\n${preview}`, "info");
    },
  });

  // ── Command: /interactive (interactive dialogue) ──

  pi.registerCommand("interactive", {
    description: "Interactive dialogue session.",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify("Usage: /interactive <topic>", "warning");
        return;
      }

      ctx.ui.notify(`Starting interactive session on: "${args}"`, "info");

      try {
        await runInteractiveDialogue(
          ctx.cwd,
          "my mode",
          args,
          (history) => {
            const historyStr = history.length > 0
              ? `\n\n--- Previous conversation ---\n${history.join("\n\n")}`
              : "";
            return buildMyPrompt(args) + historyStr;
          },
          { ui: ctx.ui, signal: ctx.signal, theme: ctx.ui.theme },
        );
      } catch (err) {
        ctx.ui.notify(`Error: ${(err as Error).message}`, "error");
      }
    },
  });
}
```

### 4. Key Implementation Patterns

#### System Prompt Construction

Use `buildSystemPrompt()` with `PromptBuilderOptions`:

```typescript
const opts: PromptBuilderOptions = {
  role: "MY EXTENSION ROLE",
  modeLabel: "my mode",
  topic: "The specific topic to analyze",
  depthModifier: "Perform an exhaustive analysis. Leave no stone unturned.", // optional
  restrictions: [
    "DO NOT generate, write, or modify any source code files",
    "DO NOT create files with extensions: .ts, .js, .tsx, .jsx, .py, .java, .cpp, .c, .h, .hpp, .cs, .go, .rs, .swift, .kt, .scala, .rb, .php, .html, .css, .scss, .json, .xml, .yaml, .yml, .toml, .ini, .cfg, .conf",
    "DO NOT write configuration files, build scripts, or deployment artifacts",
    "DO NOT run build tools, test suites, or deployment scripts",
  ],
  allowedExtensions: [".md", ".txt", ".adoc"],
  workflow: [
    "Step 1: Discover existing work",
    "Step 2: Analyze findings",
    "Step 3: Generate artifacts",
    "Step 4: Save to design/ directory",
  ],
  reportingInstructions: "Save findings as design documents in the design/ directory.",
};
const prompt = buildSystemPrompt(opts);
```

#### Tool Registration

- Use `StringEnum` from `@mariozechner/pi-ai` for string enums (Google API compatibility)
- Use `Type.String()` with `description` for all parameters
- Use `Type.Optional()` for optional parameters
- Return `{ content, details }` from `execute()`
- Use `spawnQuickReport()` for quick reports (subagent spawning + rendering)
- Use `renderToolResult()` for consistent TUI display

#### Interactive Dialogue

- Use `runInteractiveDialogue()` for multi-turn sessions
- Pass a `buildPrompt` function that prepends the system prompt to conversation history
- Handle errors with try/catch and notify the user

#### Result Rendering

```typescript
renderCall(args, theme, _context) {
  let text = theme.fg("toolTitle", theme.bold("tool_name "))
    + theme.fg("accent", args.topic);
  return new Text(text, 0, 0);
}

renderResult(result, { expanded }, theme, _context) {
  return renderToolResult(result, { expanded }, theme, _context, {
    icon: "🔧",
    title: "My Extension",
    modeLabel: "my mode",
  });
}
```

### 5. Testing Requirements

All new extensions **MUST** include tests. Follow the established test infrastructure:

#### Test Categories

| Category | Purpose | CI Ready | Deterministic |
|----------|---------|----------|---------------|
| Unit tests | Pure utility functions | ✅ | ✅ |
| Mocked JSONL | Pipeline validation with fixtures | ✅ | ✅ |
| Golden files | Structural regression tracking | ✅ | ✅ |
| Playground | Real-world LLM validation | ❌ | ❌ |

#### Test Execution

```bash
# Run all tests
npm test

# Run individual suites
npx tsx .pi/tests/unit/run.ts
npx tsx .pi/tests/mocked/run.ts
npx tsx .pi/tests/golden/run.ts
```

#### Adding Tests for a New Extension

1. **Add fixture data** — Create a JSONL fixture in `.pi/tests/fixtures/`:
   ```
   .pi/tests/fixtures/my-extension-output.jsonl
   ```

2. **Add unit tests** — If your extension adds new utility functions, add tests in `.pi/tests/unit/`:
   ```typescript
   import { describe, it, assert } from "node:test";
   import { myNewFunction } from "../../lib/my-new-function.ts";

   describe("myNewFunction", () => {
     it("handles input correctly", () => {
       assert.equal(myNewFunction("test"), "expected");
     });
   });
   ```

3. **Add mocked pipeline tests** — Add test cases in `.pi/tests/mocked/pipeline.test.ts`:
   ```typescript
   import { describe, it, before, assert } from "node:test";
   import { readFileSync } from "node:fs";
   import { runSubagent } from "../../lib/ext-subagent-runner.ts";

   describe("parseMyExtensionOutput", () => {
     it("parses fixture correctly", async () => {
       const fixture = readFileSync(".pi/tests/fixtures/my-extension-output.jsonl", "utf8");
       // ... test parsing
     });
   });
   ```

4. **Add golden file tests** — Add structural tests in `.pi/tests/golden/golden.test.ts`:
   ```typescript
   import { describe, it, before, assert } from "node:test";
   import { readFileSync } from "node:fs";

   describe("Golden: My Extension", () => {
     it("has markdown structure", async () => {
       const output = readFileSync(".pi/tests/fixtures/my-extension-output.jsonl", "utf8");
       assert.ok(output.includes("##"), "Should have markdown sections");
     });
   });
   ```

5. **Update test documentation** — Add entries to `.pi/tests/README.md` and `design/testing-plan.md`.

#### Test Runner Setup

Each test suite has a runner file. If you add a new test file, update the corresponding runner:

```typescript
// .pi/tests/unit/run.ts
import { run } from "node:test";
import { glob } from "node:fs/promises";

const files = await glob(".pi/tests/unit/*.test.ts");
for (const file of files) {
  await import(file);
}
```

### 6. Testing Infrastructure Reference

**Test directory structure:**
```
.pi/tests/
├── fixtures/
│   ├── feasibility-study.jsonl
│   ├── system-design.jsonl
│   ├── error-output.jsonl
│   ├── aborted-output.jsonl
│   └── my-extension-output.jsonl    # New fixture
├── unit/
│   ├── run.ts
│   ├── ext-result-renderer.test.ts
│   ├── ext-subagent-runner.test.ts
│   └── ext-system-prompts.test.ts
├── mocked/
│   ├── run.ts
│   └── pipeline.test.ts
└── golden/
    ├── run.ts
    └── golden.test.ts
```

**Current test counts:**
- Unit tests: 61 tests (all passing)
- Mocked tests: 31 tests (all passing)
- Golden tests: 20 tests (all passing)
- **Total: 112 tests**

**Test runner:** `tsx` + Node.js v24 `node:test` (zero external test framework dependencies)

### 7. Extension Best Practices

1. **Keep extensions thin** — Aim for ~150-250 lines. Use the shared library for common functionality.
2. **Use StringEnum for enums** — `Type.Union`/`Type.Literal` doesn't work with Google's API.
3. **Always truncate output** — Use `truncateHead`/`truncateTail` from `@mariozechner/pi-coding-agent` to avoid overwhelming the LLM context (50KB / 2000 lines limit).
4. **Handle errors gracefully** — Always check `result.isError` and notify the user.
5. **Use AbortSignal** — Pass `ctx.signal` to all async operations for proper cancellation.
6. **Set working messages** — Use `ctx.ui.setWorkingMessage()` and `ctx.ui.setWorkingVisible()` during long operations.
7. **Document usage** — Include usage hints in `ctx.ui.notify()` for command handlers.
8. **Follow naming conventions** — Use `snake_case` for tool names, `kebab-case` for command names.
9. **Respect permissions** — Extensions run with full system permissions. Only install from trusted sources.
10. **Test your extension** — Run `npm test` before submitting. Ensure all 112 existing tests still pass.

### 8. Extension Lifecycle Events

Common events to subscribe to:

```typescript
export default function (pi: ExtensionAPI) {
  // Session started
  pi.on("session_start", async (event, ctx) => {
    // event.reason: "startup" | "reload" | "new" | "resume" | "fork"
    ctx.ui.notify("Extension loaded!", "info");
  });

  // Tool called (can block)
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("Dangerous!", "Allow rm -rf?");
      if (!ok) return { block: true, reason: "Blocked by user" };
    }
  });

  // Session shutting down
  pi.on("session_shutdown", async (event, ctx) => {
    // Cleanup resources
  });
}
```

See the official Pi extension documentation for the complete event reference.

### 9. Quick Reference: Creating a New Extension

```bash
# 1. Create the extension file
touch .pi/extensions/my-extension.ts

# 2. Implement the extension (use template above)
#    - Register tool(s)
#    - Register command(s)
#    - Add helpers (makeDetails, buildPrompt, etc.)

# 3. Add test fixtures
touch .pi/tests/fixtures/my-extension-output.jsonl

# 4. Add test cases
#    - Unit tests in .pi/tests/unit/
#    - Mocked tests in .pi/tests/mocked/pipeline.test.ts
#    - Golden tests in .pi/tests/golden/golden.test.ts

# 5. Run tests
npm test

# 6. Test manually with the playground
npx tsx .pi/lib/dev-playground.ts "Test topic" all
```
