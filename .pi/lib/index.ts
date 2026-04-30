/**
 * Shared subagent library for Pi extension agents.
 *
 * Provides common infrastructure for spawning subagents, interactive dialogue,
 * result rendering, and system prompt construction. Used by all agent extensions
 * (collaborator-agent, systems-engineer, etc.) to avoid code duplication.
 *
 ## Usage

```typescript
import {
  runSubagent,
  runInteractiveDialogue,
  renderToolResult,
  buildSystemPrompt,
  spawnQuickReport,
  formatTokens,
  formatUsage,
  formatToolCall,
  getFinalOutput,
  getDisplayItems,
  type SubagentResult,
  type SubagentDetails,
  type DialogueContext,
  type RenderOptions,
  type PromptBuilderOptions,
} from "../lib";

// Software Engineer lib (SWE extensions)
import {
  generateTraceabilityMatrix,
  proposeSkills,
  generateSDD,
  createImplementationPlan,
  generateTDDWorkflow,
  selfReview,
  assessImpact,
  isBuildArtifact,
  detectProjectLanguage,
} from "../lib";
```
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type {
  SubagentResult,
  SubagentUsage,
  SubagentDetails,
  DisplayItem,
  TextItem,
  ToolCallItem,
  DialogueContext,
  RenderOptions,
  SpawnerResult,
  SubagentRunner,
  InteractiveDialogueRunner,
  ToolResultRenderer,
  PromptBuilderOptions,
} from "./types.ts";

// ─── Message Utilities (pure, no external deps) ─────────────────────────────

export {
  getFinalOutput,
  getDisplayItems,
} from "./utl-message-utils.ts";

// ─── Subagent Runner ────────────────────────────────────────────────────────

export {
  runSubagent,
} from "./ext-subagent-runner.ts";

// ─── Interactive Dialogue ───────────────────────────────────────────────────

export {
  runInteractiveDialogue,
} from "./ext-dialogue-dialog.ts";

// ─── Result Renderer ────────────────────────────────────────────────────────

export {
  renderToolResult,
} from "./ext-result-renderer.ts";

// ─── Result Formatters (pure utilities, no external deps) ───────────────────

export {
  formatTokens,
  formatUsage,
  formatToolCall,
} from "./utl-result-formatters.ts";

// ─── System Prompts ─────────────────────────────────────────────────────────

export {
  buildSystemPrompt,
  spawnQuickReport,
} from "./ext-system-prompts.ts";

// ─── Software Engineer Lib (SWE extensions) ─────────────────────────────────

export {
  generateTraceabilityMatrix,
  formatTraceabilityComment,
  formatFileTraceabilityHeader,
  validateTraceability,
  formatTraceabilityMatrixMarkdown,
} from "./swe-traceability.ts";

export {
  AVAILABLE_SKILLS,
  proposeSkills,
  getSkillPromptAugmentation,
  listAvailableSkills,
  buildSkillAugmentation,
} from "./swe-skill-manager.ts";

export {
  generateSDD,
  generateModuleBreakdown,
  generateInterfaceSpecs,
  generateArchitectureDiagram,
  generateSequenceDiagram,
  formatSDDMarkdown,
} from "./swe-design-generator.ts";

export {
  createImplementationPlan,
  generateComponentTestTemplate,
  generateIntegrationTestTemplate,
  generateSystemTestTemplate,
  generateImplementationReport,
} from "./swe-implementation.ts";

export {
  generateTDDWorkflow,
  generateTestsFromDesign,
  formatTDDWorkflowReport,
  selectTDDMode,
} from "./swe-tdd-workflow.ts";

export {
  REVIEW_CHECKLIST,
  selfReview,
  formatReviewReport,
  proposeReviewEdits,
  applyReviewEdits,
  buildReviewDialoguePrompt,
} from "./swe-code-reviewer.ts";

export {
  assessImpact,
  checkGitNexusAvailability,
  proposeRefactoring,
  formatRefactoringReport,
  executeRefactoring,
} from "./swe-refactoring.ts";

export {
  BUILD_ARTIFACTS,
  isBuildArtifact,
  analyzeBuildNeeds,
  generateBuildProposal,
  formatBuildProposal,
  applyApprovedChanges,
} from "./swe-build-proposer.ts";

export {
  detectProjectLanguage,
  DEV_TOOLS,
  detectAvailableTools,
  proposeToolchain,
  getToolCommand,
  formatToolchainProposal,
} from "./swe-language-tools.ts";
