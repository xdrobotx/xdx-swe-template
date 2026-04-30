import { describe, it } from "node:test";
import assert from "node:assert";
import {
  generateTraceabilityMatrix,
  formatTraceabilityComment,
  formatFileTraceabilityHeader,
  validateTraceability,
  formatTraceabilityMatrixMarkdown,
} from "../../lib/swe-traceability.js";

describe("generateTraceabilityMatrix", () => {
  it("generates entries for each requirement", () => {
    const srs = [
      { id: "REQ-001", statement: "System shall authenticate users" },
      { id: "REQ-002", statement: "System shall authorize roles" },
    ];
    const sdd = [
      { id: "SDD-001", element: "AuthModule" },
      { id: "SDD-002", element: "AuthzModule" },
    ];
    const result = generateTraceabilityMatrix(srs, sdd, ["src/auth.ts"], ["tests/auth.test.ts"]);
    assert.equal(result.entries.length, 2);
    assert.equal(result.entries[0].srsId, "REQ-001");
    assert.equal(result.entries[1].sddElement, "AuthzModule");
  });

  it("tracks summary counts", () => {
    const srs = [
      { id: "REQ-001", statement: "Test" },
      { id: "REQ-002", statement: "Test" },
      { id: "REQ-003", statement: "Test" },
    ];
    const sdd = [{ id: "SDD-001", element: "Mod" }];
    const result = generateTraceabilityMatrix(srs, sdd, ["src/main.ts"], []);
    assert.equal(result.summary.totalRequirements, 3);
    // Round-robin: all 3 requirements get matched (to SDD-001)
    assert.equal(result.summary.covered, 3);
    assert.equal(result.summary.uncovered, 0);
  });

  it("marks status based on files present", () => {
    const result = generateTraceabilityMatrix(
      [{ id: "REQ-001", statement: "Test" }],
      [{ id: "SDD-001", element: "Mod" }],
      ["src/main.ts"],
      ["tests/main.test.ts"],
    );
    assert.equal(result.entries[0].status, "verified");
  });
});

describe("formatTraceabilityComment", () => {
  it("generates traceability comment", () => {
    const comment = formatTraceabilityComment("REQ-001", "SDD-001");
    assert.equal(comment, "// Traceability: REQ-001 → SDD-001");
  });
});

describe("formatFileTraceabilityHeader", () => {
  it("generates multi-line header", () => {
    const entries = [
      { srsId: "REQ-001", sddId: "SDD-001" },
      { srsId: "REQ-002", sddId: "SDD-002" },
    ];
    const header = formatFileTraceabilityHeader(entries);
    assert.ok(header.includes("REQ-001"));
    assert.ok(header.includes("REQ-002"));
    assert.ok(header.includes("Traceability:"));
  });

  it("returns empty string for no entries", () => {
    assert.equal(formatFileTraceabilityHeader([]), "");
  });
});

describe("validateTraceability", () => {
  it("detects uncovered requirements", () => {
    const result = validateTraceability(
      [{ id: "REQ-001" }, { id: "REQ-002" }],
      [{ id: "SDD-001" }],
      ["src/main.ts"],
      ["tests/main.test.ts"],
    );
    assert.equal(result.valid, false);
    assert.ok(result.uncovered.includes("REQ-002"));
  });

  it("detects untested code", () => {
    const result = validateTraceability(
      [{ id: "REQ-001" }],
      [{ id: "SDD-001" }],
      ["src/main.ts"],
      [],
    );
    assert.equal(result.valid, false);
    assert.ok(result.untested.length > 0);
  });

  it("returns valid when all covered and tested", () => {
    const result = validateTraceability(
      [{ id: "REQ-001" }],
      [{ id: "SDD-001" }],
      ["src/main.ts"],
      ["tests/main.test.ts"],
    );
    assert.equal(result.valid, true);
  });

  it("generates warnings for over-engineering", () => {
    const result = validateTraceability(
      [{ id: "REQ-001" }],
      [{ id: "SDD-001" }, { id: "SDD-002" }, { id: "SDD-003" }],
      ["src/main.ts"],
      ["tests/main.test.ts"],
    );
    assert.ok(result.warnings.some((w) => w.includes("over-engineering")));
  });
});

describe("formatTraceabilityMatrixMarkdown", () => {
  it("generates markdown table", () => {
    const matrix = generateTraceabilityMatrix(
      [{ id: "REQ-001", statement: "Authenticate users" }],
      [{ id: "SDD-001", element: "Auth" }],
      ["src/auth.ts"],
      ["tests/auth.test.ts"],
    );
    const md = formatTraceabilityMatrixMarkdown(matrix);
    assert.ok(md.includes("# Requirements Traceability Matrix"));
    assert.ok(md.includes("REQ-001"));
    assert.ok(md.includes("SDD-001"));
    assert.ok(md.includes("|---|"));
  });

  it("returns message for empty matrix", () => {
    const md = formatTraceabilityMatrixMarkdown({
      entries: [],
      summary: { totalRequirements: 0, covered: 0, uncovered: 0, implemented: 0, verified: 0 },
    });
    assert.equal(md, "No traceability entries found.");
  });
});
