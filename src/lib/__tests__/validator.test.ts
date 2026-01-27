/**
 * validator.test.ts - Comprehensive tests for Stage 2 validation
 *
 * Tests all rule categories:
 * - Safety violations
 * - Logical contradictions
 * - Completeness checks
 * - Suspicious patterns (N/A)
 */

import {
  validateDocument,
  validateChecklistConsistency,
  validateChecklistCompleteness,
  categorizeIssues,
  getRulesByCategory,
  getRuleStats,
  type DocData,
  type ChecklistItem,
  type ValidationIssue,
} from "../validator";

// ============================================================
// Test Helpers
// ============================================================

function createBaseDoc(overrides?: Partial<DocData>): DocData {
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

function createChecklist(items: Partial<ChecklistItem>[]): ChecklistItem[] {
  return items.map((item, idx) => ({
    id: item.id || `test_${idx}`,
    category: item.category || "테스트",
    nameKo: item.nameKo || "테스트 항목",
    value: item.value !== undefined ? item.value : "✔",
  }));
}

// ============================================================
// Test Suite: Stage 2 Safety Violations
// ============================================================

describe("Stage 2: Safety Violation Rules", () => {
  test("rule_height_harness: Height work without harness", () => {
    const checklist = createChecklist([
      { id: "fall_01", nameKo: "고소작업", value: "✔" },
      { id: "ppe_03", nameKo: "안전대착용", value: "✖" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.ruleId === "rule_height_harness")).toBe(true);
    expect(issues.find((i) => i.ruleId === "rule_height_harness")?.severity).toBe("error");
  });

  test("rule_fire_extinguisher: Hot work without extinguisher", () => {
    const checklist = createChecklist([
      { id: "fire_01", nameKo: "화기작업", value: "✔" },
      { id: "fire_02", nameKo: "소화기비치", value: "✖" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_fire_extinguisher")).toBe(true);
  });

  test("rule_confined_oxygen: Confined space without oxygen measurement", () => {
    const checklist = createChecklist([
      { id: "conf_01", nameKo: "밀폐공간작업", value: "✔" },
      { id: "conf_02", nameKo: "산소농도측정", value: "✖" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_confined_oxygen")).toBe(true);
  });

  test("rule_confined_ventilation: Confined space without ventilation", () => {
    const checklist = createChecklist([
      { id: "conf_01", nameKo: "밀폐공간작업", value: "✔" },
      { id: "conf_03", nameKo: "환기조치", value: "✖" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_confined_ventilation")).toBe(true);
  });

  test("rule_excavation_shoring: Excavation without shoring", () => {
    const checklist = createChecklist([
      { id: "exc_01", nameKo: "굴착작업", value: "✔" },
      { id: "exc_02", nameKo: "흙막이설치", value: "✖" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_excavation_shoring")).toBe(true);
  });

  test("rule_excavation_ladder: Excavation without escape ladder", () => {
    const checklist = createChecklist([
      { id: "exc_01", nameKo: "굴착작업", value: "✔" },
      { id: "exc_03", nameKo: "탈출사다리", value: "✖" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_excavation_ladder")).toBe(true);
  });

  test("rule_electrical_lockout: Electrical work without LOTO", () => {
    const checklist = createChecklist([
      { id: "elec_02", nameKo: "전기작업", value: "✔" },
      { id: "elec_03", nameKo: "잠금장치", value: "✖" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_electrical_lockout")).toBe(true);
  });

  test("rule_height_protection: Height work without fall protection", () => {
    const checklist = createChecklist([
      { id: "fall_01", nameKo: "고소작업", value: "✔" },
      { id: "fall_02", nameKo: "추락방호장치", value: "✖" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_height_protection")).toBe(true);
  });

  test("rule_fire_spark_prevention: Hot work without spark prevention", () => {
    const checklist = createChecklist([
      { id: "fire_01", nameKo: "화기작업", value: "✔" },
      { id: "fire_03", nameKo: "불티비산방지", value: "✖" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_fire_spark_prevention")).toBe(true);
    expect(issues.find((i) => i.ruleId === "rule_fire_spark_prevention")?.severity).toBe("warn");
  });
});

// ============================================================
// Test Suite: Logical Contradictions
// ============================================================

describe("Stage 2: Logical Contradiction Rules", () => {
  test("rule_height_contradiction: No height work but protection marked", () => {
    const checklist = createChecklist([
      { id: "fall_01", nameKo: "고소작업", value: "✖" },
      { id: "fall_02", nameKo: "추락방호장치", value: "✔" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_height_contradiction")).toBe(true);
    expect(issues.find((i) => i.ruleId === "rule_height_contradiction")?.severity).toBe("warn");
  });

  test("rule_fire_contradiction: No hot work but extinguisher marked", () => {
    const checklist = createChecklist([
      { id: "fire_01", nameKo: "화기작업", value: "✖" },
      { id: "fire_02", nameKo: "소화기비치", value: "✔" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_fire_contradiction")).toBe(true);
  });

  test("rule_confined_contradiction: No confined work but O2 measurement marked", () => {
    const checklist = createChecklist([
      { id: "conf_01", nameKo: "밀폐공간작업", value: "✖" },
      { id: "conf_02", nameKo: "산소농도측정", value: "✔" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_confined_contradiction")).toBe(true);
  });

  test("rule_excavation_contradiction: No excavation but shoring marked", () => {
    const checklist = createChecklist([
      { id: "exc_01", nameKo: "굴착작업", value: "✖" },
      { id: "exc_02", nameKo: "흙막이설치", value: "✔" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_excavation_contradiction")).toBe(true);
  });

  test("rule_electrical_contradiction: No electrical work but LOTO marked", () => {
    const checklist = createChecklist([
      { id: "elec_02", nameKo: "전기작업", value: "✖" },
      { id: "elec_03", nameKo: "잠금장치", value: "✔" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_electrical_contradiction")).toBe(true);
  });
});

// ============================================================
// Test Suite: Suspicious Patterns (N/A)
// ============================================================

describe("Stage 2: Suspicious Pattern Rules (N/A)", () => {
  test("rule_critical_na_height: Height work marked N/A", () => {
    const checklist = createChecklist([
      { id: "fall_01", nameKo: "고소작업", value: "N/A" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_critical_na_height")).toBe(true);
  });

  test("rule_critical_na_fire: Fire work marked N/A", () => {
    const checklist = createChecklist([
      { id: "fire_01", nameKo: "화기작업", value: "N/A" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_critical_na_fire")).toBe(true);
  });

  test("rule_critical_na_confined: Confined space marked N/A", () => {
    const checklist = createChecklist([
      { id: "conf_01", nameKo: "밀폐공간작업", value: "N/A" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_critical_na_confined")).toBe(true);
  });

  test("rule_critical_na_excavation: Excavation marked N/A", () => {
    const checklist = createChecklist([
      { id: "exc_01", nameKo: "굴착작업", value: "N/A" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_critical_na_excavation")).toBe(true);
  });

  test("rule_critical_na_electrical: Electrical work marked N/A", () => {
    const checklist = createChecklist([
      { id: "elec_02", nameKo: "전기작업", value: "N/A" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_critical_na_electrical")).toBe(true);
  });

  test("rule_excessive_na: Over 50% items marked N/A", () => {
    const checklist = createChecklist([
      { id: "item_01", value: "N/A" },
      { id: "item_02", value: "N/A" },
      { id: "item_03", value: "N/A" },
      { id: "item_04", value: "N/A" },
      { id: "item_05", value: "N/A" },
      { id: "item_06", value: "✔" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_excessive_na")).toBe(true);
  });
});

// ============================================================
// Test Suite: Completeness
// ============================================================

describe("Stage 2: Completeness Rules", () => {
  test("rule_helmet_missing: Safety helmet item missing from checklist", () => {
    const checklist = createChecklist([
      { id: "fall_01", nameKo: "고소작업", value: "✔" },
      // ppe_01 (helmet) missing
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_helmet_missing")).toBe(true);
  });

  test("rule_height_work_missing: Height work item missing from checklist", () => {
    const checklist = createChecklist([
      { id: "ppe_01", nameKo: "안전모착용", value: "✔" },
      // fall_01 missing
    ]);

    const issues = validateChecklistConsistency(checklist);
    expect(issues.some((i) => i.ruleId === "rule_height_work_missing")).toBe(true);
  });

  test("completeness_too_short: Checklist has fewer than 5 items", () => {
    const checklist = createChecklist([
      { id: "item_01", value: "✔" },
      { id: "item_02", value: "✔" },
      { id: "item_03", value: "✔" },
    ]);

    const issues = validateChecklistCompleteness(checklist);
    expect(issues.some((i) => i.ruleId === "completeness_too_short")).toBe(true);
  });

  test("pattern_all_checked: All items marked as checked", () => {
    const checklist = createChecklist([
      { id: "item_01", value: "✔" },
      { id: "item_02", value: "✔" },
      { id: "item_03", value: "✔" },
      { id: "item_04", value: "✔" },
      { id: "item_05", value: "✔" },
      { id: "item_06", value: "✔" },
    ]);

    const issues = validateChecklistCompleteness(checklist);
    expect(issues.some((i) => i.ruleId === "pattern_all_checked")).toBe(true);
    expect(issues.find((i) => i.ruleId === "pattern_all_checked")?.severity).toBe("info");
  });

  test("pattern_all_na: All items marked N/A", () => {
    const checklist = createChecklist([
      { id: "item_01", value: "N/A" },
      { id: "item_02", value: "N/A" },
      { id: "item_03", value: "N/A" },
      { id: "item_04", value: "N/A" },
      { id: "item_05", value: "N/A" },
    ]);

    const issues = validateChecklistCompleteness(checklist);
    expect(issues.some((i) => i.ruleId === "pattern_all_na")).toBe(true);
    expect(issues.find((i) => i.ruleId === "pattern_all_na")?.severity).toBe("error");
  });

  test("completeness_no_checklist: No checklist in document", () => {
    const doc = createBaseDoc({ checklist: undefined });
    const issues = validateDocument(doc);
    expect(issues.some((i) => i.ruleId === "completeness_no_checklist")).toBe(true);
  });
});

// ============================================================
// Test Suite: Utility Functions
// ============================================================

describe("Utility Functions", () => {
  test("getRulesByCategory: Get safety violation rules", () => {
    const rules = getRulesByCategory("safety_violation");
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.every((r) => r.category === "safety_violation")).toBe(true);
  });

  test("getRuleStats: Get rule count by category", () => {
    const stats = getRuleStats();
    expect(stats.safety_violation).toBeGreaterThan(0);
    expect(stats.logical_contradiction).toBeGreaterThan(0);
    expect(stats.completeness).toBeGreaterThan(0);
    expect(stats.suspicious_pattern).toBeGreaterThan(0);
  });

  test("categorizeIssues: Categorize validation issues", () => {
    const checklist = createChecklist([
      { id: "fall_01", value: "✔" },
      { id: "ppe_03", value: "✖" }, // Safety violation
      { id: "fire_01", value: "✖" },
      { id: "fire_02", value: "✔" }, // Contradiction
    ]);

    const issues = validateChecklistConsistency(checklist);
    const stats = categorizeIssues(issues);

    expect(stats.total).toBe(issues.length);
    expect(stats.safetyViolations).toBeGreaterThan(0);
    expect(stats.contradictions).toBeGreaterThan(0);
  });
});

// ============================================================
// Test Suite: Integration Tests
// ============================================================

describe("Integration: Full Document Validation", () => {
  test("Valid document: No issues", () => {
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
    expect(stage2Issues.length).toBe(0);
  });

  test("Multiple violations: Multiple issues detected", () => {
    const doc = createBaseDoc({
      checklist: createChecklist([
        { id: "fall_01", value: "✔" },
        { id: "ppe_03", value: "✖" }, // Violation
        { id: "fall_02", value: "✖" }, // Violation
        { id: "fire_01", value: "✔" },
        { id: "fire_02", value: "✖" }, // Violation
      ]),
    });

    const issues = validateDocument(doc);
    const stage2Issues = issues.filter(
      (i) =>
        i.ruleId === "rule_height_harness" ||
        i.ruleId === "rule_height_protection" ||
        i.ruleId === "rule_fire_extinguisher"
    );
    expect(stage2Issues.length).toBe(3);
  });

  test("Missing required fields: Stage 1 validation", () => {
    const doc = createBaseDoc({
      fields: {
        점검일자: null,
        현장명: null,
        작업내용: null,
        작업인원: null,
      },
      checklist: createChecklist([
        { id: "ppe_01", value: "✔" },
        { id: "fall_01", value: "✖" },
      ]),
    });

    const issues = validateDocument(doc);
    expect(issues.some((i) => i.title === "점검일자 누락")).toBe(true);
    expect(issues.some((i) => i.title === "현장명 누락")).toBe(true);
    expect(issues.some((i) => i.title === "작업내용 누락")).toBe(true);
  });

  test("Missing signatures: Stage 1 validation", () => {
    const doc = createBaseDoc({
      signature: {
        담당: "missing",
        소장: "missing",
      },
      checklist: createChecklist([
        { id: "ppe_01", value: "✔" },
        { id: "fall_01", value: "✖" },
      ]),
    });

    const issues = validateDocument(doc);
    expect(issues.some((i) => i.title === "담당자 서명 누락")).toBe(true);
    expect(issues.some((i) => i.title === "관리책임자 서명 미비")).toBe(true);
  });
});

// ============================================================
// Test Suite: Edge Cases
// ============================================================

describe("Edge Cases", () => {
  test("Empty checklist: Should flag as error", () => {
    const doc = createBaseDoc({ checklist: [] });
    const issues = validateDocument(doc);
    expect(issues.some((i) => i.ruleId === "completeness_no_checklist")).toBe(true);
  });

  test("Checklist with null values: Should not trigger false positives", () => {
    const checklist = createChecklist([
      { id: "fall_01", value: null },
      { id: "ppe_03", value: null },
    ]);

    const issues = validateChecklistConsistency(checklist);
    // Null values should not trigger violations (only ✔ + ✖ combinations trigger)
    expect(issues.some((i) => i.ruleId === "rule_height_harness")).toBe(false);
  });

  test("Checklist with only one item: Should flag as too short", () => {
    const checklist = createChecklist([{ id: "ppe_01", value: "✔" }]);

    const issues = validateChecklistCompleteness(checklist);
    expect(issues.some((i) => i.ruleId === "completeness_too_short")).toBe(true);
  });

  test("Rule guidance and reference included in issues", () => {
    const checklist = createChecklist([
      { id: "fall_01", value: "✔" },
      { id: "ppe_03", value: "✖" },
    ]);

    const issues = validateChecklistConsistency(checklist);
    const heightIssue = issues.find((i) => i.ruleId === "rule_height_harness");

    expect(heightIssue).toBeDefined();
    expect(heightIssue?.message).toContain("→"); // Guidance marker
    expect(heightIssue?.message).toContain("📋"); // Reference marker
  });
});
