---
name: requirements-format
description: Templates for formal (IEEE 830) and lightweight (user story) requirements. Use when specifying requirements for a system.
license: MIT
---

# Requirements Engineering Templates

Use these templates when eliciting, specifying, or documenting requirements.

## Formal Requirements (IEEE 830 Style)

Use for safety-critical systems, regulated industries, or when testable specifications are required.

### Single Requirement Template

```markdown
# REQ-XXX: [Requirement Title]

| Field | Value |
|---|---|
| **ID** | REQ-XXX |
| **Statement** | [Clear, unambiguous, testable statement] |
| **Type** | Functional / Non-Functional / Constraint / Interface |
| **Rationale** | [Why this requirement exists; problem it solves] |
| **Priority** | Must / Should / Could / Won't (MoSCoW) |
| **Verification** | Inspection / Analysis / Test / Demonstration |
| **Traceability** | [Links to parent requirements, design elements, tests] |
| **Status** | Draft / Proposed / Approved / Implemented / Verified / Retired |
| **Author** | [Who wrote this requirement] |
| **Date** | [YYYY-MM-DD] |
| **Version** | [1.0, 1.1, etc.] |

## Statement

[Full requirement statement. Use "shall" for mandatory requirements, "should" for desirable ones.]

## Rationale

[Detailed explanation of why this requirement exists. Reference stakeholders, regulations, or design decisions.]

## Acceptance Criteria

- [Criterion 1 — measurable, testable]
- [Criterion 2 — measurable, testable]
- [Criterion 3 — measurable, testable]

## Dependencies

- [REQ-YYY] — This requirement depends on...
- [REQ-YYY] — This requirement enables...

## Constraints

- [Any constraints on how this requirement must be met]

## Notes

- [Additional context, edge cases, or clarifications]
```

### Requirements Traceability Matrix

```markdown
# Requirements Traceability Matrix

| REQ ID | Statement | Type | Priority | Verification | Design Element | Test Case | Status |
|---|---|---|---|---|---|---|---|
| REQ-001 | [Brief statement] | Functional | Must | Test | SEC-001 | TC-001 | Approved |
| REQ-002 | [Brief statement] | Non-Functional | Should | Analysis | — | — | Draft |
```

## Lightweight Requirements (User Story Style)

Use for agile teams, rapid prototyping, or when formal specifications are overkill.

### User Story Template

```markdown
# Story-XXX: [Story Title]

## User Story

As a **[role/persona]**,
I want **[goal/action]**,
so that **[benefit/value]**.

## Acceptance Criteria

- **Given** [precondition/context],
  **When** [action/event],
  **Then** [expected result/behavior].

- **Given** [precondition/context],
  **When** [action/event],
  **Then** [expected result/behavior].

## Technical Notes

- [Implementation considerations]
- [Dependencies on other stories or components]

## Definition of Done

- [ ] Code implemented
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Reviewed by [team member]
```

### Epic Template

```markdown
# Epic: [Epic Title]

## Description

[Brief description of the epic and its business value]

## User Stories

| ID | Story | Priority | Effort | Status |
|---|---|---|---|---|
| Story-001 | [Story title] | High | 3 pts | Done |
| Story-002 | [Story title] | Medium | 5 pts | In Progress |

## Acceptance Criteria (Epic Level)

- [Criterion 1]
- [Criterion 2]

## Dependencies

- [External dependency]
- [Internal dependency]
```

## Non-Functional Requirements Template

Use for performance, security, reliability, and other quality attributes.

```markdown
# NFR-XXX: [Requirement Title]

| Field | Value |
|---|---|
| **ID** | NFR-XXX |
| **Category** | Performance / Security / Reliability / Usability / Maintainability / Scalability |
| **Statement** | [Clear, measurable statement] |
| **Target** | [Quantifiable target with units] |
| **Measurement** | [How to measure: benchmark, monitoring, audit] |
| **Priority** | Must / Should / Could / Won't |
| **Verification** | Benchmark / Audit / Monitoring / Review |

## Statement

[Full requirement statement with measurable targets]

## Measurement Method

[How the target will be measured and validated]

## Baseline

[Current state, if applicable]

## Target

[Desired state with specific numbers]

## Monitoring

[How ongoing compliance will be tracked]
```

### Common NFR Categories and Examples

| Category | Example |
|---|---|
| **Performance** | "The system shall respond to 95% of requests within 200ms under normal load." |
| **Security** | "All data in transit shall be encrypted using TLS 1.3 or higher." |
| **Reliability** | "The system shall achieve 99.9% availability measured over a rolling 30-day period." |
| **Scalability** | "The system shall support up to 10,000 concurrent users without degradation." |
| **Usability** | "A new user shall be able to complete the primary workflow within 3 minutes without training." |
| **Maintainability** | "Code coverage shall be maintained at a minimum of 80% for all new code." |

## Requirements Elicitation Checklist

When gathering requirements, ensure:

- [ ] **Identifiable** — Each requirement has a unique ID
- [ ] **Unambiguous** — Only one interpretation possible
- [ ] **Testable** — Can be verified with a specific method
- [ ] **Complete** — Covers all necessary functionality
- [ ] **Consistent** — No conflicts with other requirements
- [ ] **Traced** — Linked to source (stakeholder, regulation, design)
- [ ] **Prioritized** — Each has a priority level
- [ ] **Modular** — Each covers a single concern

## Requirements Validation Checklist

Before approving requirements:

- [ ] All requirements follow the template format
- [ ] No vague language ("user-friendly", "fast", "efficient")
- [ ] All measurable requirements have specific targets
- [ ] No conflicts between requirements
- [ ] All stakeholders have reviewed and approved
- [ ] Requirements are feasible within constraints
- [ ] Traceability links are complete
