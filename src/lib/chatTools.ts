/**
 * Chat Tools for MCP-style function calling
 * Provides contextual assistance for safety document validation
 */

import type { ValidationIssue } from "./validator";

// Rule metadata for explanations (subset of validation rules)
const RULE_METADATA: Record<string, {
  descriptionKo: string;
  category: string;
  severity: string;
  guidance: string;
}> = {
  rule_fall_contradiction: {
    descriptionKo: "추락 방지 조치 불일치",
    category: "logical_contradiction",
    severity: "warn",
    guidance: "고소작업(2m 이상)을 실시한다면 반드시 안전대와 추락방호장치가 필요합니다."
  },
  rule_fire_contradiction: {
    descriptionKo: "화기작업 안전조치 불일치",
    category: "logical_contradiction",
    severity: "warn",
    guidance: "화기작업 시 반드시 소화기 비치 및 불티비산 방지조치가 필요합니다."
  },
  rule_confined_space_contradiction: {
    descriptionKo: "밀폐공간 작업 안전조치 불일치",
    category: "logical_contradiction",
    severity: "warn",
    guidance: "밀폐공간 작업 시 반드시 산소농도 측정 및 환기조치가 필요합니다."
  },
  rule_excavation_contradiction: {
    descriptionKo: "굴착작업 안전조치 불일치",
    category: "logical_contradiction",
    severity: "warn",
    guidance: "굴착 깊이 1.5m 이상 시 흙막이 지보공 설치 및 탈출사다리가 필요합니다."
  },
  rule_electrical_contradiction: {
    descriptionKo: "전기작업 안전조치 불일치",
    category: "logical_contradiction",
    severity: "warn",
    guidance: "전기작업 시 반드시 잠금장치(LOTO) 및 전원차단이 필요합니다."
  },
  rule_missing_date: {
    descriptionKo: "점검일자 누락",
    category: "missing_field",
    severity: "error",
    guidance: "문서 상단의 점검일자 필드를 YYYY-MM-DD 형식으로 기입하세요."
  },
  rule_missing_inspector: {
    descriptionKo: "점검자 누락",
    category: "missing_field",
    severity: "error",
    guidance: "점검을 실시한 담당자의 이름을 점검자 필드에 기입하세요."
  },
  rule_missing_signature_worker: {
    descriptionKo: "담당자 서명 누락",
    category: "missing_signature",
    severity: "error",
    guidance: "담당자 서명란에 서명 또는 날인이 필요합니다."
  },
  rule_missing_signature_manager: {
    descriptionKo: "소장 서명 누락",
    category: "missing_signature",
    severity: "error",
    guidance: "관리책임자/소장 서명란에 서명 또는 날인이 필요합니다."
  },
  risk_matrix_critical_factors: {
    descriptionKo: "위험 요인 식별",
    category: "risk_assessment",
    severity: "info",
    guidance: "문서에 표시된 고위험 작업 항목들을 확인하였습니다."
  }
};

// ============================================================================
// TOOL DEFINITIONS (OpenAI Function Calling Format)
// ============================================================================

export const CHAT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "explain_issue",
      description: "사용자가 특정 검증 이슈(경고/오류)에 대해 질문할 때 사용. 규칙 로직, 트리거 원인, 수정 방법을 상세히 설명합니다.",
      parameters: {
        type: "object",
        properties: {
          ruleId: {
            type: "string",
            description: "검증 규칙 ID (예: 'rule_fall_contradiction', 'rule_missing_date')"
          }
        },
        required: ["ruleId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_document_context",
      description: "현재 분석 중인 문서의 전체 정보를 조회합니다. 문서 요약, 체크리스트, 이슈 목록 등을 포함합니다.",
      parameters: {
        type: "object",
        properties: {
          includeChecklist: {
            type: "boolean",
            description: "체크리스트 전체 항목을 포함할지 여부 (기본값: true)",
            default: true
          }
        }
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "suggest_fix",
      description: "특정 검증 이슈를 해결하기 위한 구체적인 수정 방법을 단계별로 제공합니다.",
      parameters: {
        type: "object",
        properties: {
          issueId: {
            type: "string",
            description: "수정하려는 이슈의 UUID"
          }
        },
        required: ["issueId"]
      }
    }
  }
];

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

export interface ReportContext {
  docType?: string;
  fields?: Record<string, any>;
  signature?: Record<string, any>;
  inspectorName?: string;
  riskLevel?: string | null;
  checklist?: Array<{
    id: string;
    category: string;
    nameKo: string;
    value: "✔" | "✖" | "N/A" | null;
  }>;
  issues?: ValidationIssue[];
  chat?: Array<{ role: string; text: string }>;
}

// ----------------------------------------------------------------------------
// Tool 1: explain_issue
// ----------------------------------------------------------------------------

export function explainIssue(ruleId: string, context: ReportContext): string {
  // Find the rule definition
  const rule = RULE_METADATA[ruleId];

  if (!rule) {
    return `❌ 규칙 ID "${ruleId}"를 찾을 수 없습니다. 올바른 규칙 ID인지 확인해주세요.`;
  }

  // Analyze what triggered this rule
  const triggeredInfo = analyzeRuleTrigger(ruleId, context);

  // Build explanation
  let explanation = `## 📋 검증 규칙 설명: ${rule.descriptionKo}\n\n`;
  explanation += `**규칙 ID**: ${ruleId}\n`;
  explanation += `**분류**: ${rule.category}\n`;
  explanation += `**심각도**: ${getSeverityLabel(rule.severity)}\n\n`;

  explanation += `### ❓ 왜 이 경고가 발생했나요?\n\n`;
  explanation += `${rule.descriptionKo}\n\n`;

  if (triggeredInfo.items.length > 0) {
    explanation += `**현재 문서 상태**:\n`;
    triggeredInfo.items.forEach(item => {
      explanation += `- ${item}\n`;
    });
    explanation += `\n`;
  }

  explanation += `### 💡 수정 방법\n\n`;
  explanation += `${rule.guidance}\n\n`;

  // Add regulation reference if available
  const regulation = getRegulationReference(ruleId);
  if (regulation) {
    explanation += `### 📚 관련 법규\n\n`;
    explanation += `${regulation}\n\n`;
  }

  explanation += `---\n`;
  explanation += `💬 추가 질문이 있으시면 "이 문제를 어떻게 고치나요?" 또는 "예시를 보여주세요"라고 물어보세요.`;

  return explanation;
}

function analyzeRuleTrigger(ruleId: string, context: ReportContext): { items: string[] } {
  const items: string[] = [];

  if (!context.checklist || context.checklist.length === 0) {
    return { items };
  }

  // Analyze based on rule category
  if (ruleId.includes("fall")) {
    const fall01 = context.checklist?.find(c => c.id === "fall_01");
    const ppe03 = context.checklist?.find(c => c.id === "ppe_03");
    const fall02 = context.checklist?.find(c => c.id === "fall_02");

    if (fall01) items.push(`고소작업 실시 (fall_01): ${fall01.value || "미기재"}`);
    if (ppe03) items.push(`안전대 착용 (ppe_03): ${ppe03.value || "미기재"}`);
    if (fall02) items.push(`추락방호장치 설치 (fall_02): ${fall02.value || "미기재"}`);
  }

  if (ruleId.includes("fire")) {
    const fire01 = context.checklist?.find(c => c.id === "fire_01");
    const fire02 = context.checklist?.find(c => c.id === "fire_02");

    if (fire01) items.push(`화기작업 실시 (fire_01): ${fire01.value || "미기재"}`);
    if (fire02) items.push(`소화기 비치 (fire_02): ${fire02.value || "미기재"}`);
  }

  if (ruleId.includes("conf")) {
    const conf01 = context.checklist?.find(c => c.id === "conf_01");
    const conf02 = context.checklist?.find(c => c.id === "conf_02");
    const conf03 = context.checklist?.find(c => c.id === "conf_03");

    if (conf01) items.push(`밀폐공간 작업 (conf_01): ${conf01.value || "미기재"}`);
    if (conf02) items.push(`산소농도 측정 (conf_02): ${conf02.value || "미기재"}`);
    if (conf03) items.push(`환기조치 (conf_03): ${conf03.value || "미기재"}`);
  }

  if (ruleId.includes("exc")) {
    const exc01 = context.checklist.find(c => c.id === "exc_01");
    const exc02 = context.checklist.find(c => c.id === "exc_02");
    const exc03 = context.checklist.find(c => c.id === "exc_03");

    if (exc01) items.push(`굴착작업 실시 (exc_01): ${exc01.value || "미기재"}`);
    if (exc02) items.push(`흙막이 지보공 설치 (exc_02): ${exc02.value || "미기재"}`);
    if (exc03) items.push(`탈출사다리 설치 (exc_03): ${exc03.value || "미기재"}`);
  }

  if (ruleId.includes("elec")) {
    const elec02 = context.checklist.find(c => c.id === "elec_02");
    const elec03 = context.checklist.find(c => c.id === "elec_03");

    if (elec02) items.push(`전기작업 실시 (elec_02): ${elec02.value || "미기재"}`);
    if (elec03) items.push(`잠금장치(LOTO) (elec_03): ${elec03.value || "미기재"}`);
  }

  return { items };
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case "error": return "❌ 오류 (Error)";
    case "warn": return "⚠️  경고 (Warning)";
    case "info": return "ℹ️  정보 (Info)";
    default: return severity;
  }
}

function getRegulationReference(ruleId: string): string | null {
  const regulations: Record<string, string> = {
    rule_fall_contradiction: "**산업안전보건기준에 관한 규칙 제42조 (추락 등의 방지)**\n2m 이상 고소작업 시 안전난간, 안전대 등 추락방지 조치 의무\n→ [KOSHA GUIDE 참고](https://www.kosha.or.kr/)",
    rule_fire_contradiction: "**산업안전보건기준에 관한 규칙 제241조 (화재예방)**\n화기작업 시 소화기 비치 및 불티비산 방지조치 의무\n→ [KOSHA GUIDE 참고](https://www.kosha.or.kr/)",
    rule_confined_space_contradiction: "**산업안전보건기준에 관한 규칙 제618조 (밀폐공간 작업 프로그램)**\n밀폐공간 작업 시 산소농도 측정 및 환기조치 필수\n→ [KOSHA GUIDE 참고](https://www.kosha.or.kr/)",
    rule_excavation_contradiction: "**산업안전보건기준에 관한 규칙 제340조 (굴착작업 시 조치)**\n굴착 깊이 1.5m 이상 시 흙막이 지보공 설치 의무\n→ [KOSHA GUIDE 참고](https://www.kosha.or.kr/)",
    rule_electrical_contradiction: "**산업안전보건기준에 관한 규칙 제301조 (전기 기계·기구의 충전부 방호)**\n전기작업 시 잠금장치(LOTO) 및 전원차단 필수\n→ [KOSHA GUIDE 참고](https://www.kosha.or.kr/)"
  };

  return regulations[ruleId] || null;
}

// ----------------------------------------------------------------------------
// Tool 2: get_document_context
// ----------------------------------------------------------------------------

export function getDocumentContext(
  includeChecklist: boolean,
  context: ReportContext
): string {
  let summary = `## 📄 현재 문서 정보\n\n`;

  // Basic document info
  if (context.docType) {
    summary += `**문서 유형**: ${context.docType}\n`;
  }

  if (context.fields) {
    if (context.fields.점검일자) summary += `**점검일자**: ${context.fields.점검일자}\n`;
    if (context.fields.현장명) summary += `**현장명**: ${context.fields.현장명}\n`;
    if (context.fields.작업내용) summary += `**작업내용**: ${context.fields.작업내용}\n`;
    if (context.fields.작업인원) summary += `**작업인원**: ${context.fields.작업인원}\n`;
  }

  if (context.inspectorName) {
    summary += `**점검자**: ${context.inspectorName}\n`;
  }

  summary += `\n`;

  // Signature status
  if (context.signature) {
    summary += `### ✍️  서명 현황\n\n`;
    summary += `- 담당자 서명: ${context.signature.담당 === "present" ? "✅ 확인됨" : "❌ 누락"}\n`;
    summary += `- 소장 서명: ${context.signature.소장 === "present" ? "✅ 확인됨" : "❌ 누락"}\n\n`;
  }

  // Issues summary
  if (context.issues && context.issues.length > 0) {
    const errorCount = context.issues.filter(i => i.severity === "error").length;
    const warnCount = context.issues.filter(i => i.severity === "warn").length;
    const infoCount = context.issues.filter(i => i.severity === "info").length;

    summary += `### ⚠️  검증 결과\n\n`;
    summary += `- 오류: ${errorCount}건\n`;
    summary += `- 경고: ${warnCount}건\n`;
    summary += `- 정보: ${infoCount}건\n\n`;

    if (errorCount > 0 || warnCount > 0) {
      summary += `**주요 이슈**:\n`;
      context.issues
        .filter(i => i.severity === "error" || i.severity === "warn")
        .slice(0, 5)
        .forEach((issue, idx) => {
          const icon = issue.severity === "error" ? "❌" : "⚠️ ";
          summary += `${idx + 1}. ${icon} ${issue.title}\n`;
        });
      summary += `\n`;
    }
  } else {
    summary += `### ✅ 검증 결과\n\n이슈가 발견되지 않았습니다.\n\n`;
  }

  // Checklist (optional)
  if (includeChecklist && context.checklist && context.checklist.length > 0) {
    summary += `### 📋 체크리스트 상세\n\n`;

    const grouped = groupChecklistByCategory(context.checklist);

    Object.entries(grouped).forEach(([category, items]) => {
      summary += `**${category}**:\n`;
      items.forEach(item => {
        const icon = item.value === "✔" ? "✅" : item.value === "✖" ? "❌" : "➖";
        summary += `- ${icon} ${item.nameKo}: ${item.value || "미기재"}\n`;
      });
      summary += `\n`;
    });
  }

  summary += `---\n`;
  summary += `💬 특정 항목이나 이슈에 대해 질문하시려면 "rule_xxx 규칙을 설명해줘" 또는 "이슈를 어떻게 고치나요?"라고 물어보세요.`;

  return summary;
}

function groupChecklistByCategory(checklist: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  checklist.forEach(item => {
    const category = item.category || "기타";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });

  return grouped;
}

// ----------------------------------------------------------------------------
// Tool 3: suggest_fix
// ----------------------------------------------------------------------------

export function suggestFix(issueId: string, context: ReportContext): string {
  if (!context.issues || context.issues.length === 0) {
    return `❌ 현재 문서에 이슈가 없습니다.`;
  }

  const issue = context.issues.find(i => i.id === issueId);

  if (!issue) {
    return `❌ 이슈 ID "${issueId}"를 찾을 수 없습니다. 올바른 이슈 ID인지 확인해주세요.`;
  }

  let fixGuide = `## 🔧 수정 가이드\n\n`;
  fixGuide += `**이슈**: ${issue.title}\n`;
  fixGuide += `**심각도**: ${getSeverityLabel(issue.severity)}\n\n`;

  fixGuide += `### 📝 문제 상황\n\n`;
  fixGuide += `${issue.message}\n\n`;

  // Get rule-specific fix steps
  const fixSteps = generateFixSteps(issue.ruleId, context);

  fixGuide += `### ✅ 수정 방법\n\n`;
  fixSteps.forEach((step, idx) => {
    fixGuide += `${idx + 1}. ${step}\n`;
  });
  fixGuide += `\n`;

  // Add examples if available
  const example = generateFixExample(issue.ruleId, context);
  if (example) {
    fixGuide += `### 📌 수정 예시\n\n`;
    fixGuide += `**변경 전**:\n`;
    fixGuide += example.before + `\n\n`;
    fixGuide += `**변경 후**:\n`;
    fixGuide += example.after + `\n\n`;
  }

  // Prevention tips
  const tips = getPreventionTips(issue.ruleId);
  if (tips.length > 0) {
    fixGuide += `### 💡 재발 방지 팁\n\n`;
    tips.forEach(tip => {
      fixGuide += `- ${tip}\n`;
    });
    fixGuide += `\n`;
  }

  fixGuide += `---\n`;
  fixGuide += `💬 수정 후에는 문서를 다시 업로드하여 검증해주세요.`;

  return fixGuide;
}

function generateFixSteps(ruleId: string | undefined, context: ReportContext): string[] {
  if (!ruleId) return ["문서를 재확인하고 누락된 정보를 추가해주세요."];

  const steps: Record<string, string[]> = {
    rule_fall_contradiction: [
      "실제 작업 높이를 확인하세요 (2m 이상인가?)",
      "2m 이상이면: 체크리스트에서 '안전대 착용(ppe_03)'을 ✔로 변경",
      "2m 미만이면: '고소작업 실시(fall_01)'를 ✖로 변경",
      "추락방호장치(fall_02) 설치 여부도 함께 확인",
      "문서를 저장하고 다시 제출하세요"
    ],
    rule_fire_contradiction: [
      "화기작업 실시 여부를 재확인하세요",
      "화기작업을 실시하는 경우: '소화기 비치(fire_02)'를 ✔로 변경",
      "불티비산 방지조치도 함께 확인",
      "화기작업을 하지 않는 경우: 'fire_01'을 ✖로 변경",
      "문서를 저장하고 다시 제출하세요"
    ],
    rule_confined_space_contradiction: [
      "밀폐공간 작업 실시 여부를 재확인하세요",
      "밀폐공간 작업인 경우: '산소농도 측정(conf_02)' 및 '환기조치(conf_03)'를 ✔로 변경",
      "밀폐공간 작업이 아닌 경우: 'conf_01'을 ✖로 변경",
      "문서를 저장하고 다시 제출하세요"
    ],
    rule_excavation_contradiction: [
      "굴착 깊이를 확인하세요 (1.5m 이상인가?)",
      "1.5m 이상이면: '흙막이 지보공 설치(exc_02)' 및 '탈출사다리(exc_03)'를 ✔로 변경",
      "1.5m 미만이면: 'exc_01'을 ✖로 변경",
      "문서를 저장하고 다시 제출하세요"
    ],
    rule_electrical_contradiction: [
      "전기작업 실시 여부를 재확인하세요",
      "전기작업인 경우: '잠금장치(LOTO)(elec_03)'를 ✔로 변경",
      "전기작업이 아닌 경우: 'elec_02'를 ✖로 변경",
      "문서를 저장하고 다시 제출하세요"
    ],
    rule_missing_date: [
      "문서 상단의 '점검일자' 필드를 확인하세요",
      "점검을 실시한 날짜를 YYYY-MM-DD 형식으로 기입하세요",
      "예: 2026-02-04",
      "문서를 저장하고 다시 제출하세요"
    ],
    rule_missing_inspector: [
      "문서 하단의 '점검자' 또는 '담당자' 필드를 확인하세요",
      "점검을 실시한 담당자의 이름을 기입하세요",
      "서명란도 함께 확인하세요",
      "문서를 저장하고 다시 제출하세요"
    ]
  };

  return steps[ruleId] || [
    "문서를 재확인하고 누락된 정보를 추가해주세요",
    "해당 규칙의 설명을 확인하여 요구사항을 파악하세요",
    "문서를 저장하고 다시 제출하세요"
  ];
}

function generateFixExample(ruleId: string | undefined, context: ReportContext): { before: string; after: string } | null {
  if (!ruleId) return null;

  const examples: Record<string, { before: string; after: string }> = {
    rule_fall_contradiction: {
      before: "```\nfall_01 (고소작업 실시): ✔\nppe_03 (안전대 착용): ✖\n```",
      after: "```\nfall_01 (고소작업 실시): ✔\nppe_03 (안전대 착용): ✔  ← 수정됨\nfall_02 (추락방호장치): ✔  ← 함께 확인\n```"
    },
    rule_fire_contradiction: {
      before: "```\nfire_01 (화기작업 실시): ✔\nfire_02 (소화기 비치): ✖\n```",
      after: "```\nfire_01 (화기작업 실시): ✔\nfire_02 (소화기 비치): ✔  ← 수정됨\n```"
    }
  };

  return examples[ruleId] || null;
}

function getPreventionTips(ruleId: string | undefined): string[] {
  if (!ruleId) return [];

  const tips: Record<string, string[]> = {
    rule_fall_contradiction: [
      "고소작업 체크 시 항상 추락방지 장비(안전대, 안전난간) 확인",
      "작업 전 안전조치 체크리스트를 먼저 작성하는 습관 들이기",
      "고소작업은 2m 이상 기준임을 기억"
    ],
    rule_fire_contradiction: [
      "화기작업 전 반드시 소화기 위치 확인",
      "불티비산 방지조치도 함께 체크",
      "용접/절단 작업은 모두 화기작업에 해당"
    ],
    rule_confined_space_contradiction: [
      "밀폐공간 작업 전 반드시 산소농도 측정",
      "환기장치 작동 여부 확인",
      "맨홀, 탱크, 덕트 등 모두 밀폐공간에 해당"
    ]
  };

  return tips[ruleId] || [];
}
