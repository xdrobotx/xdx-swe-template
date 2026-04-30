/**
 * Software Detailed Design (SDD) Generator
 *
 * Generates detailed design documents from the Systems Engineer's output
 * (SRS + system design). Produces module breakdowns, interface specifications,
 * and traceability matrices.
 *
 * Used by the software-engineer extension for REQ-002 compliance.
 */

import {
  generateTraceabilityMatrix,
  formatTraceabilityMatrixMarkdown,
  type TraceabilityEntry,
} from "./swe-traceability.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SDDModule {
  id: string;
  name: string;
  description: string;
  responsibility: string;
  interfaces: SDDInterface[];
  dependencies: string[];
  dataStructures: SDDDataStructure[];
  algorithms: SDDAlgorithm[];
}

export interface SDDInterface {
  name: string;
  type: "function" | "class" | "interface" | "module" | "api";
  signature: string;
  description: string;
  parameters: Array<{ name: string; type: string; description: string }>;
  returns: { type: string; description: string };
}

export interface SDDDataStructure {
  name: string;
  type: "struct" | "class" | "enum" | "interface" | "type";
  fields: Array<{ name: string; type: string; description: string }>;
  description: string;
}

export interface SDDAlgorithm {
  name: string;
  description: string;
  inputs: Array<{ name: string; type: string }>;
  outputs: Array<{ name: string; type: string }>;
  complexity: string;
  steps: string[];
}

export interface SDDDocument {
  title: string;
  version: string;
  topic: string;
  modules: SDDModule[];
  interfaces: SDDInterface[];
  dataStructures: SDDDataStructure[];
  traceability: TraceabilityEntry[];
  diagrams: string[]; // Mermaid diagram strings
  implementationNotes: string[];
}

// ─── SDD Generation ─────────────────────────────────────────────────────────

/**
 * Generate a Software Detailed Design (SDD) document from SRS requirements
 * and system design input.
 *
 * @param srsRequirements - Array of SRS requirements
 * @param systemDesign - System design description
 * @param topic - The topic being designed
 * @returns SDDDocument ready for markdown formatting
 */
export function generateSDD(
  srsRequirements: Array<{ id: string; statement: string }>,
  systemDesign: {
    description: string;
    components: Array<{ name: string; responsibility: string }>;
  },
  topic: string,
): SDDDocument {
  const modules: SDDModule[] = [];
  const interfaces: SDDInterface[] = [];
  const dataStructures: SDDDataStructure[] = [];
  const diagrams: string[] = [];
  const implementationNotes: string[] = [];

  // Generate modules from system design components
  for (let i = 0; i < systemDesign.components.length; i++) {
    const component = systemDesign.components[i];
    const moduleId = `SDD-MOD-${String(i + 1).padStart(3, "0")}`;

    modules.push({
      id: moduleId,
      name: component.name,
      description: component.responsibility,
      responsibility: component.responsibility,
      interfaces: [],
      dependencies: [],
      dataStructures: [],
      algorithms: [],
    });
  }

  // Assign requirements to modules (round-robin for initial mapping)
  const traceabilityEntries: TraceabilityEntry[] = [];
  for (let i = 0; i < srsRequirements.length; i++) {
    const req = srsRequirements[i];
    const moduleIndex = i % modules.length;
    const sddId = modules[moduleIndex]?.id || "";

    traceabilityEntries.push({
      srsId: req.id,
      srsStatement: req.statement,
      sddId,
      sddElement: modules[moduleIndex]?.name || "",
      sourceFiles: [],
      testFiles: [],
      status: "draft",
    });
  }

  // Generate architecture diagram
  if (modules.length > 0) {
    diagrams.push(generateArchitectureDiagram(modules));
  }

  return {
    title: `Software Detailed Design: ${topic}`,
    version: "1.0",
    topic,
    modules,
    interfaces,
    dataStructures,
    traceability: traceabilityEntries,
    diagrams,
    implementationNotes,
  };
}

// ─── Module Breakdown ───────────────────────────────────────────────────────

/**
 * Decompose a system design into modules with responsibilities.
 */
export function generateModuleBreakdown(
  systemDesign: string,
  topic: string,
): Array<{ id: string; name: string; responsibility: string }> {
  // This is a placeholder — in production, the subagent would parse
  // the system design and extract components.
  // For now, returns a structured template.
  return [
    {
      id: "SDD-MOD-001",
      name: "Core Domain",
      responsibility: `Core domain logic for ${topic}`,
    },
    {
      id: "SDD-MOD-002",
      name: "Application Services",
      responsibility: `Application services and use cases for ${topic}`,
    },
    {
      id: "SDD-MOD-003",
      name: "Infrastructure",
      responsibility: `Infrastructure layer (data access, external services)`,
    },
    {
      id: "SDD-MOD-004",
      name: "API Layer",
      responsibility: `API interfaces and contracts`,
    },
  ];
}

// ─── Interface Specification ────────────────────────────────────────────────

/**
 * Generate interface specifications for a module.
 */
export function generateInterfaceSpecs(
  moduleName: string,
  moduleResponsibility: string,
): SDDInterface[] {
  // Placeholder — actual generation happens in the subagent
  return [
    {
      name: `${moduleName}Service`,
      type: "class",
      signature: `class ${moduleName}Service`,
      description: `Service interface for ${moduleResponsibility}`,
      parameters: [],
      returns: { type: "void", description: "N/A" },
    },
  ];
}

// ─── Diagram Generation ─────────────────────────────────────────────────────

/**
 * Generate a Mermaid architecture diagram from modules.
 */
export function generateArchitectureDiagram(modules: SDDModule[]): string {
  if (modules.length === 0) return "";

  let diagram = "```mermaid\ngraph TD\n";

  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    const nodeId = `M${i}`;
    diagram += `    ${nodeId}[${module.name}]\n`;

    if (i > 0) {
      diagram += `    M${i - 1} --> ${nodeId}\n`;
    }
  }

  diagram += "```\n";
  return diagram;
}

/**
 * Generate a Mermaid sequence diagram for module interactions.
 */
export function generateSequenceDiagram(
  modules: SDDModule[],
  flow: string[],
): string {
  if (modules.length === 0 || flow.length === 0) return "";

  let diagram = "```mermaid\nsequenceDiagram\n";

  for (let i = 0; i < flow.length - 1; i++) {
    const from = modules.find((m) => m.name === flow[i])?.name || flow[i];
    const to = modules.find((m) => m.name === flow[i + 1])?.name || flow[i + 1];
    diagram += `    ${from}->>${to}: ${flow[i + 1]}\n`;
  }

  diagram += "```\n";
  return diagram;
}

// ─── SDD Markdown Formatting ────────────────────────────────────────────────

/**
 * Format an SDDDocument as a complete Markdown document.
 */
export function formatSDDMarkdown(sdd: SDDDocument): string {
  let md = `# ${sdd.title}\n\n`;
  md += `**Version:** ${sdd.version}  \n`;
  md += `**Topic:** ${sdd.topic}  \n`;
  md += `**Generated:** ${new Date().toISOString().split("T")[0]}  \n\n`;

  // Table of contents
  md += "## Table of Contents\n\n";
  md += "1. [Overview](#overview)\n";
  md += "2. [Module Breakdown](#module-breakdown)\n";
  md += "3. [Interface Specifications](#interface-specifications)\n";
  md += "4. [Data Structures](#data-structures)\n";
  md += "5. [Architecture Diagram](#architecture-diagram)\n";
  md += "6. [Requirements Traceability](#requirements-traceability)\n";
  md += "7. [Implementation Notes](#implementation-notes)\n\n";

  // Overview
  md += "## Overview\n\n";
  md += `This Software Detailed Design (SDD) specifies the implementation-level design for **${sdd.topic}**. `;
  md += `It decomposes the system design into concrete modules, defines interfaces, `;
  md += `and establishes traceability to requirements.\n\n`;

  // Module Breakdown
  md += "## Module Breakdown\n\n";
  md += "| Module ID | Name | Responsibility |\n";
  md += "|---|---|---|\n";
  for (const mod of sdd.modules) {
    md += `| ${mod.id} | ${mod.name} | ${mod.description} |\n`;
  }
  md += "\n";

  for (const mod of sdd.modules) {
    md += `### ${mod.name} (${mod.id})\n\n`;
    md += `**Responsibility:** ${mod.description}\n\n`;
    if (mod.interfaces.length > 0) {
      md += "**Interfaces:**\n\n";
      for (const iface of mod.interfaces) {
        md += `- \`${iface.name}\` (${iface.type}): ${iface.description}\n`;
      }
      md += "\n";
    }
    if (mod.dependencies.length > 0) {
      md += "**Dependencies:** ${mod.dependencies.join(", ")}\n\n";
    }
  }

  // Interface Specifications
  if (sdd.interfaces.length > 0) {
    md += "## Interface Specifications\n\n";
    md += "| Interface | Type | Signature | Description |\n";
    md += "|---|---|---|---|\n";
    for (const iface of sdd.interfaces) {
      md += `| ${iface.name} | ${iface.type} | \`${iface.signature}\` | ${iface.description} |\n`;
    }
    md += "\n";
  }

  // Data Structures
  if (sdd.dataStructures.length > 0) {
    md += "## Data Structures\n\n";
    md += "| Name | Type | Description |\n";
    md += "|---|---|---|\n";
    for (const ds of sdd.dataStructures) {
      md += `| ${ds.name} | ${ds.type} | ${ds.description} |\n`;
    }
    md += "\n";
  }

  // Architecture Diagram
  if (sdd.diagrams.length > 0) {
    md += "## Architecture Diagram\n\n";
    for (const diagram of sdd.diagrams) {
      md += `${diagram}\n`;
    }
  }

  // Requirements Traceability
  if (sdd.traceability.length > 0) {
    md += "## Requirements Traceability\n\n";
    md += formatTraceabilityMatrixMarkdown({
      entries: sdd.traceability,
      summary: {
        totalRequirements: sdd.traceability.length,
        covered: sdd.traceability.filter((e) => e.sddId).length,
        uncovered: sdd.traceability.filter((e) => !e.sddId).length,
        implemented: sdd.traceability.filter((e) => e.status === "implemented").length,
        verified: sdd.traceability.filter((e) => e.status === "verified").length,
      },
    });
    md += "\n";
  }

  // Implementation Notes
  if (sdd.implementationNotes.length > 0) {
    md += "## Implementation Notes\n\n";
    for (const note of sdd.implementationNotes) {
      md += `- ${note}\n`;
    }
    md += "\n";
  }

  return md;
}
