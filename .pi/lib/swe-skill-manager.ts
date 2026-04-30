/**
 * Software Engineer Skill Manager
 *
 * Manages skill activation, proposal, and workflow selection for the
 * software-engineer extension. Skills provide domain-specific knowledge
 * for different development workflows and architectures.
 *
 * Used by the software-engineer extension for REQ-007 compliance.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Skill {
  name: string;
  label: string;
  description: string;
  tags: string[];
  recommendedFor: string[]; // keywords that suggest this skill
  default: boolean;
}

export interface SkillProposal {
  recommendedSkills: string[];
  reason: string;
  approvalRequired: boolean;
}

// ─── Available Skills Registry ──────────────────────────────────────────────

/**
 * Registry of available skills. Each skill has metadata for automatic
 * matching and manual selection.
 */
export const AVAILABLE_SKILLS: Skill[] = [
  {
    name: "tdd-workflow",
    label: "TDD (Test-Driven Development)",
    description:
      "Test-first workflow: generate tests from design, implement code to satisfy tests, refactor. " +
      "Best for quality-critical code where test coverage is paramount.",
    tags: ["testing", "quality", "iterative", "unit-tests"],
    recommendedFor: ["api", "library", "utility", "core", "data", "algorithm"],
    default: true,
  },
  {
    name: "bdd-workflow",
    label: "BDD (Behavior-Driven Development)",
    description:
      "Behavior-first workflow: define Gherkin scenarios (Given/When/Then), " +
      "implement code to satisfy scenarios. Best for business logic and user-facing features.",
    tags: ["behavior", "scenarios", "user-stories", "acceptance-tests"],
    recommendedFor: ["feature", "user", "business", "workflow", "process"],
    default: false,
  },
  {
    name: "clean-architecture",
    label: "Clean Architecture",
    description:
      "Hexagonal/Clean architecture: separate domain, application, and infrastructure layers. " +
      "Best for complex applications requiring testability and maintainability.",
    tags: ["architecture", "layers", "domain-driven", "hexagonal", "ports-adapters"],
    recommendedFor: ["application", "service", "backend", "microservice", "enterprise"],
    default: false,
  },
  {
    name: "microservices",
    label: "Microservices Architecture",
    description:
      "Microservices patterns: service decomposition, inter-service communication, " +
      "distributed data management, service discovery.",
    tags: ["distributed", "services", "communication", "api-gateway", "event-driven"],
    recommendedFor: ["distributed", "service", "api", "gateway", "event", "message"],
    default: false,
  },
  {
    name: "enterprise-patterns",
    label: "Enterprise Patterns (DDD, CQRS, Event Sourcing)",
    description:
      "Domain-Driven Design, CQRS, Event Sourcing patterns. Best for complex business domains " +
      "with rich domain logic and event-driven architectures.",
    tags: ["ddd", "cqrs", "event-sourcing", "aggregate", "bounded-context"],
    recommendedFor: ["domain", "enterprise", "transaction", "order", "payment", "inventory"],
    default: false,
  },
  {
    name: "agile-scrum",
    label: "Agile/Scrum Workflow",
    description:
      "Sprint-based iterative delivery: break work into stories, implement in sprints, " +
      "deliver incrementally with regular feedback.",
    tags: ["iterative", "sprint", "incremental", "feedback", "user-stories"],
    recommendedFor: ["feature", "application", "product", "user-facing", "web"],
    default: false,
  },
  {
    name: "waterfall",
    label: "Waterfall/Sequential Workflow",
    description:
      "Sequential phase-gate process: requirements → design → implementation → testing → deployment. " +
      "Best for regulated projects with strict phase boundaries.",
    tags: ["sequential", "phased", "gate", "regulated", "documentation"],
    recommendedFor: ["regulated", "safety", "compliance", "certification", "embedded"],
    default: false,
  },
];

// ─── Skill Proposal ─────────────────────────────────────────────────────────

/**
 * Analyze the topic and context to propose appropriate skills.
 * Returns a proposal with recommended skills and reasoning.
 */
export function proposeSkills(
  topic: string,
  context: {
    domain?: string;
    complexity?: "low" | "medium" | "high";
    criticality?: "low" | "medium" | "high";
    existingCode?: boolean;
  } = {},
): SkillProposal {
  const recommendations: string[] = [];
  const reasons: string[] = [];

  const topicLower = topic.toLowerCase();

  // Check for TDD indicators
  const tddMatch = AVAILABLE_SKILLS.find((s) => s.name === "tdd-workflow");
  if (tddMatch) {
    const isCore = tddMatch.recommendedFor.some((kw) =>
      topicLower.includes(kw),
    );
    const isCritical = context.criticality === "high";
    if (isCore || isCritical) {
      recommendations.push(tddMatch.name);
      reasons.push(
        isCritical
          ? "High criticality — TDD ensures test coverage and code quality"
          : "Core functionality — TDD provides safety through tests",
      );
    }
  }

  // Check for architecture-specific skills
  const cleanArchMatch = AVAILABLE_SKILLS.find((s) => s.name === "clean-architecture");
  if (cleanArchMatch && context.complexity === "high") {
    recommendations.push(cleanArchMatch.name);
    reasons.push("High complexity — Clean Architecture provides separation of concerns");
  }

  const microMatch = AVAILABLE_SKILLS.find((s) => s.name === "microservices");
  if (microMatch && topicLower.includes("microservice")) {
    recommendations.push(microMatch.name);
    reasons.push("Topic mentions microservices — microservices patterns apply");
  }

  const enterpriseMatch = AVAILABLE_SKILLS.find((s) => s.name === "enterprise-patterns");
  if (enterpriseMatch && topicLower.includes("domain")) {
    recommendations.push(enterpriseMatch.name);
    reasons.push("Topic mentions domain — DDD/enterprise patterns may apply");
  }

  // Check for regulated/compliance indicators
  const waterfallMatch = AVAILABLE_SKILLS.find((s) => s.name === "waterfall");
  if (waterfallMatch && context.criticality === "high") {
    recommendations.push(waterfallMatch.name);
    reasons.push("High criticality/regulated — Waterfall provides phase-gate compliance");
  }

  // Check for agile indicators
  const agileMatch = AVAILABLE_SKILLS.find((s) => s.name === "agile-scrum");
  if (agileMatch && context.existingCode) {
    recommendations.push(agileMatch.name);
    reasons.push("Existing codebase — Agile supports iterative improvement");
  }

  // Default: always recommend TDD as the baseline
  if (!recommendations.includes("tdd-workflow") && tddMatch) {
    recommendations.push(tddMatch.name);
    reasons.push("Default recommendation — TDD provides quality baseline");
  }

  return {
    recommendedSkills: recommendations,
    reason: reasons.join(". "),
    approvalRequired: recommendations.length > 1,
  };
}

// ─── Skill Content Loading ──────────────────────────────────────────────────

/**
 * Get the system prompt augmentation for a specific skill.
 * In production, this would read the SKILL.md file.
 * For now, returns a structured prompt template.
 */
export function getSkillPromptAugmentation(skillName: string, topic: string): string {
  const skill = AVAILABLE_SKILLS.find((s) => s.name === skillName);
  if (!skill) {
    return "";
  }

  return `## Skill: ${skill.label}

${skill.description}

When working on "${topic}", apply the conventions and patterns from the ${skill.label} skill.
Load the skill's SKILL.md from .pi/skills/${skillName}/SKILL.md for detailed guidance.

Key principles:
- Follow the skill's patterns and conventions
- Apply the skill's best practices
- Document deviations from the skill's approach
`;
}

// ─── Skill List ──────────────────────────────────────────────────────────────

/**
 * Return a formatted list of available skills.
 */
export function listAvailableSkills(): string {
  let md = "## Available Skills\n\n";
  md += "| Skill | Description | Default |\n";
  md += "|---|---|---|\n";

  for (const skill of AVAILABLE_SKILLS) {
    const defaultMark = skill.default ? "✅" : "";
    md += `| ${skill.label} | ${skill.description.slice(0, 80)}... | ${defaultMark} |\n`;
  }

  return md;
}

// ─── Skill Activation ───────────────────────────────────────────────────────

/**
 * Build the full system prompt augmentation including skill(s).
 * Combines the base prompt with skill-specific guidance.
 */
export function buildSkillAugmentation(
  skills: string[],
  topic: string,
): string {
  if (skills.length === 0) return "";

  let augmentation = "# Active Skills\n\n";
  augmentation += `The following skills are active for this task:\n\n`;

  for (const skillName of skills) {
    const augmentationText = getSkillPromptAugmentation(skillName, topic);
    if (augmentationText) {
      augmentation += augmentationText;
    }
  }

  return augmentation;
}
