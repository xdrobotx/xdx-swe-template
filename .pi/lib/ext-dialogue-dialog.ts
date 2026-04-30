/**
 * Interactive dialogue TUI component.
 *
 * Shows the agent's insight as markdown, displays conversation history,
 * and captures user text input. Loops until user types 'quit'.
 *
 * This is the shared TUI pattern used by ALL agent extensions.
 */

import {
  Container,
  Markdown,
  Spacer,
  Text,
} from "@mariozechner/pi-tui";
import {
  type DialogueContext,
  type InteractiveDialogueRunner,
} from "./types.ts";
import { getMarkdownTheme, type ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getFinalOutput, runSubagent } from "./ext-subagent-runner.ts";

// ─── Interactive Dialogue Runner ────────────────────────────────────────────

export const runInteractiveDialogue: InteractiveDialogueRunner = async (
  cwd: string,
  modeLabel: string,
  topic: string,
  buildPrompt: (conversationHistory: string[]) => string,
  ctx: DialogueContext,
): Promise<void> => {
  const conversationHistory: string[] = [];
  let aborted = false;

  while (!aborted) {
    // Build the prompt with conversation history
    const prompt = buildPrompt(conversationHistory);

    // Run the subagent
    const subResult = await runSubagent(
      cwd,
      prompt,
      buildBasePrompt(modeLabel, topic),
      "read,write,edit,bash,find,grep,ls",
      ctx.signal,
      undefined,
      () => {}, // No updates during dialogue
    );

    const insight = getFinalOutput(subResult.messages);
    if (!insight || insight.trim().length < 10) {
      ctx.ui.notify(`${modeLabel} produced no output.`, "warning");
      break;
    }

    conversationHistory.push(`Engineer: ${insight}`);

    // Show the dialogue component and wait for user response
    const userResponse = await showDialogue(insight, conversationHistory, modeLabel, topic, ctx);
    aborted = userResponse.aborted;

    if (!userResponse.response) continue;

    conversationHistory.push(`You: ${userResponse.response}`);
  }

  ctx.ui.notify(`${modeLabel} session ended.`, "info");
};

// ─── Dialogue UI Component ──────────────────────────────────────────────────

interface DialogueResponse {
  response: string;
  aborted: boolean;
}

function showDialogue(
  insight: string,
  conversationHistory: string[],
  modeLabel: string,
  topic: string,
  ctx: DialogueContext,
): Promise<DialogueResponse> {
  return new Promise((resolve) => {
    let inputBuffer = "";

    const component = new Container();
    component.addChild(new Text(ctx.theme.fg("accent", "⚙️ Agent Dialogue"), 0, 0));
    component.addChild(new Spacer(1));
    component.addChild(new Text(ctx.theme.fg("dim", `Mode: ${modeLabel} | Topic: ${topic}`), 0, 0));
    component.addChild(new Spacer(1));

    // Conversation history (last 6 entries)
    if (conversationHistory.length > 0) {
      component.addChild(new Text(ctx.theme.fg("muted", "─── Conversation ───"), 0, 0));
      const recent = conversationHistory.slice(-6);
      for (const line of recent) {
        const role = line.startsWith("You:") ? ctx.theme.fg("accent") : ctx.theme.fg("toolOutput");
        component.addChild(new Text(role(line), 0, 0));
      }
      component.addChild(new Spacer(1));
    }

    // Current insight
    if (insight) {
      component.addChild(new Text(ctx.theme.fg("muted", "─── Insight ───"), 0, 0));
      component.addChild(new Markdown(insight, 1, 1, getMarkdownTheme()));
      component.addChild(new Spacer(1));
    }

    // Input prompt
    component.addChild(new Text(ctx.theme.fg("muted", "Type your response (or 'quit' to end)"), 0, 0));

    // Input line
    const inputLine = new Text(ctx.theme.fg("accent", "> ") + inputBuffer, 0, 0);
    component.addChild(inputLine);

    // Wire up keyboard handling
    component.onKey = (key: string | { name: string }) => {
      const keyStr = typeof key === "string" ? key : key.name;

      if (keyStr === "return" || keyStr === "enter") {
        const trimmed = inputBuffer.trim();
        if (trimmed.toLowerCase() === "quit") {
          resolve({ response: "", aborted: true });
        } else if (trimmed) {
          resolve({ response: trimmed, aborted: false });
        }
        return true;
      }

      if (keyStr === "escape") {
        resolve({ response: "", aborted: true });
        return true;
      }

      if (typeof key === "string" && key.length === 1) {
        inputBuffer += key;
        inputLine.setText(ctx.theme.fg("accent", "> ") + inputBuffer);
      }

      return true;
    };

    // The custom component returns immediately with the Promise resolved
    // when the user presses Enter or Escape
    ctx.ui.custom<DialogueResponse>((_tui, _theme, _keybindings, done) => {
      component.onKey = (key: string | { name: string }) => {
        const keyStr = typeof key === "string" ? key : key.name;

        if (keyStr === "return" || keyStr === "enter") {
          const trimmed = inputBuffer.trim();
          if (trimmed.toLowerCase() === "quit") {
            done({ response: "", aborted: true });
          } else if (trimmed) {
            done({ response: trimmed, aborted: false });
          }
          return true;
        }

        if (keyStr === "escape") {
          done({ response: "", aborted: true });
          return true;
        }

        if (typeof key === "string" && key.length === 1) {
          inputBuffer += key;
          inputLine.setText(ctx.theme.fg("accent", "> ") + inputBuffer);
        }

        return true;
      };

      return component;
    }).then(resolve);
  });
}

// ─── Minimal Base Prompt for Dialogue ───────────────────────────────────────

/**
 * Builds a minimal base prompt for the subagent during dialogue.
 * Each extension should override this with its own role-specific prompt.
 */
function buildBasePrompt(modeLabel: string, topic: string): string {
  return `You are an agent operating in interactive dialogue mode.

Mode: ${modeLabel}
Topic: ${topic}

## Guidelines

1. **Discover** — Search for existing design artifacts, feasibility studies, and research in the project
2. **Analyze** — Read and build upon any collaborator agent results you find
3. **Design** — Generate appropriate design artifacts (documents, diagrams, requirements)
4. **Document** — Write structured design documents with clear rationale
5. **Visualize** — Include text-based diagrams (Mermaid, PlantUML, ASCII)
6. **Report** — Save your findings as markdown documents in the design/ directory

## Output Format

Structure your response as:

### 1. Context Summary
Brief summary of what's being addressed.

### 2. Analysis
Key findings and insights.

### 3. Design / Recommendations
Your design decisions with rationale.

### 4. Artifacts
Documents and diagrams (save to design/ directory).

### 5. Next Steps
What comes next or open questions.

Start by discovering existing artifacts in the project.`;
}
