/**
 * Build/Config Change Proposer Module
 *
 * Proposes build and configuration changes with user approval gating.
 * The agent can propose changes but never applies them unilaterally.
 *
 * Used by the software-engineer extension for REQ-008 compliance.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BuildArtifact {
  path: string;
  category: "package" | "docker" | "makefile" | "cmake" | "ci-cd" | "config" | "tooling";
  description: string;
}

export interface BuildChange {
  file: string;
  category: BuildArtifact["category"];
  action: "create" | "modify" | "delete";
  description: string;
  rationale: string;
  proposedContent?: string;
}

export interface BuildProposal {
  topic: string;
  changes: BuildChange[];
  summary: {
    total: number;
    create: number;
    modify: number;
    delete: number;
  };
  approvalRequired: boolean;
}

// ─── Build Artifact Detection ───────────────────────────────────────────────

/**
 * Known build/config file patterns categorized by approval requirement.
 */
export const BUILD_ARTIFACTS: BuildArtifact[] = [
  // Package management
  { path: "package.json", category: "package", description: "Node.js package manifest" },
  { path: "package-lock.json", category: "package", description: "Node.js lock file" },
  { path: "Cargo.toml", category: "package", description: "Rust package manifest" },
  { path: "Cargo.lock", category: "package", description: "Rust lock file" },
  { path: "go.mod", category: "package", description: "Go module definition" },
  { path: "go.sum", category: "package", description: "Go dependency checksums" },
  { path: "pom.xml", category: "package", description: "Maven project configuration" },
  { path: "build.gradle", category: "package", description: "Gradle build configuration" },
  { path: "setup.py", category: "package", description: "Python package setup" },
  { path: "pyproject.toml", category: "package", description: "Python project configuration" },
  { path: "composer.json", category: "package", description: "PHP package manifest" },

  // Docker
  { path: "Dockerfile", category: "docker", description: "Docker container definition" },
  { path: "docker-compose.yml", category: "docker", description: "Docker Compose orchestration" },
  { path: ".dockerignore", category: "docker", description: "Docker ignore patterns" },

  // Make
  { path: "Makefile", category: "makefile", description: "Make build automation" },
  { path: "makefile", category: "makefile", description: "Make build automation (lowercase)" },

  // CMake
  { path: "CMakeLists.txt", category: "cmake", description: "CMake build configuration" },
  { path: "cmake/", category: "cmake", description: "CMake modules directory" },

  // CI/CD
  { path: ".github/workflows/", category: "ci-cd", description: "GitHub Actions workflows" },
  { path: ".gitlab-ci.yml", category: "ci-cd", description: "GitLab CI configuration" },
  { path: "Jenkinsfile", category: "ci-cd", description: "Jenkins pipeline definition" },
  { path: ".travis.yml", category: "ci-cd", description: "Travis CI configuration" },
  { path: "azure-pipelines.yml", category: "ci-cd", description: "Azure DevOps pipeline" },

  // Configuration
  { path: ".eslintrc*", category: "config", description: "ESLint configuration" },
  { path: ".prettierrc*", category: "config", description: "Prettier configuration" },
  { path: "tsconfig.json", category: "config", description: "TypeScript configuration" },
  { path: "jsconfig.json", category: "config", description: "JavaScript configuration" },
  { path: ".editorconfig", category: "config", description: "Editor configuration" },
  { path: ".gitignore", category: "config", description: "Git ignore patterns" },
  { path: ".env", category: "config", description: "Environment variables" },
  { path: ".env.example", category: "config", description: "Environment variables template" },
  { path: "vitest.config.*", category: "config", description: "Vitest test configuration" },
  { path: "jest.config.*", category: "config", description: "Jest test configuration" },
  { path: "vite.config.*", category: "config", description: "Vite build configuration" },
  { path: "webpack.config.*", category: "config", description: "Webpack build configuration" },
  { path: "rollup.config.*", category: "config", description: "Rollup build configuration" },

  // Tooling
  { path: ".rustfmt.toml", category: "tooling", description: "Rust formatter configuration" },
  { path: ".clang-format", category: "tooling", description: "Clang formatter configuration" },
  { path: ".pylintrc", category: "tooling", description: "Python linter configuration" },
];

/**
 * Check if a file path is a build/config artifact that requires approval.
 */
export function isBuildArtifact(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/");

  for (const artifact of BUILD_ARTIFACTS) {
    if (normalizedPath.includes(artifact.path.replace("*", ""))) {
      return true;
    }
  }

  // Check by extension for common config files
  const configExtensions = [
    ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
    ".rc", ".env", ".dockerignore", ".gitignore", ".editorconfig",
  ];
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (ext && configExtensions.includes(`.${ext}`)) {
    // Only flag if it's in a config-related directory or is a known config file
    const configPaths = [
      "config/", "configs/", ".config/", "settings/",
    ];
    if (configPaths.some((p) => normalizedPath.includes(p))) {
      return true;
    }
  }

  return false;
}

// ─── Build Needs Analysis ───────────────────────────────────────────────────

/**
 * Analyze the project to detect what build/config changes might be needed.
 */
export function analyzeBuildNeeds(
  projectRoot: string,
  context: {
    language?: string;
    framework?: string;
    testRunner?: string;
  },
): BuildChange[] {
  const changes: BuildChange[] = [];

  // Placeholder — in production, the subagent would scan the project
  // and detect missing or outdated build configuration.

  return changes;
}

// ─── Build Proposal Generation ──────────────────────────────────────────────

/**
 * Generate a build proposal from a list of changes.
 */
export function generateBuildProposal(
  topic: string,
  changes: BuildChange[],
): BuildProposal {
  return {
    topic,
    changes,
    summary: {
      total: changes.length,
      create: changes.filter((c) => c.action === "create").length,
      modify: changes.filter((c) => c.action === "modify").length,
      delete: changes.filter((c) => c.action === "delete").length,
    },
    approvalRequired: changes.length > 0,
  };
}

// ─── Build Proposal Formatting ──────────────────────────────────────────────

/**
 * Format a build proposal as Markdown for user review.
 */
export function formatBuildProposal(proposal: BuildProposal): string {
  let md = `# Build/Config Change Proposal\n\n`;
  md += `## Topic: ${proposal.topic}\n\n`;

  md += "## Summary\n\n";
  md += `- **Total changes:** ${proposal.summary.total}\n`;
  md += `- **Create:** ${proposal.summary.create}\n`;
  md += `- **Modify:** ${proposal.summary.modify}\n`;
  md += `- **Delete:** ${proposal.summary.delete}\n\n`;

  if (proposal.changes.length === 0) {
    md += "No build/config changes needed. ✅\n";
    return md;
  }

  md += "## Changes\n\n";
  md += "| # | File | Action | Category | Rationale |\n";
  md += "|---|---|---|---|---|\n";

  for (let i = 0; i < proposal.changes.length; i++) {
    const change = proposal.changes[i];
    const actionIcon = change.action === "create" ? "➕" : change.action === "modify" ? "✏️" : "❌";
    md += `| ${i + 1} | \`${change.file}\` | ${actionIcon} ${change.action} | ${change.category} | ${change.rationale} |\n`;
  }

  md += "\n## Approval\n\n";
  md += "Please review the changes above. Specify which changes to approve:\n\n";
  md += "- `approve all` — Apply all changes\n";
  md += "- `approve 1,3,5` — Apply specific changes by number\n";
  md += "- `reject` — Reject all changes\n";
  md += "- `modify N` — Modify a specific change before applying\n";

  return md;
}

// ─── Apply Approved Changes ─────────────────────────────────────────────────

/**
 * Apply only the user-approved changes from a build proposal.
 */
export function applyApprovedChanges(
  proposal: BuildProposal,
  approvedIndices: number[],
): {
  applied: BuildChange[];
  rejected: BuildChange[];
} {
  const applied = proposal.changes.filter((_, i) => approvedIndices.includes(i + 1));
  const rejected = proposal.changes.filter((_, i) => !approvedIndices.includes(i + 1));

  return { applied, rejected };
}
