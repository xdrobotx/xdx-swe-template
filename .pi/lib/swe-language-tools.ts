/**
 * Language-Specific Development Tools Module
 *
 * Detects project language, available tooling (linters, formatters,
 * type checkers, analyzers), and proposes toolchain setup.
 *
 * Used by the software-engineer extension for REQ-011 and REQ-012 compliance.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LanguageInfo {
  name: string;
  extensions: string[];
  primary: boolean;
}

export interface DevTool {
  name: string;
  category: "linter" | "formatter" | "type-checker" | "analyzer" | "test-runner" | "build-tool";
  command: string;
  args: string;
  description: string;
  supportedLanguages: string[];
}

export interface Toolchain {
  language: LanguageInfo;
  tools: DevTool[];
  missing: string[];
  recommended: string[];
}

// ─── Language Detection ─────────────────────────────────────────────────────

/**
 * Detect the primary language(s) of a project based on file structure.
 */
export function detectProjectLanguage(projectFiles: string[]): LanguageInfo[] {
  const languageMap: Record<string, LanguageInfo> = {
    typescript: {
      name: "TypeScript",
      extensions: [".ts", ".tsx"],
      primary: false,
    },
    javascript: {
      name: "JavaScript",
      extensions: [".js", ".jsx"],
      primary: false,
    },
    python: {
      name: "Python",
      extensions: [".py"],
      primary: false,
    },
    rust: {
      name: "Rust",
      extensions: [".rs"],
      primary: false,
    },
    java: {
      name: "Java",
      extensions: [".java"],
      primary: false,
    },
    cpp: {
      name: "C++",
      extensions: [".cpp", ".hpp", ".cc", ".hh"],
      primary: false,
    },
    c: {
      name: "C",
      extensions: [".c", ".h"],
      primary: false,
    },
    go: {
      name: "Go",
      extensions: [".go"],
      primary: false,
    },
    csharp: {
      name: "C#",
      extensions: [".cs"],
      primary: false,
    },
    ruby: {
      name: "Ruby",
      extensions: [".rb"],
      primary: false,
    },
    php: {
      name: "PHP",
      extensions: [".php"],
      primary: false,
    },
    swift: {
      name: "Swift",
      extensions: [".swift"],
      primary: false,
    },
    kotlin: {
      name: "Kotlin",
      extensions: [".kt", ".kts"],
      primary: false,
    },
  };

  // Count files per language
  const counts: Record<string, number> = {};
  for (const file of projectFiles) {
    const ext = file.split(".").pop()?.toLowerCase();
    if (ext) {
      for (const [lang, info] of Object.entries(languageMap)) {
        if (info.extensions.includes(`.${ext}`)) {
          counts[lang] = (counts[lang] || 0) + 1;
        }
      }
    }
  }

  // Sort by count and mark primary
  const languages = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([lang], index) => ({
      ...languageMap[lang],
      primary: index === 0,
    }));

  return languages.length > 0 ? languages : [];
}

// ─── Available Development Tools Registry ────────────────────────────────────

/**
 * Registry of common development tools across languages.
 */
export const DEV_TOOLS: DevTool[] = [
  // TypeScript/JavaScript
  {
    name: "ESLint",
    category: "linter",
    command: "eslint",
    args: "--fix",
    description: "JavaScript/TypeScript linter",
    supportedLanguages: ["typescript", "javascript"],
  },
  {
    name: "Prettier",
    category: "formatter",
    command: "prettier",
    args: "--write",
    description: "Code formatter",
    supportedLanguages: ["typescript", "javascript", "python"],
  },
  {
    name: "TypeScript Compiler",
    category: "type-checker",
    command: "tsc",
    args: "--noEmit",
    description: "TypeScript type checker",
    supportedLanguages: ["typescript"],
  },
  {
    name: "Vitest",
    category: "test-runner",
    command: "vitest",
    args: "run",
    description: "Unit and integration test runner",
    supportedLanguages: ["typescript", "javascript"],
  },
  {
    name: "Jest",
    category: "test-runner",
    command: "jest",
    args: "--passWithNoTests",
    description: "JavaScript/TypeScript test framework",
    supportedLanguages: ["typescript", "javascript"],
  },
  {
    name: "Vite",
    category: "build-tool",
    command: "vite",
    args: "build",
    description: "Frontend build tool",
    supportedLanguages: ["typescript", "javascript"],
  },

  // Python
  {
    name: "Black",
    category: "formatter",
    command: "black",
    args: ".",
    description: "Python code formatter",
    supportedLanguages: ["python"],
  },
  {
    name: "Ruff",
    category: "linter",
    command: "ruff",
    args: "check --fix",
    description: "Fast Python linter",
    supportedLanguages: ["python"],
  },
  {
    name: "mypy",
    category: "type-checker",
    command: "mypy",
    args: ".",
    description: "Python static type checker",
    supportedLanguages: ["python"],
  },
  {
    name: "pytest",
    category: "test-runner",
    command: "pytest",
    args: ".",
    description: "Python test framework",
    supportedLanguages: ["python"],
  },

  // Rust
  {
    name: "rustfmt",
    category: "formatter",
    command: "rustfmt",
    args: "--check",
    description: "Rust code formatter",
    supportedLanguages: ["rust"],
  },
  {
    name: "clippy",
    category: "linter",
    command: "cargo",
    args: "clippy -- -D warnings",
    description: "Rust linter and style checker",
    supportedLanguages: ["rust"],
  },
  {
    name: "cargo test",
    category: "test-runner",
    command: "cargo",
    args: "test",
    description: "Rust test runner",
    supportedLanguages: ["rust"],
  },
  {
    name: "rust-analyzer",
    category: "analyzer",
    command: "rust-analyzer",
    args: "analyze",
    description: "Rust language server and analyzer",
    supportedLanguages: ["rust"],
  },

  // Go
  {
    name: "gofmt",
    category: "formatter",
    command: "gofmt",
    args: "-w",
    description: "Go code formatter",
    supportedLanguages: ["go"],
  },
  {
    name: "golangci-lint",
    category: "linter",
    command: "golangci-lint",
    args: "run",
    description: "Go linter aggregator",
    supportedLanguages: ["go"],
  },
  {
    name: "go test",
    category: "test-runner",
    command: "go",
    args: "test ./...",
    description: "Go test runner",
    supportedLanguages: ["go"],
  },

  // Java
  {
    name: "Spotless",
    category: "formatter",
    command: "./gradlew",
    args: "spotlessApply",
    description: "Java code formatter (Gradle)",
    supportedLanguages: ["java"],
  },
  {
    name: "Checkstyle",
    category: "linter",
    command: "./gradlew",
    args: "checkstyleMain",
    description: "Java code style checker",
    supportedLanguages: ["java"],
  },
  {
    name: "JUnit",
    category: "test-runner",
    command: "./gradlew",
    args: "test",
    description: "Java test framework",
    supportedLanguages: ["java"],
  },

  // C/C++
  {
    name: "clang-format",
    category: "formatter",
    command: "clang-format",
    args: "-i",
    description: "C/C++ code formatter",
    supportedLanguages: ["cpp", "c"],
  },
  {
    name: "clang-tidy",
    category: "linter",
    command: "clang-tidy",
    args: "--fix",
    description: "C/C++ linter",
    supportedLanguages: ["cpp", "c"],
  },
  {
    name: "CMake",
    category: "build-tool",
    command: "cmake",
    args: "--build .",
    description: "C/C++ build system",
    supportedLanguages: ["cpp", "c"],
  },

  // C#
  {
    name: "dotnet format",
    category: "formatter",
    command: "dotnet",
    args: "format",
    description: "C# code formatter",
    supportedLanguages: ["csharp"],
  },
  {
    name: "dotnet build",
    category: "build-tool",
    command: "dotnet",
    args: "build",
    description: "C# build tool",
    supportedLanguages: ["csharp"],
  },
  {
    name: "xUnit/NUnit",
    category: "test-runner",
    command: "dotnet",
    args: "test",
    description: "C# test framework",
    supportedLanguages: ["csharp"],
  },
];

// ─── Tool Detection ─────────────────────────────────────────────────────────

/**
 * Detect available development tools for a given language.
 * In production, this would check if commands are available on PATH.
 */
export function detectAvailableTools(
  language: string,
): DevTool[] {
  // Return all tools for the language (availability check at runtime)
  return DEV_TOOLS.filter((tool) =>
    tool.supportedLanguages.includes(language),
  );
}

// ─── Toolchain Proposal ─────────────────────────────────────────────────────

/**
 * Propose a toolchain for a project based on detected language.
 */
export function proposeToolchain(
  languages: LanguageInfo[],
  context: {
    projectType: "frontend" | "backend" | "fullstack" | "library" | "embedded" | "cli";
    needsTesting: boolean;
    needsLinting: boolean;
    needsFormatting: boolean;
  } = {
    projectType: "backend",
    needsTesting: true,
    needsLinting: true,
    needsFormatting: true,
  },
): Toolchain {
  if (languages.length === 0) {
    return {
      language: { name: "unknown", extensions: [], primary: false },
      tools: [],
      missing: [],
      recommended: [],
    };
  }

  const primary = languages[0];
  const available = detectAvailableTools(primary.name.toLowerCase());

  const recommended: string[] = [];
  const missing: string[] = [];

  if (context.needsLinting) {
    const linter = available.find((t) => t.category === "linter");
    if (linter) {
      recommended.push(linter.name);
    } else {
      missing.push("linter");
    }
  }

  if (context.needsFormatting) {
    const formatter = available.find((t) => t.category === "formatter");
    if (formatter) {
      recommended.push(formatter.name);
    } else {
      missing.push("formatter");
    }
  }

  if (context.needsTesting) {
    const testRunner = available.find((t) => t.category === "test-runner");
    if (testRunner) {
      recommended.push(testRunner.name);
    } else {
      missing.push("test runner");
    }
  }

  const typeChecker = available.find((t) => t.category === "type-checker");
  if (typeChecker) {
    recommended.push(typeChecker.name);
  }

  return {
    language: primary,
    tools: available,
    missing,
    recommended,
  };
}

// ─── Tool Execution ─────────────────────────────────────────────────────────

/**
 * Generate the command to run a development tool on specific files.
 */
export function getToolCommand(tool: DevTool, files: string[]): string {
  return `${tool.command} ${tool.args} ${files.join(" ")}`;
}

/**
 * Format a toolchain proposal as Markdown.
 */
export function formatToolchainProposal(toolchain: Toolchain): string {
  let md = `# Toolchain Proposal: ${toolchain.language.name}\n\n`;

  md += "## Recommended Tools\n\n";
  for (const tool of toolchain.tools) {
    if (toolchain.recommended.includes(tool.name)) {
      md += `- ✅ **${tool.name}** — ${tool.description} (\`${tool.command} ${tool.args}\`)\n`;
    }
  }

  if (toolchain.missing.length > 0) {
    md += "\n## Missing Tools\n\n";
    for (const missing of toolchain.missing) {
      md += `- ⚠️ ${missing} not found — consider installing\n`;
    }
  }

  md += "\n## All Available Tools\n\n";
  md += "| Tool | Category | Command |\n";
  md += "|---|---|---|\n";
  for (const tool of toolchain.tools) {
    md += `| ${tool.name} | ${tool.category} | \`${tool.command} ${tool.args}\` |\n`;
  }

  return md;
}
