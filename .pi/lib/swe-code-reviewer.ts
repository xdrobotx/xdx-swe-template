/**
 * Code Review Module
 *
 * Provides self-review capabilities and interactive review sessions
 * with staged editing (propose → approve → apply).
 *
 * Used by the software-engineer extension for REQ-009 compliance.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReviewFinding {
  category: "style" | "logic" | "security" | "performance" | "testability" | "maintainability";
  severity: "critical" | "warning" | "info";
  file: string;
  line?: number;
  description: string;
  suggestion: string;
}

export interface ReviewReport {
  topic: string;
  findings: ReviewFinding[];
  summary: {
    total: number;
    critical: number;
    warnings: number;
    info: number;
  };
}

export interface ReviewEdit {
  file: string;
  description: string;
  approved: boolean;
}

// ─── Self-Review Checklists ─────────────────────────────────────────────────

/**
 * Self-review checklist categories used by the agent for internal review.
 */
export const REVIEW_CHECKLIST: Array<{
  category: ReviewFinding["category"];
  questions: string[];
}> = [
  {
    category: "style",
    questions: [
      "Does the code follow the project's naming conventions?",
      "Are functions/methods single-purpose and well-named?",
      "Is the code properly formatted and indented?",
      "Are there any magic numbers or strings that should be constants?",
    ],
  },
  {
    category: "logic",
    questions: [
      "Are all edge cases handled?",
      "Are there any potential null/undefined issues?",
      "Is the control flow clear and correct?",
      "Are there any infinite loops or unbounded recursion?",
    ],
  },
  {
    category: "security",
    questions: [
      "Is user input validated and sanitized?",
      "Are there any potential injection vulnerabilities?",
      "Is sensitive data handled securely?",
      "Are dependencies up to date and free of known vulnerabilities?",
    ],
  },
  {
    category: "performance",
    questions: [
      "Are there any O(n²) or worse algorithms where O(n) suffices?",
      "Is memory usage reasonable?",
      "Are there unnecessary re-renders or recomputations?",
      "Are database queries optimized?",
    ],
  },
  {
    category: "testability",
    questions: [
      "Is the code easily testable (separation of concerns)?",
      "Are there any hard dependencies that mock would need?",
      "Are test fixtures clear and representative?",
    ],
  },
  {
    category: "maintainability",
    questions: [
      "Is the code well-documented where needed?",
      "Are there any code smells (long functions, large classes)?",
      "Is error handling consistent and informative?",
      "Are there any TODOs or FIXMEs that should be addressed?",
    ],
  },
];

// ─── Self-Review Generation ─────────────────────────────────────────────────

/**
 * Generate a self-review report for code.
 * In production, the subagent would analyze the actual code.
 */
export function selfReview(
  code: string,
  fileName: string,
): ReviewReport {
  const findings: ReviewFinding[] = [];

  // Placeholder analysis — in production, the subagent performs real analysis
  // For now, returns a template report structure

  return {
    topic: fileName,
    findings,
    summary: {
      total: 0,
      critical: 0,
      warnings: 0,
      info: 0,
    },
  };
}

// ─── Review Report Formatting ───────────────────────────────────────────────

/**
 * Format a review report as Markdown.
 */
export function formatReviewReport(report: ReviewReport): string {
  let md = `# Code Review: ${report.topic}\n\n`;

  md += "## Summary\n\n";
  md += `- **Total findings:** ${report.summary.total}\n`;
  md += `- **Critical:** ${report.summary.critical}\n`;
  md += `- **Warnings:** ${report.summary.warnings}\n`;
  md += `- **Info:** ${report.summary.info}\n\n`;

  if (report.findings.length === 0) {
    md += "No issues found. Code looks good! ✅\n";
    return md;
  }

  // Group by severity
  const bySeverity: Record<string, ReviewFinding[]> = {
    critical: [],
    warning: [],
    info: [],
  };
  for (const finding of report.findings) {
    bySeverity[finding.severity].push(finding);
  }

  for (const [severity, findings] of Object.entries(bySeverity)) {
    if (findings.length === 0) continue;

    const icon = severity === "critical" ? "🔴" : severity === "warning" ? "🟡" : "🟢";
    md += `### ${icon} ${severity.toUpperCase()} (${findings.length})\n\n`;

    for (const finding of findings) {
      md += `#### ${finding.category} — ${finding.description}\n\n`;
      md += `- **File:** \`${finding.file}${finding.line ? `:${finding.line}` : ""}\`\n`;
      md += `- **Suggestion:** ${finding.suggestion}\n\n`;
    }
  }

  return md;
}

// ─── Staged Editing ─────────────────────────────────────────────────────────

/**
 * Generate a staged edit proposal for user review.
 * Each edit must be approved by the user before application.
 */
export function proposeReviewEdits(
  report: ReviewReport,
): ReviewEdit[] {
  const edits: ReviewEdit[] = [];

  for (const finding of report.findings) {
    if (finding.severity === "critical") {
      edits.push({
        file: finding.file,
        description: `[${finding.severity.toUpperCase()}] ${finding.category}: ${finding.description} — ${finding.suggestion}`,
        approved: false, // Must be approved
      });
    } else if (finding.severity === "warning") {
      edits.push({
        file: finding.file,
        description: `[${finding.severity.toUpperCase()}] ${finding.category}: ${finding.description} — ${finding.suggestion}`,
        approved: false, // Must be approved
      });
    } else {
      // Info-level: auto-approve, but still show to user
      edits.push({
        file: finding.file,
        description: `[${finding.severity.toUpperCase()}] ${finding.category}: ${finding.description}`,
        approved: true,
      });
    }
  }

  return edits;
}

/**
 * Apply only the user-approved review edits.
 */
export function applyReviewEdits(
  edits: ReviewEdit[],
  approvedOnly: boolean = true,
): ReviewEdit[] {
  return approvedOnly
    ? edits.filter((e) => e.approved)
    : edits;
}

// ─── Review Dialogue Integration ────────────────────────────────────────────

/**
 * Build the system prompt for an interactive review dialogue.
 */
export function buildReviewDialoguePrompt(
  topic: string,
  report: ReviewReport,
): string {
  let prompt = `# Code Review Session

You are conducting a code review for: ${topic}

## Review Findings

${formatReviewReport(report)}

## Guidelines

1. Present findings to the user in digestible chunks
2. Explain the rationale for each finding
3. Propose specific fixes for critical and warning findings
4. Accept user decisions: approve, reject, or modify each fix
5. Track all approved changes for application

## Output Format

For each finding:
1. State the issue clearly
2. Show the current code (if applicable)
3. Propose a fix
4. Ask the user: "Approve this fix? (yes/no/modify)"

`;

  return prompt;
}
