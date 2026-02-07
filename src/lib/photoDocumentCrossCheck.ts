/**
 * Photo ↔ Document Cross-Validation
 *
 * Compares photo analysis results against document checklists to detect
 * contradictions between what documents claim and what photos show.
 *
 * This is a document fraud detection feature - catches inspectors who check "✔"
 * on paper but the reality on-site shows otherwise.
 */

import type { ValidationIssue } from "./validator";

export interface PhotoViolation {
  id: string;        // e.g., "fall_helmet", "ppe_vest"
  category: string;
  violation: string;
  severity: string;
  location: string;
  evidence: string;
}

export interface PhotoCompliance {
  item: string;
  evidence: string;
}

export interface PhotoChecklistItem {
  id: string;
  nameKo: string;
  value: "✔" | "✖" | "N/A";
}

export interface PhotoAnalysisResult {
  safetyViolations?: PhotoViolation[];
  safetyCompliance?: PhotoCompliance[];
  checklist?: PhotoChecklistItem[];
}

export interface DocumentChecklistItem {
  id: string;
  category?: string;
  nameKo: string;
  value: "✔" | "✖" | "N/A" | null;
}

export interface CrossCheckResult {
  issues: ValidationIssue[];
  matchedItems: number;
  mismatchedItems: number;
  comparedDocumentName?: string;
}

/**
 * Compare photo analysis results against a document checklist.
 * Returns mismatch issues where the photo contradicts the document.
 *
 * Comparison logic:
 * - Doc ✔ + Photo ✖ = ERROR (fraud suspected - doc claims OK but photo shows violation)
 * - Doc N/A + Photo ✖ = WARN (doc says not applicable but photo shows related activity)
 * - Doc ✖ + Photo ✔ = INFO (improvement - doc recorded issue, photo shows it's fixed)
 * - Same values = matched (no issue)
 */
export function crossCheckPhotoVsDocument(
  photoAnalysis: PhotoAnalysisResult,
  documentChecklist: DocumentChecklistItem[],
  documentFileName?: string
): CrossCheckResult {
  const issues: ValidationIssue[] = [];
  let matchedItems = 0;
  let mismatchedItems = 0;

  // Early return if insufficient data
  if (!photoAnalysis?.checklist || photoAnalysis.checklist.length === 0) {
    return { issues, matchedItems, mismatchedItems, comparedDocumentName: documentFileName };
  }

  if (!documentChecklist || documentChecklist.length === 0) {
    return { issues, matchedItems, mismatchedItems, comparedDocumentName: documentFileName };
  }

  // Build a map of document checklist: id -> item
  const docMap = new Map<string, DocumentChecklistItem>();
  for (const item of documentChecklist) {
    if (item.id) {
      docMap.set(item.id, item);
    }
  }

  // Compare each photo checklist item against the document
  for (const photoItem of photoAnalysis.checklist) {
    if (!photoItem.id) continue;

    const docItem = docMap.get(photoItem.id);
    if (!docItem) continue; // Item not in document, skip

    const photoValue = photoItem.value; // "✔", "✖", "N/A"
    const docValue = docItem.value;     // "✔", "✖", "N/A", null

    // Skip if document has no value recorded
    if (!docValue) {
      continue;
    }

    // Case 1: Document says compliant (✔) but photo shows violation (✖)
    // This is the critical fraud detection case
    if (docValue === "✔" && photoValue === "✖") {
      mismatchedItems++;
      issues.push({
        severity: "error",
        title: `문서-현장 불일치: ${docItem.nameKo}`,
        message: `점검표에는 "${docItem.nameKo}"이(가) 적합(✔)으로 기록되었으나, 현장 사진에서 미준수(✖)가 관찰되었습니다. 점검 기록의 정확성을 확인해주세요.${documentFileName ? `\n\n비교 문서: ${documentFileName}` : ""}`,
        ruleId: `photo_doc_mismatch_${photoItem.id}`,
        isAIFixable: false,
        path: `교차검증.${photoItem.id}`,
      });
    }
    // Case 2: Document says N/A but photo shows the work IS happening (violation detected)
    else if (docValue === "N/A" && photoValue === "✖") {
      mismatchedItems++;
      issues.push({
        severity: "warn",
        title: `해당없음 표기 불일치: ${docItem.nameKo}`,
        message: `점검표에는 "${docItem.nameKo}"이(가) 해당없음(N/A)으로 표기되었으나, 현장 사진에서 관련 작업 또는 위반이 관찰되었습니다.${documentFileName ? `\n\n비교 문서: ${documentFileName}` : ""}`,
        ruleId: `photo_doc_na_mismatch_${photoItem.id}`,
        isAIFixable: false,
        path: `교차검증.${photoItem.id}`,
      });
    }
    // Case 3: Document says non-compliant (✖) but photo shows compliant (✔)
    // Less critical but worth noting - indicates possible improvement
    else if (docValue === "✖" && photoValue === "✔") {
      matchedItems++; // Not a safety concern, count as positive
      issues.push({
        severity: "info",
        title: `개선 확인: ${docItem.nameKo}`,
        message: `점검표에는 "${docItem.nameKo}"이(가) 부적합(✖)으로 기록되었으나, 현장 사진에서는 준수가 확인되었습니다. 시정 조치가 이루어졌을 수 있습니다.${documentFileName ? `\n\n비교 문서: ${documentFileName}` : ""}`,
        ruleId: `photo_doc_improved_${photoItem.id}`,
        isAIFixable: false,
        path: `교차검증.${photoItem.id}`,
      });
    }
    // Case 4: Values match or are compatible
    else {
      matchedItems++;
    }
  }

  return {
    issues,
    matchedItems,
    mismatchedItems,
    comparedDocumentName: documentFileName,
  };
}
