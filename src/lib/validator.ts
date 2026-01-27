
// ============================================================
// Stage 2-5: Extended Types for Full Validation Framework
// ============================================================

export type ChecklistValue = "✔" | "✖" | "N/A" | null;

export interface ChecklistItem {
  id: string;
  category: string;
  nameKo: string;
  value: ChecklistValue;
}

export interface DocData {
  docType: "산업안전 점검표" | "위험성 평가 보고서" | "작업 전 안전점검표" | "TBM" | "unknown";
  fields: {
    점검일자: string | null;
    현장명: string | null;
    작업내용: string | null;
    작업인원: string | null;
  };
  signature: {
    담당: "present" | "missing" | "unknown";
    소장: "present" | "missing" | "unknown";
  };
  // Stage 2: Checklist items for intra-document logic
  checklist?: ChecklistItem[];
  // Stage 3: Risk level for cross-document consistency
  riskLevel?: "high" | "medium" | "low";
  // Stage 4: Inspector name for pattern analysis
  inspectorName?: string;
}

export type Severity = "error" | "warn" | "info";

export interface ValidationIssue {
  severity: Severity;
  title: string;
  message: string;
  ruleId?: string; // Stage 2: Link to specific rule that triggered this issue
}

export type Issue = ValidationIssue & { id?: string };

// ============================================================
// Stage 2: IF-THEN Consistency Rules
// ============================================================

interface ConsistencyRule {
  id: string;
  descriptionKo: string;
  severity: Severity;
  // Returns true if violation detected
  check: (checklist: ChecklistItem[]) => boolean;
}

const CONSISTENCY_RULES: ConsistencyRule[] = [
  {
    id: "rule_height_harness",
    descriptionKo: "고소작업 시 안전대 착용 필수",
    severity: "error",
    check: (checklist) => {
      const heightWork = checklist.find((c) => c.id === "fall_01");
      const harness = checklist.find((c) => c.id === "ppe_03");
      return heightWork?.value === "✔" && harness?.value === "✖";
    },
  },
  {
    id: "rule_height_contradiction",
    descriptionKo: "고소작업 미실시이나 추락방호장치 사용 - 기록 불일치",
    severity: "warn",
    check: (checklist) => {
      const heightWork = checklist.find((c) => c.id === "fall_01");
      const fallProtection = checklist.find((c) => c.id === "fall_02");
      return heightWork?.value === "✖" && fallProtection?.value === "✔";
    },
  },
  {
    id: "rule_fire_extinguisher",
    descriptionKo: "화기작업 시 소화기 비치 필수",
    severity: "error",
    check: (checklist) => {
      const hotWork = checklist.find((c) => c.id === "fire_01");
      const extinguisher = checklist.find((c) => c.id === "fire_02");
      return hotWork?.value === "✔" && extinguisher?.value === "✖";
    },
  },
  {
    id: "rule_confined_oxygen",
    descriptionKo: "밀폐공간 작업 시 산소농도 측정 필수",
    severity: "error",
    check: (checklist) => {
      const confined = checklist.find((c) => c.id === "conf_01");
      const oxygen = checklist.find((c) => c.id === "conf_02");
      return confined?.value === "✔" && oxygen?.value === "✖";
    },
  },
  {
    id: "rule_confined_ventilation",
    descriptionKo: "밀폐공간 작업 시 환기조치 필수",
    severity: "error",
    check: (checklist) => {
      const confined = checklist.find((c) => c.id === "conf_01");
      const ventilation = checklist.find((c) => c.id === "conf_03");
      return confined?.value === "✔" && ventilation?.value === "✖";
    },
  },
  {
    id: "rule_excavation_shoring",
    descriptionKo: "굴착작업 시 흙막이 설치 필수",
    severity: "error",
    check: (checklist) => {
      const excavation = checklist.find((c) => c.id === "exc_01");
      const shoring = checklist.find((c) => c.id === "exc_02");
      return excavation?.value === "✔" && shoring?.value === "✖";
    },
  },
  {
    id: "rule_excavation_ladder",
    descriptionKo: "굴착작업 시 탈출사다리 설치 필수",
    severity: "error",
    check: (checklist) => {
      const excavation = checklist.find((c) => c.id === "exc_01");
      const ladder = checklist.find((c) => c.id === "exc_03");
      return excavation?.value === "✔" && ladder?.value === "✖";
    },
  },
  {
    id: "rule_electrical_lockout",
    descriptionKo: "전기작업 시 잠금장치(LOTO) 적용 필수",
    severity: "error",
    check: (checklist) => {
      const electrical = checklist.find((c) => c.id === "elec_02");
      const lockout = checklist.find((c) => c.id === "elec_03");
      return electrical?.value === "✔" && lockout?.value === "✖";
    },
  },
];

/**
 * Stage 2: Validate intra-checklist logic consistency
 * Checks IF-THEN rules within a single document
 */
export function validateChecklistConsistency(checklist: ChecklistItem[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const rule of CONSISTENCY_RULES) {
    if (rule.check(checklist)) {
      issues.push({
        severity: rule.severity,
        title: "논리적 불일치 발견",
        message: rule.descriptionKo,
        ruleId: rule.id,
      });
    }
  }

  return issues;
}

export function validateDocument(data: DocData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. 필수 필드 검증
  if (!data.fields.점검일자) {
    issues.push({
      severity: "error",
      title: "점검일자 누락",
      message: "점검일자가 식별되지 않았습니다.",
    });
  }

  if (!data.fields.현장명) {
    issues.push({
      severity: "error",
      title: "현장명 누락",
      message: "현장명이 기재되지 않았습니다.",
    });
  }

  if (!data.fields.작업내용) {
    issues.push({
      severity: "error",
      title: "작업내용 누락",
      message: "작업내용이 상세히 기술되지 않았습니다.",
    });
  }

  // 2. 결재/서명 검증
  // 담당자 서명은 필수
  if (data.signature.담당 !== "present") {
    issues.push({
      severity: "error",
      title: "담당자 서명 누락",
      message: "담당자 결재란이 비어있거나 식별되지 않습니다.",
    });
  }

  // 소장 서명은 경고(상황에 따라 다를 수 있으므로)
  if (data.signature.소장 !== "present") {
    issues.push({
      severity: "warn",
      title: "관리책임자 서명 미비",
      message: "현장소장(관리책임자)의 서명이 확인되지 않았습니다.",
    });
  }

  // 3. 작업인원 검증
  if (!data.fields.작업인원) {
    issues.push({
      severity: "warn",
      title: "작업인원 미기재",
      message: "투입 인원 수가 확인되지 않습니다.",
    });
  }

  // 4. Stage 2: Checklist Logic Consistency
  if (data.checklist && data.checklist.length > 0) {
    const checklistIssues = validateChecklistConsistency(data.checklist);
    issues.push(...checklistIssues);
  }

  return issues;
}
