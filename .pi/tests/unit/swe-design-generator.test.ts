import { describe, it } from "node:test";
import assert from "node:assert";
import {
  generateSDD,
  generateModuleBreakdown,
  generateArchitectureDiagram,
  generateSequenceDiagram,
  formatSDDMarkdown,
} from "../../lib/swe-design-generator.js";

describe("generateSDD", () => {
  it("generates modules from system design", () => {
    const sdd = generateSDD(
      [{ id: "REQ-001", statement: "Test" }],
      {
        description: "Test system",
        components: [
          { name: "Core", responsibility: "Core logic" },
          { name: "API", responsibility: "API layer" },
        ],
      },
      "test topic",
    );
    assert.equal(sdd.modules.length, 2);
    assert.ok(sdd.modules[0].id.startsWith("SDD-MOD-"));
  });

  it("generates traceability entries", () => {
    const sdd = generateSDD(
      [
        { id: "REQ-001", statement: "Req 1" },
        { id: "REQ-002", statement: "Req 2" },
        { id: "REQ-003", statement: "Req 3" },
      ],
      {
        description: "Test",
        components: [
          { name: "Mod1", responsibility: "M1" },
          { name: "Mod2", responsibility: "M2" },
        ],
      },
      "topic",
    );
    assert.equal(sdd.traceability.length, 3);
  });

  it("includes architecture diagram", () => {
    const sdd = generateSDD(
      [{ id: "REQ-001", statement: "Test" }],
      {
        description: "Test",
        components: [{ name: "Mod1", responsibility: "M1" }],
      },
      "topic",
    );
    assert.ok(sdd.diagrams.length > 0);
    assert.ok(sdd.diagrams[0].includes("mermaid"));
  });
});

describe("generateModuleBreakdown", () => {
  it("returns 4 default modules", () => {
    const modules = generateModuleBreakdown("test system", "test topic");
    assert.equal(modules.length, 4);
    assert.ok(modules[0].id.startsWith("SDD-MOD-"));
  });
});

describe("generateArchitectureDiagram", () => {
  it("generates mermaid diagram", () => {
    const diagram = generateArchitectureDiagram([
      { id: "M1", name: "Core", description: "Core", interfaces: [], dependencies: [], dataStructures: [], algorithms: [] },
      { id: "M2", name: "API", description: "API", interfaces: [], dependencies: [], dataStructures: [], algorithms: [] },
    ]);
    assert.ok(diagram.includes("mermaid"));
    assert.ok(diagram.includes("Core"));
    assert.ok(diagram.includes("API"));
  });

  it("returns empty string for no modules", () => {
    assert.equal(generateArchitectureDiagram([]), "");
  });
});

describe("generateSequenceDiagram", () => {
  it("generates sequence diagram", () => {
    const modules = [
      { id: "M1", name: "Core", description: "Core", interfaces: [], dependencies: [], dataStructures: [], algorithms: [] },
      { id: "M2", name: "API", description: "API", interfaces: [], dependencies: [], dataStructures: [], algorithms: [] },
    ];
    const diagram = generateSequenceDiagram(modules, ["Core", "API"]);
    assert.ok(diagram.includes("mermaid"));
    assert.ok(diagram.includes("sequenceDiagram"));
  });

  it("returns empty for no modules", () => {
    assert.equal(generateSequenceDiagram([], []), "");
  });
});

describe("formatSDDMarkdown", () => {
  it("generates complete markdown document", () => {
    const sdd = generateSDD(
      [{ id: "REQ-001", statement: "Auth" }],
      {
        description: "Auth system",
        components: [{ name: "AuthModule", responsibility: "Authentication" }],
      },
      "auth system",
    );
    const md = formatSDDMarkdown(sdd);
    assert.ok(md.includes("# Software Detailed Design"));
    assert.ok(md.includes("## Module Breakdown"));
    assert.ok(md.includes("AuthModule"));
    assert.ok(md.includes("## Requirements Traceability"));
  });

  it("includes table of contents", () => {
    const sdd = generateSDD(
      [{ id: "REQ-001", statement: "Test" }],
      {
        description: "Test",
        components: [{ name: "Mod", responsibility: "M" }],
      },
      "topic",
    );
    const md = formatSDDMarkdown(sdd);
    assert.ok(md.includes("## Table of Contents"));
  });
});
