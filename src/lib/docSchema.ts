import type { DocData } from "@/lib/validator";

export const defaultFields: DocData["fields"] = {
  점검일자: null,
  현장명: null,
  작업내용: null,
  작업인원: null,
};

export const defaultSignature: DocData["signature"] = {
  담당: "unknown",
  소장: "unknown",
};

type ChatMessage = { role: "ai" | "user"; text: string };

type ParseResult =
  | { data: DocData & { chat?: ChatMessage[] } }
  | { error: string };

const docTypes = ["산업안전 점검표", "위험성 평가 보고서", "작업 전 안전점검표", "TBM", "unknown"] as const;
const checklistValues = ["✔", "✖", "N/A"] as const;
const signatureValues = ["present", "missing", "unknown"] as const;
const riskLevels = ["high", "medium", "low"] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function fail(path: string): ParseResult {
  return {
    error: `문서 분석 결과 형식이 올바르지 않습니다 (${path})`
  };
}

function hasOnlyKeys(obj: Record<string, unknown>, allowed: string[], path: string): ParseResult | null {
  const extraKeys = Object.keys(obj).filter((key) => !allowed.includes(key));
  if (extraKeys.length > 0) {
    return fail(`${path}.${extraKeys[0]}`);
  }
  return null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function validateFields(value: unknown): ParseResult | null {
  if (!isPlainObject(value)) return fail("fields");
  const extra = hasOnlyKeys(
    value,
    ["점검일자", "현장명", "작업내용", "작업인원", "풍속", "기온", "강우량"],
    "fields"
  );
  if (extra) return extra;

  for (const key of ["점검일자", "현장명", "작업내용", "작업인원"] as const) {
    if (key in value && !isNullableString(value[key])) {
      return fail(`fields.${key}`);
    }
  }

  for (const key of ["풍속", "기온", "강우량"] as const) {
    if (key in value && typeof value[key] !== "string") {
      return fail(`fields.${key}`);
    }
  }

  return null;
}

function validateSignature(value: unknown): ParseResult | null {
  if (!isPlainObject(value)) return fail("signature");
  const extra = hasOnlyKeys(value, ["담당", "소장"], "signature");
  if (extra) return extra;

  if ("담당" in value && !signatureValues.includes(value.담당 as typeof signatureValues[number])) {
    return fail("signature.담당");
  }
  if ("소장" in value && !signatureValues.includes(value.소장 as typeof signatureValues[number])) {
    return fail("signature.소장");
  }

  return null;
}

function validateChecklist(value: unknown): ParseResult | null {
  if (!Array.isArray(value)) return fail("checklist");

  for (let i = 0; i < value.length; i += 1) {
    const item = value[i];
    if (!isPlainObject(item)) return fail(`checklist.${i}`);
    const extra = hasOnlyKeys(item, ["id", "category", "nameKo", "value"], `checklist.${i}`);
    if (extra) return extra;

    if (typeof item.id !== "string") return fail(`checklist.${i}.id`);
    if (typeof item.category !== "string") return fail(`checklist.${i}.category`);
    if (typeof item.nameKo !== "string") return fail(`checklist.${i}.nameKo`);
    if (item.value !== null && !checklistValues.includes(item.value as typeof checklistValues[number])) {
      return fail(`checklist.${i}.value`);
    }
  }

  return null;
}

function validateChat(value: unknown): ParseResult | null {
  if (!Array.isArray(value)) return fail("chat");

  for (let i = 0; i < value.length; i += 1) {
    const msg = value[i];
    if (!isPlainObject(msg)) return fail(`chat.${i}`);
    const extra = hasOnlyKeys(msg, ["role", "text"], `chat.${i}`);
    if (extra) return extra;
    if (msg.role !== "ai" && msg.role !== "user") return fail(`chat.${i}.role`);
    if (typeof msg.text !== "string") return fail(`chat.${i}.text`);
  }

  return null;
}

export function parseDocExtraction(raw: unknown): ParseResult {
  if (!isPlainObject(raw)) return fail("response");
  const extra = hasOnlyKeys(
    raw,
    ["docType", "fields", "signature", "checklist", "riskLevel", "inspectorName", "chat"],
    "response"
  );
  if (extra) return extra;

  if (!docTypes.includes(raw.docType as typeof docTypes[number])) return fail("docType");

  if ("fields" in raw && raw.fields !== undefined) {
    const fieldsError = validateFields(raw.fields);
    if (fieldsError) return fieldsError;
  }

  if ("signature" in raw && raw.signature !== undefined) {
    const signatureError = validateSignature(raw.signature);
    if (signatureError) return signatureError;
  }

  if ("checklist" in raw && raw.checklist !== undefined) {
    const checklistError = validateChecklist(raw.checklist);
    if (checklistError) return checklistError;
  }

  if ("riskLevel" in raw && raw.riskLevel !== undefined && raw.riskLevel !== null) {
    if (!riskLevels.includes(raw.riskLevel as typeof riskLevels[number])) {
      return fail("riskLevel");
    }
  }

  if ("inspectorName" in raw && raw.inspectorName !== undefined && raw.inspectorName !== null) {
    if (typeof raw.inspectorName !== "string") return fail("inspectorName");
  }

  if ("chat" in raw && raw.chat !== undefined) {
    const chatError = validateChat(raw.chat);
    if (chatError) return chatError;
  }

  const data = raw as unknown as DocData & { chat?: ChatMessage[] };
  return {
    data: {
      ...data,
      fields: {
        ...defaultFields,
        ...(data.fields ?? {}),
      },
      signature: {
        ...defaultSignature,
        ...(data.signature ?? {}),
      },
      checklist: data.checklist ?? [],
    }
  };
}
