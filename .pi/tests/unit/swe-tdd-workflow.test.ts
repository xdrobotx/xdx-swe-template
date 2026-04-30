import { describe, it } from "node:test";
import assert from "node:assert";
import {
  generateTDDWorkflow,
  generateTestsFromDesign,
  formatTDDWorkflowReport,
  selectTDDMode,
} from "../../lib/swe-tdd-workflow.js";

describe("generateTDDWorkflow", () => {
  it("generates 5 phases", () => {
    const workflow = generateTDDWorkflow("test topic", 2);
    assert.equal(workflow.cycles.length, 5);
    assert.equal(workflow.cycles[0].phase, "test");
    assert.equal(workflow.cycles[1].phase, "stub");
    assert.equal(workflow.cycles[2].phase, "implement");
    assert.equal(workflow.cycles[3].phase, "verify");
    assert.equal(workflow.cycles[4].phase, "refactor");
  });

  it("generates test files for each module", () => {
    const workflow = generateTDDWorkflow("test topic", 3);
    assert.ok(workflow.testsGenerated.length > 0);
  });

  it("generates source files for each module", () => {
    const workflow = generateTDDWorkflow("test topic", 3);
    assert.ok(workflow.codeGenerated.length > 0);
  });
});

describe("generateTestsFromDesign", () => {
  it("returns all three test types", () => {
    const tests = generateTestsFromDesign("auth system", "auth");
    assert.ok(tests.componentTests.includes("Component Tests"));
    assert.ok(tests.integrationTests.includes("Integration Tests"));
    assert.ok(tests.systemTests.includes("System Tests"));
  });
});

describe("formatTDDWorkflowReport", () => {
  it("generates markdown report", () => {
    const workflow = generateTDDWorkflow("test topic", 1);
    const report = formatTDDWorkflowReport(workflow);
    assert.ok(report.includes("# TDD Workflow"));
    assert.ok(report.includes("## Workflow Phases"));
  });

  it("includes phase icons", () => {
    const workflow = generateTDDWorkflow("test topic", 1);
    const report = formatTDDWorkflowReport(workflow);
    assert.ok(report.includes("🔴"));
    assert.ok(report.includes("🟡"));
    assert.ok(report.includes("🟢"));
    assert.ok(report.includes("✅"));
    assert.ok(report.includes("♻️"));
  });
});

describe("selectTDDMode", () => {
  it("returns tdd for new critical code", () => {
    const mode = selectTDDMode({ hasExistingCode: false, isCritical: true, isExploratory: false });
    assert.equal(mode, "tdd");
  });

  it("returns dit for exploratory coding", () => {
    const mode = selectTDDMode({ hasExistingCode: false, isCritical: false, isExploratory: true });
    assert.equal(mode, "dit");
  });

  it("returns mixed for existing non-critical code", () => {
    const mode = selectTDDMode({ hasExistingCode: true, isCritical: false, isExploratory: false });
    assert.equal(mode, "mixed");
  });
});
