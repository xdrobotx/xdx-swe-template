import { describe, it } from "node:test";
import assert from "node:assert";
import {
  proposeSkills,
  getSkillPromptAugmentation,
  listAvailableSkills,
  buildSkillAugmentation,
  AVAILABLE_SKILLS,
} from "../../lib/swe-skill-manager.js";

describe("AVAILABLE_SKILLS", () => {
  it("has at least 5 skills registered", () => {
    assert.ok(AVAILABLE_SKILLS.length >= 5);
  });

  it("has tdd-workflow as default", () => {
    const tdd = AVAILABLE_SKILLS.find((s) => s.name === "tdd-workflow");
    assert.ok(tdd);
    assert.equal(tdd.default, true);
  });

  it("each skill has required fields", () => {
    for (const skill of AVAILABLE_SKILLS) {
      assert.ok(skill.name, "skill must have name");
      assert.ok(skill.label, "skill must have label");
      assert.ok(skill.description, "skill must have description");
      assert.ok(Array.isArray(skill.tags), "skill must have tags");
      assert.ok(Array.isArray(skill.recommendedFor), "skill must have recommendedFor");
    }
  });
});

describe("proposeSkills", () => {
  it("proposes TDD for core functionality", () => {
    const proposal = proposeSkills("user authentication", { criticality: "high" });
    assert.ok(proposal.recommendedSkills.includes("tdd-workflow"));
  });

  it("proposes clean architecture for high complexity", () => {
    const proposal = proposeSkills("payment service", { complexity: "high" });
    assert.ok(proposal.recommendedSkills.includes("clean-architecture"));
  });

  it("proposes microservices for microservice topic", () => {
    const proposal = proposeSkills("microservice decomposition");
    assert.ok(proposal.recommendedSkills.includes("microservices"));
  });

  it("proposes waterfall for regulated projects", () => {
    const proposal = proposeSkills("safety-critical system", { criticality: "high" });
    assert.ok(proposal.recommendedSkills.includes("waterfall"));
  });

  it("always includes TDD as baseline", () => {
    const proposal = proposeSkills("simple utility", {});
    assert.ok(proposal.recommendedSkills.includes("tdd-workflow"));
  });

  it("provides reason for recommendations", () => {
    const proposal = proposeSkills("api service", { criticality: "high" });
    assert.ok(proposal.reason.length > 0);
  });
});

describe("getSkillPromptAugmentation", () => {
  it("returns augmentation for known skill", () => {
    const aug = getSkillPromptAugmentation("tdd-workflow", "auth module");
    assert.ok(aug.includes("TDD"));
    assert.ok(aug.includes("auth module"));
  });

  it("returns empty string for unknown skill", () => {
    const aug = getSkillPromptAugmentation("nonexistent-skill", "topic");
    assert.equal(aug, "");
  });
});

describe("listAvailableSkills", () => {
  it("returns markdown table", () => {
    const list = listAvailableSkills();
    assert.ok(list.includes("| Skill |"));
    assert.ok(list.includes("|---|"));
  });
});

describe("buildSkillAugmentation", () => {
  it("combines multiple skills", () => {
    const aug = buildSkillAugmentation(["tdd-workflow", "clean-architecture"], "api");
    assert.ok(aug.includes("TDD"));
    assert.ok(aug.includes("Clean Architecture"));
  });

  it("returns empty string for no skills", () => {
    const aug = buildSkillAugmentation([], "topic");
    assert.equal(aug, "");
  });
});
