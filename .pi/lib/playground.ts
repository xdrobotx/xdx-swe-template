/**
 * Playground — Manual testing harness for subagent extensions.
 *
 * Spawns a subagent with a fixed topic and captures the output.
 * Verifies structure (markdown, diagrams, sections) and reports results.
 *
 * Usage:
 *   npx pi --mode json -p --no-session --no-extensions --no-skills --no-prompt-templates --no-themes --no-context-files \
 *     --append-system-prompt playground-system.md \
 *     "Test topic"
 *
 * Or run directly:
 *   npx tsx .pi/extensions/subagent-lib/playground.ts <topic>
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { spawn } from "node:child_process";
import { formatTokens } from "./result-formatters.ts";

// ─── Test Configuration ─────────────────────────────────────────────────────

interface TestConfig {
  topic: string;
  systemPrompt: string;
  expectedPatterns: string[];
  name: string;
}

const TESTS: TestConfig[] = [
  {
    name: "Feasibility Study",
    topic: "Conduct a feasibility study for implementing a real-time WebSocket-based collaboration system for a CyberPhysical Systems simulation platform.",
    systemPrompt: buildCollaboratorPrompt("feasibility study"),
    expectedPatterns: [
      "##",           // Markdown sections
      "###",          // Subsections
      "-",            // Bullet points
      "feasibility",  // Topic relevance
    ],
  },
  {
    name: "System Design",
    topic: "Perform system design for a sensor fusion pipeline that combines LiDAR, camera, and IMU data for autonomous vehicle navigation.",
    systemPrompt: buildSystemsEngineerPrompt("system design"),
    expectedPatterns: [
      "##",           // Markdown sections
      "mermaid",      // Diagrams
      "Component",    // Architecture terms
      "interface",    // Design terms
    ],
  },
  {
    name: "Requirements Engineering",
    topic: "Generate formal requirements for a medical device controller that monitors patient vitals and triggers alarms.",
    systemPrompt: buildSystemsEngineerPrompt("requirements engineering"),
    expectedPatterns: [
      "REQ-",         // Requirement IDs
      "shall",        // Requirement language
      "Functional",   // Requirement type
      "Verification", // Verification method
    ],
  },
  {
    name: "Architecture Review",
    topic: "Analyze the architecture of a microservices-based IoT platform with edge computing capabilities.",
    systemPrompt: buildSystemsEngineerPrompt("system architecture"),
    expectedPatterns: [
      "##",           // Markdown sections
      "deployment",   // Deployment terms
      "service",      // Microservice terms
      "scalability",  // Architecture concerns
    ],
  },
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const topic = process.argv[2] || "Test topic";
  const mode = process.argv[3] || "all";

  console.log("=".repeat(70));
  console.log("  Subagent Extension Playground");
  console.log("=".repeat(70));
  console.log(`\nTopic: ${topic}`);
  console.log(`Mode: ${mode}`);
  console.log("");

  if (mode === "all") {
    for (const test of TESTS) {
      await runTest(test, topic);
    }
  } else {
    const test = TESTS.find(t => t.name.toLowerCase().includes(mode.toLowerCase()));
    if (test) {
      await runTest(test, topic);
    } else {
      console.log(`Unknown test mode: ${mode}`);
      console.log("Available modes:", TESTS.map(t => t.name).join(", "));
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("  Playground complete.");
  console.log("=".repeat(70));
}

// ─── Test Runner ────────────────────────────────────────────────────────────

async function runTest(test: TestConfig, topicOverride?: string) {
  const testTopic = topicOverride || test.topic;
  console.log(`\n${"─".repeat(70)}`);
  console.log(`  Test: ${test.name}`);
  console.log(`  Topic: ${testTopic.slice(0, 80)}${testTopic.length > 80 ? "..." : ""}`);
  console.log("─".repeat(70));

  // Write system prompt to temp file
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "pi-playground-"));
  const promptFile = path.join(tmpDir, "playground-system.md");
  await fs.promises.writeFile(promptFile, test.systemPrompt, { encoding: "utf-8", mode: 0o600 });

  try {
    const result = await runSubagent(testTopic, promptFile);

    // Check exit code
    if (result.exitCode !== 0) {
      console.log(`  ✗ Exit code: ${result.exitCode}`);
      if (result.stderr) {
        console.log(`    stderr: ${result.stderr.slice(0, 200)}`);
      }
      return;
    }

    const output = result.output;
    const hasOutput = output && output.length > 0;

    console.log(`  ✓ Exit code: ${result.exitCode}`);
    console.log(`  ✓ Output length: ${output?.length || 0} chars`);
    console.log(`  ✓ Turns: ${result.turns}`);

    // Check expected patterns
    let patternPass = 0;
    let patternFail = 0;
    for (const pattern of test.expectedPatterns) {
      if (output?.includes(pattern)) {
        patternPass++;
      } else {
        patternFail++;
        console.log(`  ✗ Missing pattern: "${pattern}"`);
      }
    }
    console.log(`  Patterns: ${patternPass}/${test.expectedPatterns.length} found`);

    // Check for markdown structure
    const hasMarkdown = output?.includes("#") || output?.includes("##");
    const hasDiagrams = output?.includes("mermaid") || output?.includes("graph");
    const hasBulletPoints = output?.includes("- ") || output?.includes("* ");
    const hasSections = (output?.match(/^##/gm) || []).length >= 2;

    console.log(`  Markdown structure: ${hasMarkdown ? "✓" : "✗"}`);
    console.log(`  Diagrams: ${hasDiagrams ? "✓" : "✗"}`);
    console.log(`  Bullet points: ${hasBulletPoints ? "✓" : "✗"}`);
    console.log(`  Sections (≥2): ${hasSections ? "✓" : "✗"}`);

    // Save output for review
    const outputDir = path.join(os.tmpdir(), "pi-playground-output");
    await fs.promises.mkdir(outputDir, { recursive: true });
    const outputFile = path.join(outputDir, `${test.name.toLowerCase().replace(/\s+/g, "-")}.md`);
    await fs.promises.writeFile(outputFile, output || "(no output)", { encoding: "utf-8" });
    console.log(`  Output saved to: ${outputFile}`);

    // Usage stats
    if (result.usage) {
      console.log(`  Usage: ↑${formatTokens(result.usage.input)} ↓${formatTokens(result.usage.output)} $${result.usage.cost.toFixed(4)}`);
    }

  } catch (err) {
    console.log(`  ✗ Error: ${(err as Error).message}`);
  } finally {
    try { fs.unlinkSync(promptFile); } catch { /* ignore */ }
    try { fs.rmdirSync(tmpDir); } catch { /* ignore */ }
  }
}

// ─── Subagent Runner (inline for playground) ────────────────────────────────

interface PlayResult {
  exitCode: number;
  output: string;
  stderr: string;
  turns: number;
  usage?: { input: number; output: number; cost: number };
}

function runSubagent(task: string, promptFile: string): Promise<PlayResult> {
  return new Promise((resolve) => {
    const promptPath = path.isAbsolute(promptFile) ? promptFile : path.join(process.cwd(), promptFile);
    
    let output = "";
    let stderr = "";
    let turns = 0;
    let lastOutput = "";
    let usageInput = 0;
    let usageOutput = 0;
    let usageCost = 0;

    const processLine = (line: string) => {
      if (!line.trim()) return;
      let event: any;
      try { event = JSON.parse(line); } catch { return; }

      if (event.type === "message_end" && event.message) {
        const msg = event.message;
        turns++;
        if (msg.role === "assistant") {
          for (const part of msg.content) {
            if (part.type === "text") lastOutput = part.text;
          }
          const u = msg.usage;
          if (u) {
            usageInput += u.input || 0;
            usageOutput += u.output || 0;
            usageCost += u.cost?.total || 0;
          }
        }
      }
      if (event.type === "tool_result_end" && event.message) {
        for (const part of event.message.content || []) {
          if (part.type === "text") lastOutput = part.text;
        }
      }
    };

    // Use spawn with cmd /c on Windows to handle POSIX shell scripts
    const args = [
      '/c',
      'pi',
      '--mode', 'json',
      '-p',
      '--no-session',
      '--no-extensions',
      '--no-skills',
      '--no-prompt-templates',
      '--no-themes',
      '--no-context-files',
      '--append-system-prompt',
      promptPath,
      '--tools', 'read,write,edit,bash,find,grep,ls',
      task,
    ];

    const proc = spawn('cmd', args, {
      cwd: process.cwd(),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024 * 10,
    });

    proc.stdout.on('data', (d) => {
      const lines = d.toString().split('\n');
      for (const line of lines) processLine(line);
    });

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      output = lastOutput;
      resolve({
        exitCode: code ?? 1,
        output,
        stderr,
        turns,
        usage: usageInput > 0 ? { input: usageInput, output: usageOutput, cost: usageCost } : undefined,
      });
    });

    proc.on('error', (e) => {
      resolve({ exitCode: 1, output: "", stderr: e.message, turns: 0 });
    });
  });
}

// ─── Prompt Builders ────────────────────────────────────────────────────────

function buildCollaboratorPrompt(modeLabel: string): string {
  return `# COLLABORATOR AGENT — Interactive Thinking Partner

You are a collaborative thinking partner. Perform a ${modeLabel}.

## File Permissions
- ✅ CAN write any .md, .txt, .adoc design documents

## Restrictions
- DO NOT generate, write, or modify any source code files
- DO NOT create files with extensions: .ts, .js, .tsx, .jsx, .py, .java, .cpp, .c, .h, .hpp, .cs, .go, .rs
- DO NOT write configuration files, build scripts, or deployment artifacts
- DO NOT run build tools, test suites, or deployment scripts

## Workflow
1. Explore the codebase to understand context
2. Share insights in digestible chunks
3. Ask clarifying questions
4. Iterate based on responses

## Reporting
Save your findings as a document file in the design/ directory.

## Output Format
Structure your response with clear sections (##, ###), use bullet points, and include a summary.`;
}

function buildSystemsEngineerPrompt(modeLabel: string): string {
  return `# SYSTEMS ENGINEER — Design & Requirements Specialist

You are a systems engineering specialist. Perform ${modeLabel}.

## File Permissions
- ✅ CAN write any .md, .txt, .adoc design documents
- ✅ CAN write .mmd (Mermaid), .puml (PlantUML) diagram files

## Restrictions
- DO NOT generate, write, or modify any source code files
- DO NOT create files with extensions: .ts, .js, .tsx, .jsx, .py, .java, .cpp, .c, .h, .hpp, .cs, .go, .rs
- DO NOT write configuration files, build scripts, or deployment artifacts
- DO NOT run build tools, test suites, or deployment scripts

## Workflow
1. Discover existing design artifacts and research in the project
2. Analyze any collaborator agent results
3. Build upon existing work or start fresh
4. Generate appropriate design artifacts
5. Save documents to the design/ directory

## Output Format
Structure your response with clear sections (##, ###), include text-based diagrams (Mermaid, PlantUML, ASCII), and provide rationale for design decisions.`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// formatTokens is imported from result-formatters.ts

// ─── Run ────────────────────────────────────────────────────────────────────

main().catch(console.error);
