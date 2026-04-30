# Adding New Extensions

This section provides self-contained instructions for creating new Pi extensions. Follow these guidelines to maintain consistency with the established shared library patterns.

### 1. Follow Official Pi Extension Documentation

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
