/**
 * System prompt builders for subagent extensions.
 *
 * Provides a common skeleton with role, restrictions, file permissions,
 * workflow instructions, and domain-specific customization points.
 */

import type { PromptBuilderOptions } from "./types.ts";
import { getFinalOutput } from "./utl-message-utils.ts";
import { spawnQuickReport as _spawnQuickReport } from "./ext-quick-report.ts";

// ─── Base Prompt Builder ────────────────────────────────────────────────────

export function buildSystemPrompt(opts: PromptBuilderOptions): string {
  const {
    role,
    modeLabel,
    topic,
    depthModifier = "",
    restrictions,
    allowedExtensions,
    workflow,
    domainInfo,
    reportingInstructions,
  } = opts;

  const restrictedFiles = restrictions
    .map(r => r.replace("DO NOT", "").trim())
    .join(", ");

  const allowedExtList = allowedExtensions.map(ext => `\`${ext}\``).join(", ");

  let prompt = `# ${role}

You are a ${modeLabel} specialist. ${depthModifier}

## File Permissions

You CAN write design/research documents:
- ✅ **CAN** write any \`${allowedExtList}\` design documents

## 🚫 ABSOLUTE RESTRICTIONS

${restrictions.map(r => `- ${r}`).join("\n")}

You HAVE access to \`read\`, \`write\`, \`edit\`, \`bash\`, \`find\`, \`grep\`, and \`ls\` tools.
`;

  // Domain-specific info
  if (domainInfo) {
    prompt += `\n## Domain Context\n\n${domainInfo}\n`;
  }

  // Workflow
  prompt += `\n## Workflow\n\n`;
  workflow.forEach((step, i) => {
    prompt += `${i + 1}. **${step}**\n`;
  });

  // Reporting instructions
  if (reportingInstructions) {
    prompt += `\n## Reporting\n\n${reportingInstructions}\n`;
  }

  // Output format section
  prompt += `\n## Output Format\n\nStructure your response with clear sections, include diagrams where appropriate, and save documents to the \`design/\` directory.\n`;

  // Current task
  prompt += `\n## Current Task\n\n${topic}\n`;

  return prompt;
}

// ─── Re-export helpers ──────────────────────────────────────────────────────

export { getFinalOutput } from "./utl-message-utils.ts";
export { spawnQuickReport } from "./ext-quick-report.ts";
