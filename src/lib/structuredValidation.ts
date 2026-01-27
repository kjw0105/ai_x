/**
 * structuredValidation.ts - Structured Master Plan Validation Engine
 *
 * This module implements automated validation against structured master plans,
 * replacing AI-dependent validation with deterministic rule-based checks.
 *
 * @module structuredValidation
 * @version 1.0.0
 */

import type {
  MasterSafetyPlan,
  StructuredValidationIssue,
  RiskLevel
} from "./masterPlanSchema";
import type { DocData, ChecklistItem } from "./validator";

// ============================================================
// Main Validation Function
// ============================================================

/**
 * Validate document against structured master plan
 * This replaces free-text AI validation with deterministic checks
 */
export function validateAgainstStructuredPlan(
  document: DocData,
  masterPlan: MasterSafetyPlan
): StructuredValidationIssue[] {
  const issues: StructuredValidationIssue[] = [];

  // 1. Weather validation
  issues.push(...validateWeatherConditions(document, masterPlan));

  // 2. Height work validation
  issues.push(...validateHeightWork(document, masterPlan));

  // 3. Hot work validation
  issues.push(...validateHotWork(document, masterPlan));

  // 4. Confined space validation
  issues.push(...validateConfinedSpace(document, masterPlan));

  // 5. Excavation validation
  issues.push(...validateExcavation(document, masterPlan));

  // 6. Electrical work validation
  issues.push(...validateElectricalWork(document, masterPlan));

  // 7. Personnel validation
  issues.push(...validatePersonnel(document, masterPlan));

  // 8. Risk level validation
  issues.push(...validateRiskLevel(document, masterPlan));

  return issues;
}

// ============================================================
// Weather Validation
// ============================================================

function validateWeatherConditions(
  document: DocData,
  masterPlan: MasterSafetyPlan
): StructuredValidationIssue[] {
  const issues: StructuredValidationIssue[] = [];

  // Wind speed check
  if (masterPlan.weatherLimits.windSpeed && document.fields?.풍속) {
    const windSpeed = parseFloat(document.fields.풍속);
    if (!isNaN(windSpeed) && windSpeed > masterPlan.weatherLimits.windSpeed.max) {
      const limit = masterPlan.weatherLimits.windSpeed;
      issues.push({
        severity: limit.action === "stop" ? "error" : "warn",
        category: "weather",
        ruleId: "weather_wind_exceeded",
        title: "기상 조건 위반 - 풍속 초과",
        titleEn: "Weather Violation - Wind Speed Exceeded",
        message: `풍속 ${windSpeed}${limit.unit}는 한계치 ${limit.max}${limit.unit}를 초과합니다.\n${limit.note || ""}`,
        messageEn: `Wind speed ${windSpeed}${limit.unit} exceeds limit of ${limit.max}${limit.unit}`,
        masterPlanReference: {
          section: "weatherLimits.windSpeed",
          expectedValue: `<= ${limit.max}${limit.unit}`,
          actualValue: `${windSpeed}${limit.unit}`
        },
        remediation: limit.action === "stop"
          ? "작업을 즉시 중단하고 기상 조건 개선 후 재개하세요."
          : "작업 범위를 제한하고 추가 안전 조치를 취하세요.",
        remediationEn: limit.action === "stop"
          ? "Stop work immediately and resume after weather improves."
          : "Restrict work scope and take additional safety measures.",
        regulation: "산업안전보건기준에 관한 규칙 제38조"
      });
    }
  }

  // Temperature check
  if (masterPlan.weatherLimits.temperature && document.fields?.기온) {
    const temp = parseFloat(document.fields.기온);
    const limit = masterPlan.weatherLimits.temperature;

    if (!isNaN(temp) && (temp < limit.min || temp > limit.max)) {
      issues.push({
        severity: limit.action === "stop" ? "error" : "warn",
        category: "weather",
        ruleId: "weather_temperature_exceeded",
        title: "기상 조건 위반 - 온도",
        titleEn: "Weather Violation - Temperature",
        message: `기온 ${temp}${limit.unit}는 허용 범위(${limit.min}~${limit.max}${limit.unit})를 벗어납니다.\n${limit.note || ""}`,
        messageEn: `Temperature ${temp}${limit.unit} is outside acceptable range (${limit.min}-${limit.max}${limit.unit})`,
        masterPlanReference: {
          section: "weatherLimits.temperature",
          expectedValue: `${limit.min}~${limit.max}${limit.unit}`,
          actualValue: `${temp}${limit.unit}`
        },
        remediation: "한파/폭염 대비 조치를 취하거나 작업을 중단하세요.",
        remediationEn: "Take measures for extreme weather or stop work."
      });
    }
  }

  // Rainfall check
  if (masterPlan.weatherLimits.rainfall && document.fields?.강우량) {
    const rainfall = parseFloat(document.fields.강우량);
    const limit = masterPlan.weatherLimits.rainfall;

    if (!isNaN(rainfall) && rainfall > limit.max) {
      issues.push({
        severity: limit.action === "stop" ? "error" : "warn",
        category: "weather",
        ruleId: "weather_rainfall_exceeded",
        title: "기상 조건 위반 - 강우",
        titleEn: "Weather Violation - Rainfall",
        message: `강우량 ${rainfall}${limit.unit}는 한계치 ${limit.max}${limit.unit}를 초과합니다.\n${limit.note || ""}`,
        messageEn: `Rainfall ${rainfall}${limit.unit} exceeds limit of ${limit.max}${limit.unit}`,
        masterPlanReference: {
          section: "weatherLimits.rainfall",
          expectedValue: `<= ${limit.max}${limit.unit}`,
          actualValue: `${rainfall}${limit.unit}`
        },
        remediation: "우천 시 외부 작업을 중단하세요.",
        remediationEn: "Stop outdoor work during rainfall."
      });
    }
  }

  return issues;
}

// ============================================================
// Height Work Validation
// ============================================================

function validateHeightWork(
  document: DocData,
  masterPlan: MasterSafetyPlan
): StructuredValidationIssue[] {
  const issues: StructuredValidationIssue[] = [];

  const heightWorkReq = masterPlan.workRequirements.heightWork;
  if (!heightWorkReq?.enabled || !document.checklist) return issues;

  const heightWork = document.checklist.find(c => c.id === "fall_01");
  if (heightWork?.value !== "✔") return issues;  // Not doing height work

  // Check required PPE
  for (const ppe of heightWorkReq.requiredPPE) {
    if (!ppe.mandatory) continue;

    const ppeId = getPPEId(ppe.item);
    const ppeItem = document.checklist.find(c => c.id === ppeId);

    if (!ppeItem || ppeItem.value !== "✔") {
      issues.push({
        severity: "error",
        category: "work_requirement",
        ruleId: `height_work_ppe_${ppeId}`,
        title: `고소작업 필수 보호구 미착용 - ${ppe.item}`,
        titleEn: `Height Work PPE Missing - ${ppe.itemEn}`,
        message: `고소작업(${heightWorkReq.definition.minHeight}${heightWorkReq.definition.unit} 이상) 시 ${ppe.item} 착용이 필수입니다.`,
        messageEn: `${ppe.itemEn} is mandatory for height work (above ${heightWorkReq.definition.minHeight}${heightWorkReq.definition.unit})`,
        masterPlanReference: {
          section: "workRequirements.heightWork.requiredPPE",
          expectedValue: `${ppe.item} 착용 필수`,
          actualValue: ppeItem ? ppeItem.value : "확인 안 됨"
        },
        remediation: `${ppe.item}를 착용하고 체크리스트를 다시 작성하세요.`,
        remediationEn: `Wear ${ppe.itemEn} and re-submit checklist.`,
        regulation: ppe.standard || "산업안전보건기준에 관한 규칙 제42조"
      });
    }
  }

  // Check fall protection
  if (heightWorkReq.fallProtectionMandatory) {
    const fallProtection = document.checklist.find(c => c.id === "fall_02");
    if (!fallProtection || fallProtection.value !== "✔") {
      issues.push({
        severity: "error",
        category: "work_requirement",
        ruleId: "height_work_fall_protection",
        title: "고소작업 추락방호장치 미설치",
        titleEn: "Height Work Fall Protection Missing",
        message: `고소작업 시 추락방호장치 설치가 필수입니다.`,
        messageEn: "Fall protection system is mandatory for height work",
        masterPlanReference: {
          section: "workRequirements.heightWork.fallProtectionMandatory",
          expectedValue: "추락방호장치 설치 필수",
          actualValue: fallProtection ? fallProtection.value : "확인 안 됨"
        },
        remediation: "추락방호망, 안전난간 등 추락방호장치를 설치하세요.",
        remediationEn: "Install fall protection such as safety nets or guardrails.",
        regulation: "산업안전보건기준에 관한 규칙 제43조"
      });
    }
  }

  return issues;
}

// ============================================================
// Hot Work Validation
// ============================================================

function validateHotWork(
  document: DocData,
  masterPlan: MasterSafetyPlan
): StructuredValidationIssue[] {
  const issues: StructuredValidationIssue[] = [];

  const hotWorkReq = masterPlan.workRequirements.hotWork;
  if (!hotWorkReq?.enabled || !document.checklist) return issues;

  const hotWork = document.checklist.find(c => c.id === "fire_01");
  if (hotWork?.value !== "✔") return issues;  // Not doing hot work

  // Check fire extinguishers
  const extinguisher = document.checklist.find(c => c.id === "fire_02");
  if (!extinguisher || extinguisher.value !== "✔") {
    issues.push({
      severity: "error",
      category: "work_requirement",
      ruleId: "hot_work_extinguisher",
      title: "화기작업 소화기 미비치",
      titleEn: "Hot Work Fire Extinguisher Missing",
      message: `화기작업 시 ${hotWorkReq.fireExtinguishers.type} 소화기 최소 ${hotWorkReq.fireExtinguishers.min}개를 ${hotWorkReq.fireExtinguishers.placement}에 비치해야 합니다.`,
      messageEn: `At least ${hotWorkReq.fireExtinguishers.min} ${hotWorkReq.fireExtinguishers.type} fire extinguishers must be placed ${hotWorkReq.fireExtinguishers.placement}`,
      masterPlanReference: {
        section: "workRequirements.hotWork.fireExtinguishers",
        expectedValue: `${hotWorkReq.fireExtinguishers.min}개 이상`,
        actualValue: extinguisher ? extinguisher.value : "확인 안 됨"
      },
      remediation: `작업 반경 ${hotWorkReq.clearanceRadius.value}${hotWorkReq.clearanceRadius.unit} 이내에 소화기를 배치하세요.`,
      remediationEn: `Place fire extinguishers within ${hotWorkReq.clearanceRadius.value}${hotWorkReq.clearanceRadius.unit} radius.`,
      regulation: "산업안전보건기준에 관한 규칙 제241조"
    });
  }

  // Check spark shield
  if (hotWorkReq.sparkShieldRequired) {
    const sparkShield = document.checklist.find(c => c.id === "fire_03");
    if (!sparkShield || sparkShield.value !== "✔") {
      issues.push({
        severity: "warn",
        category: "work_requirement",
        ruleId: "hot_work_spark_shield",
        title: "화기작업 불티비산 방지조치 미비",
        titleEn: "Hot Work Spark Prevention Missing",
        message: "화기작업 시 불티비산 방지조치가 필요합니다.",
        messageEn: "Spark prevention measures required for hot work",
        masterPlanReference: {
          section: "workRequirements.hotWork.sparkShieldRequired",
          expectedValue: "불티비산 방지조치 필수",
          actualValue: sparkShield ? sparkShield.value : "확인 안 됨"
        },
        remediation: "방화포를 설치하고 가연물을 제거하세요.",
        remediationEn: "Install fire blankets and remove combustibles."
      });
    }
  }

  return issues;
}

// ============================================================
// Confined Space Validation
// ============================================================

function validateConfinedSpace(
  document: DocData,
  masterPlan: MasterSafetyPlan
): StructuredValidationIssue[] {
  const issues: StructuredValidationIssue[] = [];

  const confinedReq = masterPlan.workRequirements.confinedSpace;
  if (!confinedReq?.enabled || !document.checklist) return issues;

  const confinedWork = document.checklist.find(c => c.id === "conf_01");
  if (confinedWork?.value !== "✔") return issues;  // Not doing confined space work

  // Check required tests
  for (const test of confinedReq.requiredTests) {
    if (!test.mandatory) continue;

    const testId = getConfinedSpaceTestId(test.test);
    const testItem = document.checklist.find(c => c.id === testId);

    if (!testItem || testItem.value !== "✔") {
      issues.push({
        severity: "error",
        category: "work_requirement",
        ruleId: `confined_space_${testId}`,
        title: `밀폐공간 필수 측정 미실시 - ${test.test}`,
        titleEn: `Confined Space Required Test Missing - ${test.testEn}`,
        message: `밀폐공간 작업 시 ${test.test}이 필수입니다. 기준: ${test.threshold.min || ""}${test.threshold.min && test.threshold.max ? "~" : ""}${test.threshold.max || ""}${test.threshold.unit}`,
        messageEn: `${test.testEn} is mandatory for confined space work. Threshold: ${test.threshold.min || ""}${test.threshold.min && test.threshold.max ? "-" : ""}${test.threshold.max || ""}${test.threshold.unit}`,
        masterPlanReference: {
          section: "workRequirements.confinedSpace.requiredTests",
          expectedValue: `${test.test} 실시`,
          actualValue: testItem ? testItem.value : "확인 안 됨"
        },
        remediation: `${test.test}을 실시하고 안전 기준을 확인하세요.`,
        remediationEn: `Perform ${test.testEn} and verify safety standards.`,
        regulation: "산업안전보건기준에 관한 규칙 제619조"
      });
    }
  }

  // Check ventilation
  if (confinedReq.ventilationRequired) {
    const ventilation = document.checklist.find(c => c.id === "conf_03");
    if (!ventilation || ventilation.value !== "✔") {
      issues.push({
        severity: "error",
        category: "work_requirement",
        ruleId: "confined_space_ventilation",
        title: "밀폐공간 환기조치 미실시",
        titleEn: "Confined Space Ventilation Missing",
        message: "밀폐공간 작업 시 환기조치가 필수입니다.",
        messageEn: "Ventilation is mandatory for confined space work",
        masterPlanReference: {
          section: "workRequirements.confinedSpace.ventilationRequired",
          expectedValue: "환기조치 필수",
          actualValue: ventilation ? ventilation.value : "확인 안 됨"
        },
        remediation: "강제 환기장치를 가동하세요.",
        remediationEn: "Operate forced ventilation system.",
        regulation: "산업안전보건기준에 관한 규칙 제620조"
      });
    }
  }

  return issues;
}

// ============================================================
// Excavation Validation
// ============================================================

function validateExcavation(
  document: DocData,
  masterPlan: MasterSafetyPlan
): StructuredValidationIssue[] {
  const issues: StructuredValidationIssue[] = [];

  const excavationReq = masterPlan.workRequirements.excavation;
  if (!excavationReq?.enabled || !document.checklist) return issues;

  const excavation = document.checklist.find(c => c.id === "exc_01");
  if (excavation?.value !== "✔") return issues;  // Not doing excavation

  // Check shoring
  const shoring = document.checklist.find(c => c.id === "exc_02");
  if (!shoring || shoring.value !== "✔") {
    issues.push({
      severity: "error",
      category: "work_requirement",
      ruleId: "excavation_shoring",
      title: "굴착작업 흙막이 미설치",
      titleEn: "Excavation Shoring Missing",
      message: `굴착 깊이 ${excavationReq.maxDepthWithoutShoring.value}${excavationReq.maxDepthWithoutShoring.unit} 이상 시 흙막이 설치가 필수입니다.`,
      messageEn: `Shoring is mandatory for excavation deeper than ${excavationReq.maxDepthWithoutShoring.value}${excavationReq.maxDepthWithoutShoring.unit}`,
      masterPlanReference: {
        section: "workRequirements.excavation",
        expectedValue: "흙막이 설치 필수",
        actualValue: shoring ? shoring.value : "확인 안 됨"
      },
      remediation: "지반 붕괴 방지를 위해 흙막이 지보공을 설치하세요.",
      remediationEn: "Install shoring to prevent ground collapse.",
      regulation: "산업안전보건기준에 관한 규칙 제340조"
    });
  }

  // Check ladder
  const ladder = document.checklist.find(c => c.id === "exc_03");
  if (!ladder || ladder.value !== "✔") {
    issues.push({
      severity: "error",
      category: "work_requirement",
      ruleId: "excavation_ladder",
      title: "굴착작업 탈출사다리 미설치",
      titleEn: "Excavation Exit Ladder Missing",
      message: `근로자로부터 ${excavationReq.exitRequirements.maxDistance}${excavationReq.exitRequirements.unit} 이내에 탈출사다리를 설치해야 합니다.`,
      messageEn: `Exit ladder must be installed within ${excavationReq.exitRequirements.maxDistance}${excavationReq.exitRequirements.unit} of workers`,
      masterPlanReference: {
        section: "workRequirements.excavation.exitRequirements",
        expectedValue: "탈출사다리 설치 필수",
        actualValue: ladder ? ladder.value : "확인 안 됨"
      },
      remediation: "탈출용 사다리를 설치하세요.",
      remediationEn: "Install exit ladder.",
      regulation: "산업안전보건기준에 관한 규칙 제343조"
    });
  }

  return issues;
}

// ============================================================
// Electrical Work Validation
// ============================================================

function validateElectricalWork(
  document: DocData,
  masterPlan: MasterSafetyPlan
): StructuredValidationIssue[] {
  const issues: StructuredValidationIssue[] = [];

  const electricalReq = masterPlan.workRequirements.electrical;
  if (!electricalReq?.enabled || !document.checklist) return issues;

  const electricalWork = document.checklist.find(c => c.id === "elec_02");
  if (electricalWork?.value !== "✔") return issues;  // Not doing electrical work

  // Check lockout/tagout
  if (electricalReq.lockoutTagoutRequired) {
    const lockout = document.checklist.find(c => c.id === "elec_03");
    if (!lockout || lockout.value !== "✔") {
      issues.push({
        severity: "error",
        category: "work_requirement",
        ruleId: "electrical_lockout",
        title: "전기작업 잠금장치(LOTO) 미적용",
        titleEn: "Electrical Work Lockout/Tagout Missing",
        message: "전기작업 시 잠금장치(LOTO) 적용이 필수입니다.",
        messageEn: "Lockout/Tagout is mandatory for electrical work",
        masterPlanReference: {
          section: "workRequirements.electrical.lockoutTagoutRequired",
          expectedValue: "LOTO 적용 필수",
          actualValue: lockout ? lockout.value : "확인 안 됨"
        },
        remediation: "전원 차단 후 잠금장치 및 꼬리표를 부착하세요.",
        remediationEn: "Apply lockout/tagout after power isolation.",
        regulation: "산업안전보건기준에 관한 규칙 제301조"
      });
    }
  }

  return issues;
}

// ============================================================
// Personnel Validation
// ============================================================

function validatePersonnel(
  document: DocData,
  masterPlan: MasterSafetyPlan
): StructuredValidationIssue[] {
  const issues: StructuredValidationIssue[] = [];

  const personnelReq = masterPlan.personnelRequirements;

  // Check minimum workers
  if (personnelReq.minWorkers && document.fields?.작업인원) {
    const workers = parseInt(document.fields.작업인원);
    if (!isNaN(workers) && workers < personnelReq.minWorkers) {
      issues.push({
        severity: "warn",
        category: "personnel",
        ruleId: "personnel_min_workers",
        title: "최소 작업인원 미달",
        titleEn: "Below Minimum Worker Count",
        message: `최소 ${personnelReq.minWorkers}명 이상의 작업인원이 필요합니다. 현재: ${workers}명`,
        messageEn: `Minimum ${personnelReq.minWorkers} workers required. Current: ${workers}`,
        masterPlanReference: {
          section: "personnelRequirements.minWorkers",
          expectedValue: `>= ${personnelReq.minWorkers}명`,
          actualValue: `${workers}명`
        },
        remediation: "작업인원을 증원하세요.",
        remediationEn: "Increase worker count."
      });
    }
  }

  // Check maximum workers
  if (personnelReq.maxWorkers && document.fields?.작업인원) {
    const workers = parseInt(document.fields.작업인원);
    if (!isNaN(workers) && workers > personnelReq.maxWorkers) {
      issues.push({
        severity: "warn",
        category: "personnel",
        ruleId: "personnel_max_workers",
        title: "최대 작업인원 초과",
        titleEn: "Above Maximum Worker Count",
        message: `최대 ${personnelReq.maxWorkers}명까지 작업 가능합니다. 현재: ${workers}명`,
        messageEn: `Maximum ${personnelReq.maxWorkers} workers allowed. Current: ${workers}`,
        masterPlanReference: {
          section: "personnelRequirements.maxWorkers",
          expectedValue: `<= ${personnelReq.maxWorkers}명`,
          actualValue: `${workers}명`
        },
        remediation: "작업인원을 줄이거나 작업 구역을 분할하세요.",
        remediationEn: "Reduce worker count or divide work area."
      });
    }
  }

  return issues;
}

// ============================================================
// Risk Level Validation
// ============================================================

function validateRiskLevel(
  document: DocData,
  masterPlan: MasterSafetyPlan
): StructuredValidationIssue[] {
  const issues: StructuredValidationIssue[] = [];

  // If document has risk level, validate against site risk level
  if (document.riskLevel && masterPlan.site.riskLevel) {
    // If site is high-risk but document claims low/medium, flag it
    if (masterPlan.site.riskLevel === "high" || masterPlan.site.riskLevel === "critical") {
      if (document.riskLevel === "low" || document.riskLevel === "medium") {
        issues.push({
          severity: "error",
          category: "risk_level",
          ruleId: "risk_level_mismatch",
          title: "위험도 평가 오류",
          titleEn: "Risk Level Mismatch",
          message: `현장 전체 위험도는 '${masterPlan.site.riskLevel}'이나, 문서는 '${document.riskLevel}'로 기재되어 있습니다. 위험도 재평가가 필요합니다.`,
          messageEn: `Site risk level is '${masterPlan.site.riskLevel}' but document shows '${document.riskLevel}'. Risk re-assessment required.`,
          masterPlanReference: {
            section: "site.riskLevel",
            expectedValue: masterPlan.site.riskLevel,
            actualValue: document.riskLevel
          },
          remediation: "마스터 플랜의 위험도 기준에 맞게 문서를 수정하세요.",
          remediationEn: "Update document to match master plan risk level."
        });
      }
    }
  }

  return issues;
}

// ============================================================
// Helper Functions
// ============================================================

function getPPEId(ppeName: string): string {
  const mapping: Record<string, string> = {
    "안전모": "ppe_01",
    "안전화": "ppe_02",
    "안전대": "ppe_03",
    "보안경": "ppe_04",
    "귀마개": "ppe_05"
  };
  return mapping[ppeName] || "";
}

function getConfinedSpaceTestId(testName: string): string {
  const mapping: Record<string, string> = {
    "산소농도측정": "conf_02",
    "유해가스측정": "conf_02",
    "환기조치": "conf_03"
  };
  return mapping[testName] || "";
}
