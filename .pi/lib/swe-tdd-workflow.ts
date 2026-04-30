/**
 * TDD (Test-Driven Development) Workflow Module
 *
 * Orchestrates the TDD cycle: test → stub → implement → verify → refactor.
 * Tests are generated from design/requirements before implementation begins.
 *
 * Used by the software-engineer extension for REQ-004 and REQ-007 compliance.
 */

import {
  generateComponentTestTemplate,
  generateIntegrationTestTemplate,
  generateSystemTestTemplate,
  generateImplementationReport,
  createImplementationPlan,
  type ImplementationPlan,
} from "./swe-implementation.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TDDCycle {
  phase: "test" | "stub" | "implement" | "verify" | "refactor";
  description: string;
  artifacts: string[];
}

export interface TDDWorkflow {
  topic: string;
  cycles: TDDCycle[];
  testsGenerated: string[];
  codeGenerated: string[];
  refactoringApplied: string[];
}

// ─── TDD Cycle Generation ───────────────────────────────────────────────────

/**
 * Generate a complete TDD workflow for a given topic.
 *
 * The workflow follows: tests from design → stub code → implementation → verification → refactoring.
 */
export function generateTDDWorkflow(
  topic: string,
  moduleCount: number = 3,
): TDDWorkflow {
  const plan = createImplementationPlan(topic, moduleCount);
  const cycles: TDDCycle[] = [];
  const testsGenerated: string[] = [];
  const codeGenerated: string[] = [];

  // Phase 1: Generate tests from design (RED)
  cycles.push({
    phase: "test",
    description: "Generate test specifications from SDD/requirements",
    artifacts: [],
  });

  for (const module of plan.modules) {
    // Component tests
    testsGenerated.push(module.testFiles.component);
    // Integration tests
    testsGenerated.push(module.testFiles.integration);
    // System tests
    testsGenerated.push(module.testFiles.system);
  }

  // Phase 2: Create stubs (RED → GREEN)
  cycles.push({
    phase: "stub",
    description: "Create stub implementations that satisfy test structure",
    artifacts: plan.modules.map((m) => m.sourceFile),
  });

  for (const module of plan.modules) {
    codeGenerated.push(module.sourceFile);
  }

  // Phase 3: Implement to make tests pass (GREEN)
  cycles.push({
    phase: "implement",
    description: "Implement actual logic to satisfy all tests",
    artifacts: plan.modules.map((m) => m.sourceFile),
  });

  // Phase 4: Verify all tests pass (GREEN)
  cycles.push({
    phase: "verify",
    description: "Run test suite and verify all tests pass",
    artifacts: testsGenerated,
  });

  // Phase 5: Refactor (REFACTOR)
  cycles.push({
    phase: "refactor",
    description: "Improve code structure while maintaining passing tests",
    artifacts: plan.modules.map((m) => m.sourceFile),
  });

  return {
    topic,
    cycles,
    testsGenerated,
    codeGenerated,
    refactoringApplied: [],
  };
}

// ─── TDD Test Generation from Design ────────────────────────────────────────

/**
 * Generate test specifications from a design description.
 * In production, the subagent would parse the SDD and generate specific tests.
 */
export function generateTestsFromDesign(
  designDescription: string,
  moduleName: string,
): {
  componentTests: string;
  integrationTests: string;
  systemTests: string;
} {
  return {
    componentTests: generateComponentTestTemplate(moduleName, designDescription),
    integrationTests: generateIntegrationTestTemplate(
      moduleName,
      ["dependency_a", "dependency_b"],
    ),
    systemTests: generateSystemTestTemplate(moduleName, [
      "initialize",
      "process",
      "validate",
      "output",
    ]),
  };
}

// ─── TDD Workflow Report ────────────────────────────────────────────────────

/**
 * Format the TDD workflow as a Markdown report.
 */
export function formatTDDWorkflowReport(workflow: TDDWorkflow): string {
  let md = `# TDD Workflow: ${workflow.topic}\n\n`;

  md += "## Workflow Phases\n\n";
  md += "| Phase | Description |\n";
  md += "|---|---|\n";

  const phaseIcons: Record<string, string> = {
    test: "🔴",
    stub: "🟡",
    implement: "🟢",
    verify: "✅",
    refactor: "♻️",
  };

  for (const cycle of workflow.cycles) {
    const icon = phaseIcons[cycle.phase] || "⚪";
    md += `| ${icon} ${cycle.phase.toUpperCase()} | ${cycle.description} |\n`;
  }

  md += "\n## Generated Artifacts\n\n";
  md += "### Tests\n\n";
  for (const test of workflow.testsGenerated) {
    md += `- \`${test}\`\n`;
  }

  md += "\n### Source Code\n\n";
  for (const code of workflow.codeGenerated) {
    md += `- \`${code}\`\n`;
  }

  return md;
}

// ─── TDD Mode Selection ─────────────────────────────────────────────────────

export type TDDMode = "tdd" | "dit" | "mixed";

/**
 * Determine the appropriate TDD mode based on context.
 *
 * - tdd: Test-first (default) — tests generated before implementation
 * - dit: Develop-then-test — implementation first, tests after
 * - mixed: Hybrid — test some parts, implement, then continue
 */
export function selectTDDMode(
  context: {
    hasExistingCode: boolean;
    isCritical: boolean;
    isExploratory: boolean;
  },
): TDDMode {
  if (context.isExploratory) {
    return "dit"; // Exploratory coding benefits from DIT
  }
  if (context.hasExistingCode && !context.isCritical) {
    return "mixed"; // Mixed approach for incremental changes
  }
  return "tdd"; // Default: TDD for critical/new code
}
