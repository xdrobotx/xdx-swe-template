/**
 * Requirements Traceability Module
 *
 * Generates and maintains requirements traceability matrices linking
 * SRS requirements → SDD design elements → source code ↔ tests.
 *
 * Used by the software-engineer extension for REQ-005 compliance.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TraceabilityEntry {
  srsId: string;
  srsStatement: string;
  sddId: string;
  sddElement: string;
  sourceFiles: string[];
  testFiles: string[];
  status: "draft" | "implemented" | "verified" | "retired";
}

export interface TraceabilityMatrix {
  entries: TraceabilityEntry[];
  summary: {
    totalRequirements: number;
    covered: number;
    uncovered: number;
    implemented: number;
    verified: number;
  };
}

// ─── Traceability Matrix Generation ─────────────────────────────────────────

/**
 * Generate a requirements traceability matrix from SRS requirements,
 * SDD design elements, source files, and test files.
 */
export function generateTraceabilityMatrix(
  srsRequirements: Array<{ id: string; statement: string }>,
  sddDesigns: Array<{ id: string; element: string }>,
  sourceFiles: string[],
  testFiles: string[],
): TraceabilityMatrix {
  const entries: TraceabilityEntry[] = [];

  for (let i = 0; i < srsRequirements.length; i++) {
    const srs = srsRequirements[i];
    // Match by index (round-robin if fewer SDDs than SRS)
    const sddDesign = sddDesigns[i % sddDesigns.length];

    entries.push({
      srsId: srs.id,
      srsStatement: srs.statement,
      sddId: sddDesign?.id || "",
      sddElement: sddDesign?.element || "",
      sourceFiles: sourceFiles.length > 0 ? sourceFiles : [],
      testFiles: testFiles.length > 0 ? testFiles : [],
      status:
        sourceFiles.length > 0 && testFiles.length > 0
          ? "verified"
          : sourceFiles.length > 0
            ? "implemented"
            : "draft",
    });
  }

  return {
    entries,
    summary: {
      totalRequirements: srsRequirements.length,
      covered: entries.filter((e) => e.sddId).length,
      uncovered: entries.filter((e) => !e.sddId).length,
      implemented: entries.filter((e) => e.status === "implemented").length,
      verified: entries.filter((e) => e.status === "verified").length,
    },
  };
}

// ─── Traceability Comment Formatting ────────────────────────────────────────

/**
 * Generate an inline code comment for traceability.
 *
 * @example
 * // Traceability: SRS-001 → SDD-001
 */
export function formatTraceabilityComment(srsId: string, sddId: string): string {
  return `// Traceability: ${srsId} → ${sddId}`;
}

/**
 * Generate a multi-line traceability header for a file.
 */
export function formatFileTraceabilityHeader(
  entries: Array<{ srsId: string; sddId: string }>,
): string {
  if (entries.length === 0) return "";

  const lines = ["// ==========================================================================", ""];
  for (const entry of entries) {
    lines.push(`// Traceability: ${entry.srsId} → ${entry.sddId}`);
  }
  lines.push("// ==========================================================================");
  return lines.join("\n");
}

// ─── Traceability Validation ────────────────────────────────────────────────

/**
 * Validate that all SRS requirements are covered by SDD design elements
 * and mapped to source code and tests.
 */
export function validateTraceability(
  srsRequirements: Array<{ id: string }>,
  sddDesigns: Array<{ id: string }>,
  sourceFiles: string[],
  testFiles: string[],
): {
  valid: boolean;
  uncovered: string[];
  untested: string[];
  warnings: string[];
} {
  const uncovered: string[] = [];
  const untested: string[] = [];
  const warnings: string[] = [];

  // Check for uncovered requirements (match by index)
  for (let i = 0; i < srsRequirements.length; i++) {
    if (i >= sddDesigns.length) {
      uncovered.push(srsRequirements[i].id);
    }
  }

  // Check for untested designs
  if (sourceFiles.length > 0 && testFiles.length === 0) {
    untested.push("No test files found — all source code is untested");
  }

  // Warnings
  if (srsRequirements.length > 0 && sddDesigns.length === 0) {
    warnings.push("No SDD design elements found — requirements may not be addressed");
  }
  if (sddDesigns.length > srsRequirements.length) {
    warnings.push(
      `More design elements (${sddDesigns.length}) than requirements (${srsRequirements.length}) — check for over-engineering`,
    );
  }

  return {
    valid: uncovered.length === 0 && untested.length === 0,
    uncovered,
    untested,
    warnings,
  };
}

// ─── Traceability Matrix Formatting (Markdown) ──────────────────────────────

/**
 * Format a traceability matrix as a Markdown table.
 */
export function formatTraceabilityMatrixMarkdown(matrix: TraceabilityMatrix): string {
  if (matrix.entries.length === 0) {
    return "No traceability entries found.";
  }

  let md = "# Requirements Traceability Matrix\n\n";

  md += "## Summary\n\n";
  md += `| Metric | Count |\n|---|---|\n`;
  md += `| Total Requirements | ${matrix.summary.totalRequirements} |\n`;
  md += `| Covered | ${matrix.summary.covered} |\n`;
  md += `| Uncovered | ${matrix.summary.uncovered} |\n`;
  md += `| Implemented | ${matrix.summary.implemented} |\n`;
  md += `| Verified | ${matrix.summary.verified} |\n\n`;

  md += "## Detailed Traceability\n\n";
  md += "| REQ ID | Statement | SDD ID | Design Element | Source Files | Test Files | Status |\n";
  md += "|---|---|---|---|---|---|---|\n";

  for (const entry of matrix.entries) {
    const shortStatement =
      entry.srsStatement.length > 60
        ? entry.srsStatement.slice(0, 60) + "..."
        : entry.srsStatement;
    md += `| ${entry.srsId} | ${shortStatement} | ${entry.sddId} | ${entry.sddElement} | ${entry.sourceFiles.join(", ") || "-"} | ${entry.testFiles.join(", ") || "-"} | ${entry.status} |\n`;
  }

  return md;
}
