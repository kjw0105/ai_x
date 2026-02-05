/**
 * Verification tools for quality-checking extracted data
 * Works with Structured Outputs to provide self-correction
 */

import type { DocumentExtraction } from "./extractionSchema";

// Tool definitions for OpenAI
export const VERIFICATION_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "re_extract_field",
      description: "문서를 다시 검토하여 특정 필드를 재추출합니다. 초기 추출에서 누락되거나 불확실한 필드에 사용합니다.",
      parameters: {
        type: "object",
        properties: {
          fieldName: {
            type: "string",
            enum: ["점검일자", "현장명", "작업내용", "작업인원", "점검자", "서명"],
            description: "재추출할 필드 이름"
          },
          reason: {
            type: "string",
            description: "재추출이 필요한 이유 (예: '초기 추출에서 null로 반환됨')"
          }
        },
        required: ["fieldName", "reason"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "verify_checklist_item",
      description: "특정 체크리스트 항목의 값을 문서에서 재확인합니다. 체크(✔), 미체크(✖), N/A 표시가 명확하지 않을 때 사용합니다.",
      parameters: {
        type: "object",
        properties: {
          itemId: {
            type: "string",
            description: "확인할 항목 ID (예: fall_01, ppe_03)"
          },
          currentValue: {
            type: "string",
            enum: ["✔", "✖", "N/A", "null"],
            description: "현재 추출된 값"
          }
        },
        required: ["itemId", "currentValue"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "check_signature_presence",
      description: "서명란을 재확인합니다. 서명, 날인, 이름 기재 등 다양한 형태의 서명을 확인합니다.",
      parameters: {
        type: "object",
        properties: {
          signatureType: {
            type: "string",
            enum: ["담당", "소장"],
            description: "확인할 서명 유형"
          }
        },
        required: ["signatureType"]
      }
    }
  }
];

// Tool implementations
export function reExtractField(
  fieldName: string,
  reason: string,
  documentText: string,
  documentImages?: string[]
): string {
  // In a real implementation, this would call the AI again to re-examine the document
  // For now, return a placeholder that explains what should happen

  console.log(`[Verification Tool] re_extract_field called for: ${fieldName}`);
  console.log(`[Verification Tool] Reason: ${reason}`);

  return `재추출 요청됨: ${fieldName}
이유: ${reason}

재추출 지침:
1. 문서를 다시 면밀히 검토
2. 해당 필드의 가능한 위치를 모두 확인
3. 유사한 표현도 찾아보기 (예: "점검일" vs "검사일" vs "작성일")
4. 표나 양식에서 해당 항목 찾기
5. 찾지 못한 경우에만 null 반환

문서 텍스트 재검토 필요.`;
}

export function verifyChecklistItem(
  itemId: string,
  currentValue: string,
  documentText: string,
  documentImages?: string[]
): string {
  console.log(`[Verification Tool] verify_checklist_item called for: ${itemId}`);
  console.log(`[Verification Tool] Current value: ${currentValue}`);

  // Map item IDs to Korean names for better verification
  const itemNames: Record<string, string> = {
    fall_01: "고소작업",
    fall_02: "추락방호장치",
    fall_03: "안전난간",
    ppe_01: "안전모착용",
    ppe_03: "안전대착용",
    fire_01: "화기작업",
    fire_02: "소화기비치",
    conf_01: "밀폐공간작업",
    conf_02: "산소농도측정",
    conf_03: "환기조치",
    exc_01: "굴착작업",
    exc_02: "흙막이설치",
    exc_03: "탈출사다리",
    elec_02: "전기작업",
    elec_03: "잠금장치"
  };

  const itemName = itemNames[itemId] || itemId;

  return `체크리스트 항목 재확인 요청: ${itemName} (${itemId})
현재 값: ${currentValue}

재확인 지침:
1. 문서에서 "${itemName}" 또는 유사 표현 찾기
2. 해당 항목의 체크 상태 확인:
   - 체크 표시(✓, ✔, V, O) → "✔"
   - X 표시(✗, ✖) → "✖"
   - "해당없음", "N/A", "-" → "N/A"
   - 빈칸 → null
3. 불명확한 경우 주변 context 확인
4. 확신이 없으면 현재 값 유지

문서 재검토 필요.`;
}

export function checkSignaturePresence(
  signatureType: "담당" | "소장",
  documentText: string,
  documentImages?: string[]
): string {
  console.log(`[Verification Tool] check_signature_presence called for: ${signatureType}`);

  return `서명 재확인 요청: ${signatureType}

확인 지침:
1. 서명란 위치 찾기:
   - "담당자", "작업반장", "점검자" (담당용)
   - "소장", "관리책임자", "현장소장" (소장용)

2. 서명 형태 확인:
   - 손글씨 서명 → present
   - 날인/도장 → present
   - 이름 기재 (타이핑) → present
   - "[서명]" 표시만 있음 → present
   - 빈칸 → missing
   - 서명란 없음 → unknown

3. 이미지에서 확인 (있는 경우):
   - 서명란에 필기체나 도장 이미지 확인
   - 빈 사각형만 있으면 missing

문서 재검토 필요.`;
}

/**
 * Analyzes extraction confidence and determines if verification is needed
 */
export function shouldVerifyExtraction(extraction: DocumentExtraction): boolean {
  // 🧪 TESTING: Force verification for all documents (comment out after testing)
  // return true;

  // Always verify if overall confidence is low
  if (extraction.extractionConfidence.overall === "low") {
    return true;
  }

  // Verify if critical fields are uncertain
  const criticalFields = ["점검일자", "현장명", "점검자"];
  const hasUncertainCriticalField = extraction.extractionConfidence.uncertainFields.some(
    field => criticalFields.includes(field)
  );

  if (hasUncertainCriticalField) {
    return true;
  }

  // Verify if signatures are uncertain
  if (extraction.signature.담당 === "unknown" || extraction.signature.소장 === "unknown") {
    return true;
  }

  // Otherwise, extraction is good enough
  return false;
}

/**
 * Generates verification prompt based on extraction issues
 */
export function generateVerificationPrompt(extraction: DocumentExtraction): string {
  const issues: string[] = [];

  // Check overall confidence
  if (extraction.extractionConfidence.overall === "low") {
    issues.push("전체 추출 신뢰도가 낮음");
  }

  // Check uncertain fields
  if (extraction.extractionConfidence.uncertainFields.length > 0) {
    issues.push(`불확실한 필드: ${extraction.extractionConfidence.uncertainFields.join(", ")}`);
  }

  // Check missing critical fields
  if (!extraction.fields.점검일자) issues.push("점검일자 누락");
  if (!extraction.fields.현장명) issues.push("현장명 누락");
  if (!extraction.inspectorName) issues.push("점검자 누락");

  // Check signature issues
  if (extraction.signature.담당 === "unknown") issues.push("담당자 서명 불명확");
  if (extraction.signature.소장 === "unknown") issues.push("소장 서명 불명확");

  return `다음 추출 결과를 검토하고 필요한 경우 재추출 도구를 사용하세요:

발견된 이슈:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

추출 결과:
${JSON.stringify(extraction, null, 2)}

가능한 조치:
1. re_extract_field() - 누락되거나 불확실한 필드 재추출
2. verify_checklist_item() - 체크리스트 항목 재확인
3. check_signature_presence() - 서명 재확인

이슈가 없으면 "추출 결과가 양호합니다"라고 응답하세요.`;
}
