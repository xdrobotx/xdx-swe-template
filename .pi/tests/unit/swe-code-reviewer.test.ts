import { describe, it } from "node:test";
import assert from "node:assert";
import {
  REVIEW_CHECKLIST,
  selfReview,
  formatReviewReport,
  proposeReviewEdits,
  applyReviewEdits,
  buildReviewDialoguePrompt,
} from "../../lib/swe-code-reviewer.js";

describe("REVIEW_CHECKLIST", () => {
  it("has all 6 categories", () => {
    assert.equal(REVIEW_CHECKLIST.length, 6);
  });

  it("has each category with questions", () => {
    for (const item of REVIEW_CHECKLIST) {
      assert.ok(item.category);
      assert.ok(Array.isArray(item.questions));
      assert.ok(item.questions.length > 0);
    }
  });
});

describe("selfReview", () => {
  it("returns a review report", () => {
    const report = selfReview("function test() {}", "test.ts");
    assert.ok(report.topic);
    assert.ok(Array.isArray(report.findings));
    assert.ok(report.summary);
  });
});

describe("formatReviewReport", () => {
  it("generates markdown report", () => {
    const report = selfReview("", "test.ts");
    const md = formatReviewReport(report);
    assert.ok(md.includes("# Code Review"));
  });

  it("shows no issues message when empty", () => {
    const report: any = {
      topic: "test.ts",
      findings: [],
      summary: { total: 0, critical: 0, warnings: 0, info: 0 },
    };
    const md = formatReviewReport(report);
    assert.ok(md.includes("No issues found"));
  });
});

describe("proposeReviewEdits", () => {
  it("marks critical findings as not approved", () => {
    const report: any = {
      topic: "test.ts",
      findings: [
        { category: "logic", severity: "critical", file: "test.ts", description: "Bug", suggestion: "Fix it" },
      ],
      summary: { total: 1, critical: 1, warnings: 0, info: 0 },
    };
    const edits = proposeReviewEdits(report);
    assert.equal(edits[0].approved, false);
  });

  it("auto-approves info findings", () => {
    const report: any = {
      topic: "test.ts",
      findings: [
        { category: "style", severity: "info", file: "test.ts", description: "Info" },
      ],
      summary: { total: 1, critical: 0, warnings: 0, info: 1 },
    };
    const edits = proposeReviewEdits(report);
    assert.equal(edits[0].approved, true);
  });
});

describe("applyReviewEdits", () => {
  it("filters to approved only when approvedOnly is true", () => {
    const edits = [
      { file: "a.ts", description: "A", approved: true },
      { file: "b.ts", description: "B", approved: false },
    ];
    const result = applyReviewEdits(edits, true);
    assert.equal(result.length, 1);
    assert.equal(result[0].file, "a.ts");
  });

  it("returns all when approvedOnly is false", () => {
    const edits = [
      { file: "a.ts", description: "A", approved: true },
      { file: "b.ts", description: "B", approved: false },
    ];
    const result = applyReviewEdits(edits, false);
    assert.equal(result.length, 2);
  });
});

describe("buildReviewDialoguePrompt", () => {
  it("includes topic and report", () => {
    const report: any = {
      topic: "test.ts",
      findings: [],
      summary: { total: 0, critical: 0, warnings: 0, info: 0 },
    };
    const prompt = buildReviewDialoguePrompt("auth module", report);
    assert.ok(prompt.includes("auth module"));
    assert.ok(prompt.includes("Code Review Session"));
  });
});
