import { describe, it } from "node:test";
import assert from "node:assert";
import {
  detectProjectLanguage,
  DEV_TOOLS,
  detectAvailableTools,
  proposeToolchain,
  getToolCommand,
  formatToolchainProposal,
} from "../../lib/swe-language-tools.js";

describe("detectProjectLanguage", () => {
  it("detects TypeScript", () => {
    const langs = detectProjectLanguage(["src/main.ts", "src/util.ts", "tests/test.ts"]);
    assert.equal(langs.length, 1);
    assert.equal(langs[0].name, "TypeScript");
    assert.equal(langs[0].primary, true);
  });

  it("detects Python", () => {
    const langs = detectProjectLanguage(["src/main.py", "src/util.py"]);
    assert.equal(langs[0].name, "Python");
  });

  it("detects Rust", () => {
    const langs = detectProjectLanguage(["src/main.rs"]);
    assert.equal(langs[0].name, "Rust");
  });

  it("detects multiple languages", () => {
    const langs = detectProjectLanguage([
      "src/main.ts", "src/util.ts",
      "src/app.py",
    ]);
    assert.ok(langs.length >= 2);
    assert.equal(langs[0].primary, true);
  });

  it("returns empty for unknown files", () => {
    const langs = detectProjectLanguage(["file.unknown", "data.txt"]);
    assert.equal(langs.length, 0);
  });
});

describe("DEV_TOOLS", () => {
  it("has tools registered", () => {
    assert.ok(DEV_TOOLS.length > 0);
  });

  it("has tools for TypeScript", () => {
    const tsTools = DEV_TOOLS.filter((t) => t.supportedLanguages.includes("typescript"));
    assert.ok(tsTools.length > 0);
  });

  it("has tools for Python", () => {
    const pyTools = DEV_TOOLS.filter((t) => t.supportedLanguages.includes("python"));
    assert.ok(pyTools.length > 0);
  });

  it("has tools for Rust", () => {
    const rustTools = DEV_TOOLS.filter((t) => t.supportedLanguages.includes("rust"));
    assert.ok(rustTools.length > 0);
  });

  it("has tools for Go", () => {
    const goTools = DEV_TOOLS.filter((t) => t.supportedLanguages.includes("go"));
    assert.ok(goTools.length > 0);
  });
});

describe("detectAvailableTools", () => {
  it("returns tools for TypeScript", () => {
    const tools = detectAvailableTools("typescript");
    assert.ok(tools.length > 0);
    for (const tool of tools) {
      assert.ok(tool.supportedLanguages.includes("typescript"));
    }
  });

  it("returns empty for unknown language", () => {
    const tools = detectAvailableTools("unknown");
    assert.equal(tools.length, 0);
  });
});

describe("proposeToolchain", () => {
  it("proposes tools for TypeScript", () => {
    const chain = proposeToolchain([{ name: "TypeScript", extensions: [".ts"], primary: true }]);
    assert.ok(chain.language.name === "TypeScript");
    assert.ok(chain.recommended.length > 0 || chain.missing.length > 0);
  });

  it("proposes tools for Python", () => {
    const chain = proposeToolchain([{ name: "Python", extensions: [".py"], primary: true }]);
    assert.ok(chain.language.name === "Python");
  });

  it("proposes tools for Rust", () => {
    const chain = proposeToolchain([{ name: "Rust", extensions: [".rs"], primary: true }]);
    assert.ok(chain.language.name === "Rust");
  });
});

describe("getToolCommand", () => {
  it("generates command string", () => {
    const tool = DEV_TOOLS.find((t) => t.name === "ESLint")!;
    const cmd = getToolCommand(tool, ["src/main.ts"]);
    assert.ok(cmd.includes("eslint"));
    assert.ok(cmd.includes("src/main.ts"));
  });
});

describe("formatToolchainProposal", () => {
  it("generates markdown proposal", () => {
    const chain = proposeToolchain([{ name: "TypeScript", extensions: [".ts"], primary: true }]);
    const md = formatToolchainProposal(chain);
    assert.ok(md.includes("# Toolchain Proposal"));
    assert.ok(md.includes("TypeScript"));
  });
});
