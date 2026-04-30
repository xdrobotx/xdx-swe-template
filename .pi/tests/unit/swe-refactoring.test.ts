import { describe, it } from "node:test";
import assert from "node:assert";
import {
  assessImpact,
  checkGitNexusAvailability,
  proposeRefactoring,
  formatRefactoringReport,
  executeRefactoring,
} from "../../lib/swe-refactoring.js";

describe("assessImpact", () => {
  it("returns impact analysis", () => {
    const impact = assessImpact({ file: "test.ts", type: "function", description: "test func" });
    assert.ok(impact.target);
    assert.ok(Array.isArray(impact.directDependencies));
    assert.ok(Array.isArray(impact.affectedFiles));
    assert.ok(["low", "medium", "high"].includes(impact.riskLevel));
  });
});

describe("checkGitNexusAvailability", () => {
  it("returns availability result", () => {
    const result = checkGitNexusAvailability();
    assert.ok("available" in result);
  });
});

describe("proposeRefactoring", () => {
  it("generates changes for rename", () => {
    const proposal = proposeRefactoring(
      { file: "test.ts", type: "function", description: "myFunc" },
      { target: { file: "test.ts", type: "function", description: "myFunc" }, directDependencies: [], transitiveDependencies: [], affectedFiles: [], riskLevel: "low", gitnexusUsed: false },
      "rename",
    );
    assert.ok(proposal.changes.length > 0);
    assert.ok(proposal.changes[0].type === "rename");
  });

  it("generates changes for extract", () => {
    const proposal = proposeRefactoring(
      { file: "test.ts", type: "class", description: "MyClass" },
      { target: { file: "test.ts", type: "class", description: "MyClass" }, directDependencies: [], transitiveDependencies: [], affectedFiles: [], riskLevel: "low", gitnexusUsed: false },
      "extract",
    );
    assert.ok(proposal.changes[0].type === "extract");
  });

  it("includes risks for high risk refactoring", () => {
    const proposal = proposeRefactoring(
      { file: "test.ts", type: "module", description: "core" },
      { target: { file: "test.ts", type: "module", description: "core" }, directDependencies: [], transitiveDependencies: [], affectedFiles: ["a.ts", "b.ts", "c.ts", "d.ts", "e.ts", "f.ts"], riskLevel: "high", gitnexusUsed: false },
      "restructure",
    );
    assert.ok(proposal.risks.length > 0);
  });
});

describe("formatRefactoringReport", () => {
  it("generates markdown report", () => {
    const proposal = proposeRefactoring(
      { file: "test.ts", type: "function", description: "test" },
      { target: { file: "test.ts", type: "function", description: "test" }, directDependencies: [], transitiveDependencies: [], affectedFiles: [], riskLevel: "low", gitnexusUsed: false },
      "rename",
    );
    const md = formatRefactoringReport(proposal);
    assert.ok(md.includes("# Refactoring Proposal"));
    assert.ok(md.includes("test.ts"));
  });
});

describe("executeRefactoring", () => {
  it("separates applied and rejected changes", () => {
    const proposal = proposeRefactoring(
      { file: "test.ts", type: "function", description: "test" },
      { target: { file: "test.ts", type: "function", description: "test" }, directDependencies: [], transitiveDependencies: [], affectedFiles: [], riskLevel: "low", gitnexusUsed: false },
      "rename",
    );
    const result = executeRefactoring(proposal, []);
    assert.equal(result.applied.length, 0);
    assert.equal(result.rejected.length, 1);
  });
});
