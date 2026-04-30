import { describe, it } from "node:test";
import assert from "node:assert";
import {
  createImplementationPlan,
  generateComponentTestTemplate,
  generateIntegrationTestTemplate,
  generateSystemTestTemplate,
  generateImplementationReport,
} from "../../lib/swe-implementation.js";

describe("createImplementationPlan", () => {
  it("creates plan with correct number of modules", () => {
    const plan = createImplementationPlan("test topic", 4);
    assert.equal(plan.modules.length, 4);
  });

  it("generates correct file paths", () => {
    const plan = createImplementationPlan("test topic", 2);
    assert.ok(plan.modules[0].sourceFile.startsWith("src/"));
    assert.ok(plan.modules[0].testFiles.component.startsWith("tests/component/"));
    assert.ok(plan.modules[0].testFiles.integration.startsWith("tests/integration/"));
    assert.ok(plan.modules[0].testFiles.system.startsWith("tests/system/"));
  });

  it("sets default test strategy", () => {
    const plan = createImplementationPlan("test topic");
    assert.equal(plan.testStrategy.componentTests, true);
    assert.equal(plan.testStrategy.integrationTests, true);
    assert.equal(plan.testStrategy.systemTests, true);
    assert.equal(plan.testStrategy.coverageTarget, 80);
  });
});

describe("generateComponentTestTemplate", () => {
  it("generates test template with module name", () => {
    const template = generateComponentTestTemplate("auth", "authentication module");
    assert.ok(template.includes("auth Component Tests"));
    assert.ok(template.includes("describe"));
    assert.ok(template.includes("it"));
    assert.ok(template.includes("expect"));
  });

  it("includes traceability comment", () => {
    const template = generateComponentTestTemplate("auth", "authentication");
    assert.ok(template.includes("Traceability"));
  });
});

describe("generateIntegrationTestTemplate", () => {
  it("generates integration test template", () => {
    const template = generateIntegrationTestTemplate("auth", ["db", "cache"]);
    assert.ok(template.includes("auth Integration Tests"));
    assert.ok(template.includes("db"));
  });
});

describe("generateSystemTestTemplate", () => {
  it("generates system test template", () => {
    const template = generateSystemTestTemplate("login", ["init", "process", "output"]);
    assert.ok(template.includes("login System Tests"));
    assert.ok(template.includes("init"));
    assert.ok(template.includes("process"));
  });
});

describe("generateImplementationReport", () => {
  it("generates report with summary", () => {
    const plan = createImplementationPlan("test", 2);
    const report = generateImplementationReport(plan, ["src/main.ts"], ["tests/main.test.ts"]);
    assert.ok(report.includes("# Implementation Report"));
    assert.ok(report.includes("Modules implemented"));
    assert.ok(report.includes("Source files created"));
  });

  it("includes next steps", () => {
    const plan = createImplementationPlan("test", 1);
    const report = generateImplementationReport(plan, ["src/main.ts"], ["tests/main.test.ts"]);
    assert.ok(report.includes("## Next Steps"));
    assert.ok(report.includes("Run development tools"));
  });
});
