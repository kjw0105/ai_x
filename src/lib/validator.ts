
export interface DocData {
  docType: "산업안전 점검표" | "위험성 평가 보고서" | "작업 전 안전점검표" | "unknown";
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
}

export type Severity = "error" | "warn" | "info";

export interface ValidationIssue {
  severity: Severity;
  title: string;
  message: string;
}

export type Issue = ValidationIssue & { id?: string };

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

  return issues;
}
