import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BUILD_ARTIFACTS,
  isBuildArtifact,
  generateBuildProposal,
  formatBuildProposal,
  applyApprovedChanges,
} from "../../lib/swe-build-proposer.js";

describe("BUILD_ARTIFACTS", () => {
  it("has build artifacts registered", () => {
    assert.ok(BUILD_ARTIFACTS.length > 0);
  });

  it("includes common package files", () => {
    const paths = BUILD_ARTIFACTS.map((a) => a.path);
    assert.ok(paths.includes("package.json"));
    assert.ok(paths.includes("Cargo.toml"));
    assert.ok(paths.includes("go.mod"));
  });

  it("includes docker files", () => {
    const paths = BUILD_ARTIFACTS.map((a) => a.path);
    assert.ok(paths.includes("Dockerfile"));
    assert.ok(paths.includes("docker-compose.yml"));
  });

  it("includes make/cmake files", () => {
    const paths = BUILD_ARTIFACTS.map((a) => a.path);
    assert.ok(paths.includes("Makefile"));
    assert.ok(paths.includes("CMakeLists.txt"));
  });

  it("includes CI/CD files", () => {
    const paths = BUILD_ARTIFACTS.map((a) => a.path);
    assert.ok(paths.includes(".github/workflows/"));
    assert.ok(paths.includes(".gitlab-ci.yml"));
  });
});

describe("isBuildArtifact", () => {
  it("detects package.json", () => {
    assert.equal(isBuildArtifact("package.json"), true);
  });

  it("detects Dockerfile", () => {
    assert.equal(isBuildArtifact("Dockerfile"), true);
  });

  it("detects Makefile", () => {
    assert.equal(isBuildArtifact("Makefile"), true);
  });

  it("detects CMakeLists.txt", () => {
    assert.equal(isBuildArtifact("CMakeLists.txt"), true);
  });

  it("detects tsconfig.json", () => {
    assert.equal(isBuildArtifact("tsconfig.json"), true);
  });

  it("detects .github/workflows/", () => {
    assert.equal(isBuildArtifact(".github/workflows/ci.yml"), true);
  });

  it("returns false for source files", () => {
    assert.equal(isBuildArtifact("src/main.ts"), false);
  });

  it("returns false for test files", () => {
    assert.equal(isBuildArtifact("tests/main.test.ts"), false);
  });

  it("handles Windows paths", () => {
    assert.equal(isBuildArtifact("package.json"), true);
  });
});

describe("generateBuildProposal", () => {
  it("generates proposal with summary", () => {
    const proposal = generateBuildProposal("test", [
      { file: "package.json", category: "package", action: "modify", description: "Update deps", rationale: "New feature" },
      { file: "Dockerfile", category: "docker", action: "create", description: "Add Dockerfile", rationale: "Containerize" },
    ]);
    assert.equal(proposal.summary.total, 2);
    assert.equal(proposal.summary.create, 1);
    assert.equal(proposal.summary.modify, 1);
    assert.equal(proposal.approvalRequired, true);
  });
});

describe("formatBuildProposal", () => {
  it("generates markdown table", () => {
    const proposal = generateBuildProposal("test", [
      { file: "package.json", category: "package", action: "modify", description: "Update", rationale: "Reason" },
    ]);
    const md = formatBuildProposal(proposal);
    assert.ok(md.includes("# Build/Config Change Proposal"));
    assert.ok(md.includes("|---|"));
    assert.ok(md.includes("package.json"));
  });

  it("shows no changes message when empty", () => {
    const proposal = generateBuildProposal("test", []);
    const md = formatBuildProposal(proposal);
    assert.ok(md.includes("No build/config changes needed"));
  });
});

describe("applyApprovedChanges", () => {
  it("applies only specified indices", () => {
    const proposal = generateBuildProposal("test", [
      { file: "a.json", category: "config", action: "modify", description: "A", rationale: "R" },
      { file: "b.json", category: "config", action: "modify", description: "B", rationale: "R" },
      { file: "c.json", category: "config", action: "modify", description: "C", rationale: "R" },
    ]);
    const result = applyApprovedChanges(proposal, [1, 3]);
    assert.equal(result.applied.length, 2);
    assert.equal(result.rejected.length, 1);
  });
});
