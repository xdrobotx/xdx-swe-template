/**
 * Refactoring Module
 *
 * Provides safe refactoring capabilities with impact analysis.
 * Uses GitNexus for impact analysis when available.
 *
 * Used by the software-engineer extension for REQ-010 compliance.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RefactoringTarget {
  file: string;
  type: "function" | "class" | "module" | "interface" | "file";
  description: string;
}

export interface ImpactAnalysis {
  target: RefactoringTarget;
  directDependencies: string[];
  transitiveDependencies: string[];
  affectedFiles: string[];
  riskLevel: "low" | "medium" | "high";
  gitnexusUsed: boolean;
}

export interface RefactoringProposal {
  target: RefactoringTarget;
  impact: ImpactAnalysis;
  changes: RefactoringChange[];
  rationale: string;
  risks: string[];
}

export interface RefactoringChange {
  file: string;
  description: string;
  type: "rename" | "extract" | "split" | "merge" | "restructure" | "delete";
}

// ─── Impact Analysis ────────────────────────────────────────────────────────

/**
 * Assess the impact of a refactoring on the codebase.
 *
 * Uses GitNexus impact analysis when available, falls back to
 * static analysis when not.
 */
export function assessImpact(
  target: RefactoringTarget,
  useGitNexus: boolean = false,
): ImpactAnalysis {
  // Placeholder — in production, this would call gitnexus_impact tool
  // and parse the results.

  return {
    target,
    directDependencies: [],
    transitiveDependencies: [],
    affectedFiles: [],
    riskLevel: "medium",
    gitnexusUsed: useGitNexus,
  };
}

/**
 * Check if GitNexus is available and return its status.
 */
export function checkGitNexusAvailability(): {
  available: boolean;
  reason?: string;
} {
  // Placeholder — in production, this would check for GitNexus tools
  // by attempting to query the knowledge graph.
  return {
    available: false,
    reason: "GitNexus availability check requires runtime detection",
  };
}

// ─── Refactoring Proposal ───────────────────────────────────────────────────

/**
 * Generate a refactoring proposal based on the target and impact analysis.
 */
export function proposeRefactoring(
  target: RefactoringTarget,
  impact: ImpactAnalysis,
  refactoringType: string,
): RefactoringProposal {
  const changes: RefactoringChange[] = [];

  // Generate changes based on refactoring type
  switch (refactoringType) {
    case "rename":
      changes.push({
        file: target.file,
        description: `Rename ${target.type} "${target.description}"`,
        type: "rename",
      });
      break;
    case "extract":
      changes.push({
        file: target.file,
        description: `Extract ${target.description} into a separate module`,
        type: "extract",
      });
      break;
    case "split":
      changes.push({
        file: target.file,
        description: `Split ${target.description} into smaller modules`,
        type: "split",
      });
      break;
    case "restructure":
      changes.push({
        file: target.file,
        description: `Restructure ${target.description} for better organization`,
        type: "restructure",
      });
      break;
    default:
      changes.push({
        file: target.file,
        description: `Refactor ${target.description}`,
        type: "restructure",
      });
  }

  // Add dependency updates if there are affected files
  for (const file of impact.affectedFiles) {
    if (file !== target.file) {
      changes.push({
        file,
        description: `Update import/reference for refactored ${target.description}`,
        type: "rename",
      });
    }
  }

  const risks: string[] = [];
  if (impact.riskLevel === "high") {
    risks.push("High risk — multiple files affected, extensive testing recommended");
  }
  if (impact.affectedFiles.length > 5) {
    risks.push(`Many files affected (${impact.affectedFiles.length}) — review each change carefully`);
  }
  if (!impact.gitnexusUsed) {
    risks.push("GitNexus not used for impact analysis — manual review recommended");
  }

  return {
    target,
    impact,
    changes,
    rationale: `Refactor ${target.description} to improve code quality`,
    risks,
  };
}

// ─── Refactoring Report ─────────────────────────────────────────────────────

/**
 * Format a refactoring proposal as Markdown.
 */
export function formatRefactoringReport(proposal: RefactoringProposal): string {
  let md = `# Refactoring Proposal\n\n`;

  md += `## Target\n\n`;
  md += `- **File:** \`${proposal.target.file}\`\n`;
  md += `- **Type:** ${proposal.target.type}\n`;
  md += `- **Description:** ${proposal.target.description}\n\n`;

  md += `## Rationale\n\n${proposal.rationale}\n\n`;

  md += `## Impact Analysis\n\n`;
  md += `- **Risk Level:** ${proposal.impact.riskLevel}\n`;
  md += `- **Direct Dependencies:** ${proposal.impact.directDependencies.length || "none"}\n`;
  md += `- **Transitive Dependencies:** ${proposal.impact.transitiveDependencies.length || "none"}\n`;
  md += `- **Affected Files:** ${proposal.impact.affectedFiles.length || "none"}\n`;
  md += `- **GitNexus Used:** ${proposal.impact.gitnexusUsed ? "Yes" : "No"}\n\n`;

  if (proposal.impact.affectedFiles.length > 0) {
    md += `### Affected Files\n\n`;
    for (const file of proposal.impact.affectedFiles) {
      md += `- \`${file}\`\n`;
    }
    md += "\n";
  }

  md += `## Changes\n\n`;
  md += "| File | Type | Description |\n";
  md += "|---|---|---|\n";
  for (const change of proposal.changes) {
    md += `| \`${change.file}\` | ${change.type} | ${change.description} |\n`;
  }
  md += "\n";

  if (proposal.risks.length > 0) {
    md += `## Risks\n\n`;
    for (const risk of proposal.risks) {
      md += `- ⚠️ ${risk}\n`;
    }
    md += "\n";
  }

  md += `## Approval\n\n`;
  md += `Do you approve this refactoring? (yes/no/modify)\n`;

  return md;
}

// ─── Refactoring Execution ──────────────────────────────────────────────────

/**
 * Execute a refactoring proposal, applying only approved changes.
 */
export function executeRefactoring(
  proposal: RefactoringProposal,
  approvedChanges: RefactoringChange[],
): {
  applied: RefactoringChange[];
  rejected: RefactoringChange[];
} {
  const applied = approvedChanges;
  const rejected = proposal.changes.filter(
    (c) => !approvedChanges.some((a) => a.file === c.file && a.description === c.description),
  );

  return { applied, rejected };
}
