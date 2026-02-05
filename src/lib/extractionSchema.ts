/**
 * JSON Schema for structured document extraction
 * Used with OpenAI Structured Outputs to guarantee valid JSON
 */

export const DOCUMENT_EXTRACTION_SCHEMA = {
  name: "document_extraction",
  strict: true,
  schema: {
    type: "object",
    properties: {
      docType: {
        type: "string",
        enum: ["산업안전 점검표", "위험성 평가 보고서", "작업 전 안전점검표", "TBM", "현장 사진", "unknown"],
        description: "문서 유형"
      },
      fields: {
        type: "object",
        properties: {
          점검일자: {
            type: ["string", "null"],
            description: "점검 날짜 (YYYY-MM-DD 형식)"
          },
          현장명: {
            type: ["string", "null"],
            description: "작업 현장 이름"
          },
          작업내용: {
            type: ["string", "null"],
            description: "작업 내용 설명"
          },
          작업인원: {
            type: ["string", "null"],
            description: "작업 인원 (예: '3명', '홍길동 외 2명')"
          }
        },
        required: ["점검일자", "현장명", "작업내용", "작업인원"],
        additionalProperties: false
      },
      signature: {
        type: "object",
        properties: {
          담당: {
            type: "string",
            enum: ["present", "missing", "unknown"],
            description: "담당자/작업반장 서명 여부"
          },
          소장: {
            type: "string",
            enum: ["present", "missing", "unknown"],
            description: "관리책임자/소장 서명 여부"
          }
        },
        required: ["담당", "소장"],
        additionalProperties: false
      },
      inspectorName: {
        type: ["string", "null"],
        description: "점검자 이름"
      },
      riskLevel: {
        type: ["string", "null"],
        enum: ["high", "medium", "low", null],
        description: "문서에 표시된 위험도"
      },
      checklist: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "항목 ID (예: fall_01, ppe_03)"
            },
            category: {
              type: "string",
              description: "분류 (예: 추락예방, 보호구, 전기안전)"
            },
            nameKo: {
              type: "string",
              description: "한국어 항목명"
            },
            value: {
              type: ["string", "null"],
              enum: ["✔", "✖", "N/A", null],
              description: "체크 상태"
            }
          },
          required: ["id", "category", "nameKo", "value"],
          additionalProperties: false
        },
        description: "체크리스트 항목들"
      },
      chat: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              enum: ["ai"],
              description: "메시지 역할"
            },
            text: {
              type: "string",
              description: "메시지 내용"
            }
          },
          required: ["role", "text"],
          additionalProperties: false
        },
        description: "AI 분석 코멘트",
        maxItems: 1
      },
      extractionConfidence: {
        type: "object",
        properties: {
          overall: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "전체 추출 신뢰도"
          },
          uncertainFields: {
            type: "array",
            items: {
              type: "string"
            },
            description: "불확실한 필드 목록"
          }
        },
        required: ["overall", "uncertainFields"],
        additionalProperties: false,
        description: "추출 신뢰도 정보 (검증 필요 여부 판단용)"
      }
    },
    required: [
      "docType",
      "fields",
      "signature",
      "inspectorName",
      "riskLevel",
      "checklist",
      "chat",
      "extractionConfidence"
    ],
    additionalProperties: false
  }
};

// Type inference from schema
export type DocumentExtraction = {
  docType: "산업안전 점검표" | "위험성 평가 보고서" | "작업 전 안전점검표" | "TBM" | "현장 사진" | "unknown";
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
  inspectorName: string | null;
  riskLevel: "high" | "medium" | "low" | null;
  checklist: Array<{
    id: string;
    category: string;
    nameKo: string;
    value: "✔" | "✖" | "N/A" | null;
  }>;
  chat: Array<{
    role: "ai";
    text: string;
  }>;
  extractionConfidence: {
    overall: "high" | "medium" | "low";
    uncertainFields: string[];
  };
};
