/**
 * Software Implementation Module
 *
 * Handles implementation of approved SDD into source code with complete
 * test suites (component, integration, system/E2E tests).
 *
 * Used by the software-engineer extension for REQ-003 and REQ-004 compliance.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ImplementationPlan {
  topic: string;
  modules: ImplementationModule[];
  testStrategy: TestStrategy;
  developmentTools: DevelopmentTool[];
}

export interface ImplementationModule {
  id: string;
  name: string;
  sourceFile: string;
  testFiles: {
    component: string;
    integration: string;
    system: string;
  };
  dependencies: string[];
}

export interface TestStrategy {
  componentTests: boolean;
  integrationTests: boolean;
  systemTests: boolean;
  coverageTarget: number; // percentage
}

export interface DevelopmentTool {
  name: string;
  command: string;
  purpose: string;
  enabled: boolean;
}

// ─── Implementation Planning ────────────────────────────────────────────────

/**
 * Create an implementation plan from an SDD topic.
 * In production, the subagent would parse the SDD and generate a detailed plan.
 */
export function createImplementationPlan(
  topic: string,
  moduleCount: number = 4,
): ImplementationPlan {
  const modules: ImplementationModule[] = [];

  for (let i = 1; i <= moduleCount; i++) {
    const moduleId = `MOD-${String(i).padStart(3, "0")}`;
    const moduleName = `module_${i}`;
    const srcFile = `src/${moduleName}/index.ts`;

    modules.push({
      id: moduleId,
      name: moduleName,
      sourceFile: srcFile,
      testFiles: {
        component: `tests/component/${moduleName}.test.ts`,
        integration: `tests/integration/${moduleName}-integration.test.ts`,
        system: `tests/system/${moduleName}-system.test.ts`,
      },
      dependencies: i > 1 ? [`MOD-${String(i - 1).padStart(3, "0")}`] : [],
    });
  }

  return {
    topic,
    modules,
    testStrategy: {
      componentTests: true,
      integrationTests: true,
      systemTests: true,
      coverageTarget: 80,
    },
    developmentTools: [],
  };
}

// ─── Test Generation Templates ──────────────────────────────────────────────

/**
 * Generate a component (unit) test template for a module.
 */
export function generateComponentTestTemplate(
  moduleName: string,
  moduleDescription: string,
): string {
  return `/**
 * Component Tests: ${moduleName}
 *
 * Traceability: Tests the ${moduleDescription} module in isolation.
 *
 * @module ${moduleName}
 */

import { describe, it, expect, beforeEach } from "vitest";
// import { ${moduleName} } from "../../src/${moduleName}/index";

describe("${moduleName} Component Tests", () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe("module initialization", () => {
    it("should initialize correctly", () => {
      // TODO: Implement test
      expect(true).toBe(true);
    });

    it("should handle empty input gracefully", () => {
      // TODO: Implement test
      expect(true).toBe(true);
    });
  });

  describe("core functionality", () => {
    it("should perform expected behavior", () => {
      // TODO: Implement test based on SDD specifications
      expect(true).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle invalid input", () => {
      // TODO: Implement test
      expect(true).toBe(true);
    });

    it("should handle edge cases", () => {
      // TODO: Implement test
      expect(true).toBe(true);
    });
  });
});
`;
}

/**
 * Generate an integration test template for a module.
 */
export function generateIntegrationTestTemplate(
  moduleName: string,
  dependencies: string[],
): string {
  return `/**
 * Integration Tests: ${moduleName}
 *
 * Tests ${moduleName} with its dependencies.
 *
 * @module ${moduleName}-integration
 */

import { describe, it, expect, beforeEach } from "vitest";
// import { ${moduleName} } from "../../src/${moduleName}/index";

describe("${moduleName} Integration Tests", () => {
  beforeEach(() => {
    // Setup shared test fixtures
  });

  describe("integration with dependencies", () => {
    it("should communicate correctly with ${dependencies.join(", ")}", () => {
      // TODO: Implement integration test
      expect(true).toBe(true);
    });

    it("should handle dependency failures gracefully", () => {
      // TODO: Implement test for failure scenarios
      expect(true).toBe(true);
    });
  });
});
`;
}

/**
 * Generate a system (E2E) test template for a feature.
 */
export function generateSystemTestTemplate(
  featureName: string,
  flow: string[],
): string {
  return `/**
 * System Tests: ${featureName}
 *
 * End-to-end tests for the ${featureName} feature.
 * Tests the complete flow: ${flow.join(" → ")}
 *
 * @module ${featureName}-system
 */

import { describe, it, expect } from "vitest";

describe("${featureName} System Tests", () => {
  it("should complete the full flow: ${flow.join(" → ")}", () => {
    // TODO: Implement E2E test
    expect(true).toBe(true);
  });

  it("should handle errors in the flow", () => {
    // TODO: Implement error handling test
    expect(true).toBe(true);
  });
});
`;
}

// ─── Implementation Report ──────────────────────────────────────────────────

/**
 * Generate an implementation report summarizing what was created.
 */
export function generateImplementationReport(
  plan: ImplementationPlan,
  createdFiles: string[],
  testFiles: string[],
): string {
  let md = `# Implementation Report: ${plan.topic}\n\n`;

  md += "## Summary\n\n";
  md += `- **Modules implemented:** ${plan.modules.length}\n`;
  md += `- **Source files created:** ${createdFiles.length}\n`;
  md += `- **Test files created:** ${testFiles.length}\n`;
  md += `- **Test strategy:** ${plan.testStrategy.componentTests ? "component" : ""} `;
  md += `${plan.testStrategy.integrationTests ? "integration" : ""} `;
  md += `${plan.testStrategy.systemTests ? "system" : ""}\n`;
  md += `- **Coverage target:** ${plan.testStrategy.coverageTarget}%\n\n`;

  md += "## Files Created\n\n";
  md += "### Source Files\n\n";
  for (const file of createdFiles) {
    md += `- \`${file}\`\n`;
  }

  md += "\n### Test Files\n\n";
  for (const file of testFiles) {
    md += `- \`${file}\`\n`;
  }

  md += "\n## Next Steps\n\n";
  md += "- [ ] Run development tools (linters, formatters, type checkers)\n";
  md += "- [ ] Execute test suite\n";
  md += "- [ ] Review generated code\n";
  md += "- [ ] Update documentation\n";

  return md;
}
