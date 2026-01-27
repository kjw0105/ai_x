/**
 * test-stage2-rules.mjs - Standalone validation script for Stage 2 rules
 *
 * Run with: node scripts/test-stage2-rules.mjs
 *
 * This script verifies all enhanced Stage 2 validation rules work correctly.
 */

import {
  validateDocument,
  validateChecklistConsistency,
  validateChecklistCompleteness,
  categorizeIssues,
  getRuleStats,
} from "../src/lib/validator.ts";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title, colors.bold + colors.cyan);
  console.log("=".repeat(60));
}

function logTest(testName, passed, details = "") {
  const icon = passed ? "✓" : "✗";
  const color = passed ? colors.green : colors.red;
  log(`${icon} ${testName}`, color);
  if (details) {
    console.log(`  ${details}`);
  }
}

// ============================================================
// Test Helpers
// ============================================================

function createBaseDoc(overrides = {}) {
  return {
    docType: "산업안전 점검표",
    fields: {
      점검일자: "2026-01-27",
      현장명: "테스트 현장",
      작업내용: "테스트 작업",
      작업인원: "5명",
    },
    signature: {
      담당: "present",
      소장: "present",
    },
    checklist: [],
    ...overrides,
  };
}

function createChecklist(items) {
  return items.map((item, idx) => ({
    id: item.id || `test_${idx}`,
    category: item.category || "테스트",
    nameKo: item.nameKo || "테스트 항목",
    value: item.value !== undefined ? item.value : "✔",
  }));
}

// ============================================================
// Test Suites
// ============================================================

let totalTests = 0;
let passedTests = 0;

function runTest(name, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result) {
      passedTests++;
      logTest(name, true);
    } else {
      logTest(name, false, "Assertion failed");
    }
  } catch (error) {
    logTest(name, false, error.message);
  }
}

// ============================================================
// Test: Rule Statistics
// ============================================================

logSection("Rule Statistics");

try {
  const stats = getRuleStats();
  log(`Safety Violations: ${stats.safety_violation}`, colors.blue);
  log(`Logical Contradictions: ${stats.logical_contradiction}`, colors.blue);
  log(`Completeness Checks: ${stats.completeness}`, colors.blue);
  log(`Suspicious Patterns: ${stats.suspicious_pattern}`, colors.blue);
  log(
    `Total Rules: ${
      stats.safety_violation +
      stats.logical_contradiction +
      stats.completeness +
      stats.suspicious_pattern
    }`,
    colors.bold
  );
} catch (error) {
  log(`Error getting rule stats: ${error.message}`, colors.red);
}

// ============================================================
// Test: Safety Violations
// ============================================================

logSection("Testing Safety Violation Rules");

runTest("Height work without harness", () => {
  const checklist = createChecklist([
    { id: "fall_01", nameKo: "고소작업", value: "✔" },
    { id: "ppe_03", nameKo: "안전대착용", value: "✖" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_height_harness");
});

runTest("Hot work without extinguisher", () => {
  const checklist = createChecklist([
    { id: "fire_01", nameKo: "화기작업", value: "✔" },
    { id: "fire_02", nameKo: "소화기비치", value: "✖" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_fire_extinguisher");
});

runTest("Confined space without oxygen measurement", () => {
  const checklist = createChecklist([
    { id: "conf_01", nameKo: "밀폐공간작업", value: "✔" },
    { id: "conf_02", nameKo: "산소농도측정", value: "✖" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_confined_oxygen");
});

runTest("Excavation without shoring", () => {
  const checklist = createChecklist([
    { id: "exc_01", nameKo: "굴착작업", value: "✔" },
    { id: "exc_02", nameKo: "흙막이설치", value: "✖" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_excavation_shoring");
});

runTest("Electrical work without LOTO", () => {
  const checklist = createChecklist([
    { id: "elec_02", nameKo: "전기작업", value: "✔" },
    { id: "elec_03", nameKo: "잠금장치", value: "✖" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_electrical_lockout");
});

// ============================================================
// Test: Logical Contradictions
// ============================================================

logSection("Testing Logical Contradiction Rules");

runTest("No height work but protection marked", () => {
  const checklist = createChecklist([
    { id: "fall_01", nameKo: "고소작업", value: "✖" },
    { id: "fall_02", nameKo: "추락방호장치", value: "✔" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_height_contradiction");
});

runTest("No hot work but extinguisher marked", () => {
  const checklist = createChecklist([
    { id: "fire_01", nameKo: "화기작업", value: "✖" },
    { id: "fire_02", nameKo: "소화기비치", value: "✔" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_fire_contradiction");
});

runTest("No confined work but O2 measurement marked", () => {
  const checklist = createChecklist([
    { id: "conf_01", nameKo: "밀폐공간작업", value: "✖" },
    { id: "conf_02", nameKo: "산소농도측정", value: "✔" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_confined_contradiction");
});

// ============================================================
// Test: Suspicious Patterns (N/A)
// ============================================================

logSection("Testing Suspicious Pattern Rules (N/A)");

runTest("Height work marked N/A", () => {
  const checklist = createChecklist([
    { id: "fall_01", nameKo: "고소작업", value: "N/A" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_critical_na_height");
});

runTest("Fire work marked N/A", () => {
  const checklist = createChecklist([
    { id: "fire_01", nameKo: "화기작업", value: "N/A" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_critical_na_fire");
});

runTest("Confined space marked N/A", () => {
  const checklist = createChecklist([
    { id: "conf_01", nameKo: "밀폐공간작업", value: "N/A" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_critical_na_confined");
});

runTest("Over 50% items marked N/A", () => {
  const checklist = createChecklist([
    { id: "item_01", value: "N/A" },
    { id: "item_02", value: "N/A" },
    { id: "item_03", value: "N/A" },
    { id: "item_04", value: "N/A" },
    { id: "item_05", value: "N/A" },
    { id: "item_06", value: "✔" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_excessive_na");
});

// ============================================================
// Test: Completeness
// ============================================================

logSection("Testing Completeness Rules");

runTest("Safety helmet item missing", () => {
  const checklist = createChecklist([
    { id: "fall_01", nameKo: "고소작업", value: "✔" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_helmet_missing");
});

runTest("Height work item missing", () => {
  const checklist = createChecklist([
    { id: "ppe_01", nameKo: "안전모착용", value: "✔" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  return issues.some((i) => i.ruleId === "rule_height_work_missing");
});

runTest("Checklist too short (< 5 items)", () => {
  const checklist = createChecklist([
    { id: "item_01", value: "✔" },
    { id: "item_02", value: "✔" },
    { id: "item_03", value: "✔" },
  ]);
  const issues = validateChecklistCompleteness(checklist);
  return issues.some((i) => i.ruleId === "completeness_too_short");
});

runTest("All items marked checked", () => {
  const checklist = createChecklist([
    { id: "item_01", value: "✔" },
    { id: "item_02", value: "✔" },
    { id: "item_03", value: "✔" },
    { id: "item_04", value: "✔" },
    { id: "item_05", value: "✔" },
    { id: "item_06", value: "✔" },
  ]);
  const issues = validateChecklistCompleteness(checklist);
  return issues.some((i) => i.ruleId === "pattern_all_checked");
});

runTest("All items marked N/A", () => {
  const checklist = createChecklist([
    { id: "item_01", value: "N/A" },
    { id: "item_02", value: "N/A" },
    { id: "item_03", value: "N/A" },
    { id: "item_04", value: "N/A" },
    { id: "item_05", value: "N/A" },
  ]);
  const issues = validateChecklistCompleteness(checklist);
  return issues.some((i) => i.ruleId === "pattern_all_na");
});

// ============================================================
// Test: Integration
// ============================================================

logSection("Testing Full Document Validation");

runTest("Valid document produces no Stage 2 issues", () => {
  const doc = createBaseDoc({
    checklist: createChecklist([
      { id: "ppe_01", nameKo: "안전모착용", value: "✔" },
      { id: "fall_01", nameKo: "고소작업", value: "✖" },
      { id: "fire_01", nameKo: "화기작업", value: "✖" },
      { id: "conf_01", nameKo: "밀폐공간작업", value: "✖" },
      { id: "exc_01", nameKo: "굴착작업", value: "✖" },
      { id: "elec_02", nameKo: "전기작업", value: "✖" },
    ]),
  });
  const issues = validateDocument(doc);
  const stage2Issues = issues.filter((i) => i.ruleId?.startsWith("rule_"));
  return stage2Issues.length === 0;
});

runTest("Multiple violations detected", () => {
  const doc = createBaseDoc({
    checklist: createChecklist([
      { id: "fall_01", value: "✔" },
      { id: "ppe_03", value: "✖" },
      { id: "fall_02", value: "✖" },
      { id: "fire_01", value: "✔" },
      { id: "fire_02", value: "✖" },
    ]),
  });
  const issues = validateDocument(doc);
  const violations = issues.filter(
    (i) =>
      i.ruleId === "rule_height_harness" ||
      i.ruleId === "rule_height_protection" ||
      i.ruleId === "rule_fire_extinguisher"
  );
  return violations.length === 3;
});

runTest("Issue categorization works correctly", () => {
  const checklist = createChecklist([
    { id: "fall_01", value: "✔" },
    { id: "ppe_03", value: "✖" }, // Safety violation
    { id: "fire_01", value: "✖" },
    { id: "fire_02", value: "✔" }, // Contradiction
  ]);
  const issues = validateChecklistConsistency(checklist);
  const stats = categorizeIssues(issues);
  return (
    stats.safetyViolations > 0 &&
    stats.contradictions > 0 &&
    stats.total === issues.length
  );
});

runTest("Issue messages include guidance and references", () => {
  const checklist = createChecklist([
    { id: "fall_01", value: "✔" },
    { id: "ppe_03", value: "✖" },
  ]);
  const issues = validateChecklistConsistency(checklist);
  const heightIssue = issues.find((i) => i.ruleId === "rule_height_harness");
  return (
    heightIssue &&
    heightIssue.message.includes("→") &&
    heightIssue.message.includes("📋")
  );
});

// ============================================================
// Test Summary
// ============================================================

logSection("Test Summary");

const passRate = ((passedTests / totalTests) * 100).toFixed(1);
const color = passedTests === totalTests ? colors.green : colors.yellow;

log(`Total Tests: ${totalTests}`, colors.bold);
log(`Passed: ${passedTests}`, colors.green);
log(`Failed: ${totalTests - passedTests}`, colors.red);
log(`Pass Rate: ${passRate}%`, color);

if (passedTests === totalTests) {
  log("\n🎉 All tests passed! Stage 2 enhancement is working correctly.", colors.green + colors.bold);
} else {
  log("\n⚠️  Some tests failed. Please review the output above.", colors.yellow);
}

console.log("\n");
