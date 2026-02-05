/**
 * TBM Cross-Validation Module
 *
 * Validates safety documents against TBM (Toolbox Meeting) context.
 * Detects inconsistencies between what was discussed in TBM and what's checked in documents.
 */

export interface TBMContext {
  workType: string | null;
  extractedHazards: string[];
  extractedInspector: string | null;
  summary: string;
}

export interface ChecklistItem {
  id?: string;
  category?: string;
  item?: string;
  value?: string;
  checked?: boolean;
}

export interface DocData {
  inspectorName?: string;
  checklist?: ChecklistItem[];
  [key: string]: any;
}

export interface ValidationIssue {
  id: string;
  severity: "error" | "warn" | "info";
  title: string;
  message: string;
  ruleId: string;
}

/**
 * Main validation function
 */
export function validateAgainstTBM(
  docData: DocData,
  tbmContext: TBMContext
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!tbmContext || !tbmContext.extractedHazards || tbmContext.extractedHazards.length === 0) {
    return issues; // No TBM context to validate against
  }

  const checklist = docData.checklist || [];
  const hazards = tbmContext.extractedHazards.map(h => h.toLowerCase());

  // Rule 1: Fall Hazard - TBM mentions but no fall protection items
  if (hazards.some(h => h.includes("추락") || h.includes("비계") || h.includes("높은 곳"))) {
    const fallItems = checklist.filter(item => {
      const id = (item.id || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const itemText = (item.item || "").toLowerCase();
      return (
        id.includes("fall") ||
        id.includes("height") ||
        category.includes("추락") ||
        category.includes("고소") ||
        itemText.includes("추락") ||
        itemText.includes("안전대") ||
        itemText.includes("난간")
      );
    });

    if (fallItems.length === 0) {
      issues.push({
        id: "cross_tbm_fall_missing",
        severity: "warn",
        title: "TBM-체크리스트 불일치: 추락 위험",
        message: `TBM에서 추락 위험을 논의했으나 체크리스트에 관련 항목이 없습니다. 고소작업 안전대착용, 추락방호망, 안전난간 등의 항목을 확인하세요.`,
        ruleId: "cross_tbm_fall_missing",
      });
    } else {
      // Check if fall items are checked
      const uncheckedFallItems = fallItems.filter(item => {
        const val = (item.value || "").trim();
        return val !== "✔" && val !== "O" && val !== "o" && !item.checked;
      });

      if (uncheckedFallItems.length > 0) {
        issues.push({
          id: "cross_tbm_fall_unchecked",
          severity: "warn",
          title: "TBM-체크리스트 불일치: 추락 안전조치 미체크",
          message: `TBM에서 추락 위험을 논의했으나 체크리스트의 추락 관련 항목이 체크되지 않았습니다. (미체크 항목: ${uncheckedFallItems.length}개)`,
          ruleId: "cross_tbm_fall_unchecked",
        });
      }
    }
  }

  // Rule 2: Fire Hazard - TBM mentions but no fire safety items
  if (hazards.some(h => h.includes("화재") || h.includes("용접") || h.includes("불꽃") || h.includes("가연성"))) {
    const fireItems = checklist.filter(item => {
      const id = (item.id || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const itemText = (item.item || "").toLowerCase();
      return (
        id.includes("fire") ||
        category.includes("화재") ||
        category.includes("용접") ||
        itemText.includes("화재") ||
        itemText.includes("소화기") ||
        itemText.includes("용접")
      );
    });

    if (fireItems.length === 0) {
      issues.push({
        id: "cross_tbm_fire_missing",
        severity: "warn",
        title: "TBM-체크리스트 불일치: 화재 위험",
        message: `TBM에서 화재/용접 위험을 논의했으나 체크리스트에 관련 항목이 없습니다. 소화기 비치, 화기작업 허가, 용접 안전조치 등을 확인하세요.`,
        ruleId: "cross_tbm_fire_missing",
      });
    } else {
      const uncheckedFireItems = fireItems.filter(item => {
        const val = (item.value || "").trim();
        return val !== "✔" && val !== "O" && val !== "o" && !item.checked;
      });

      if (uncheckedFireItems.length > 0) {
        issues.push({
          id: "cross_tbm_fire_unchecked",
          severity: "warn",
          title: "TBM-체크리스트 불일치: 화재 안전조치 미체크",
          message: `TBM에서 화재 위험을 논의했으나 체크리스트의 화재 관련 항목이 체크되지 않았습니다. (미체크 항목: ${uncheckedFireItems.length}개)`,
          ruleId: "cross_tbm_fire_unchecked",
        });
      }
    }
  }

  // Rule 3: Electrical Hazard - TBM mentions but no electrical safety items
  if (hazards.some(h => h.includes("감전") || h.includes("전기") || h.includes("누전"))) {
    const electricalItems = checklist.filter(item => {
      const id = (item.id || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const itemText = (item.item || "").toLowerCase();
      return (
        id.includes("electrical") ||
        id.includes("electric") ||
        category.includes("전기") ||
        category.includes("감전") ||
        itemText.includes("전기") ||
        itemText.includes("감전") ||
        itemText.includes("누전")
      );
    });

    if (electricalItems.length === 0) {
      issues.push({
        id: "cross_tbm_electrical_missing",
        severity: "warn",
        title: "TBM-체크리스트 불일치: 감전 위험",
        message: `TBM에서 감전/전기 위험을 논의했으나 체크리스트에 관련 항목이 없습니다. 누전차단기, 절연보호구, 전기작업 안전조치 등을 확인하세요.`,
        ruleId: "cross_tbm_electrical_missing",
      });
    } else {
      const uncheckedElectricalItems = electricalItems.filter(item => {
        const val = (item.value || "").trim();
        return val !== "✔" && val !== "O" && val !== "o" && !item.checked;
      });

      if (uncheckedElectricalItems.length > 0) {
        issues.push({
          id: "cross_tbm_electrical_unchecked",
          severity: "warn",
          title: "TBM-체크리스트 불일치: 감전 안전조치 미체크",
          message: `TBM에서 감전 위험을 논의했으나 체크리스트의 전기 관련 항목이 체크되지 않았습니다. (미체크 항목: ${uncheckedElectricalItems.length}개)`,
          ruleId: "cross_tbm_electrical_unchecked",
        });
      }
    }
  }

  // Rule 4: Confined Space - TBM mentions but no confined space items
  if (hazards.some(h => h.includes("밀폐") || h.includes("질식") || h.includes("환기"))) {
    const confinedItems = checklist.filter(item => {
      const id = (item.id || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const itemText = (item.item || "").toLowerCase();
      return (
        id.includes("confined") ||
        id.includes("ventilation") ||
        category.includes("밀폐") ||
        category.includes("환기") ||
        itemText.includes("밀폐") ||
        itemText.includes("환기") ||
        itemText.includes("산소")
      );
    });

    if (confinedItems.length === 0) {
      issues.push({
        id: "cross_tbm_confined_missing",
        severity: "warn",
        title: "TBM-체크리스트 불일치: 밀폐공간 위험",
        message: `TBM에서 밀폐공간/환기 위험을 논의했으나 체크리스트에 관련 항목이 없습니다. 산소농도 측정, 환기장치, 출입허가 등을 확인하세요.`,
        ruleId: "cross_tbm_confined_missing",
      });
    } else {
      const uncheckedConfinedItems = confinedItems.filter(item => {
        const val = (item.value || "").trim();
        return val !== "✔" && val !== "O" && val !== "o" && !item.checked;
      });

      if (uncheckedConfinedItems.length > 0) {
        issues.push({
          id: "cross_tbm_confined_unchecked",
          severity: "warn",
          title: "TBM-체크리스트 불일치: 밀폐공간 안전조치 미체크",
          message: `TBM에서 밀폐공간 위험을 논의했으나 체크리스트의 관련 항목이 체크되지 않았습니다. (미체크 항목: ${uncheckedConfinedItems.length}개)`,
          ruleId: "cross_tbm_confined_unchecked",
        });
      }
    }
  }

  // Rule 5: Inspector Mismatch - TBM inspector differs from document inspector
  if (tbmContext.extractedInspector && docData.inspectorName) {
    const tbmInspector = tbmContext.extractedInspector.trim();
    const docInspector = docData.inspectorName.trim();

    // Simple name comparison (not strict, as names might be formatted differently)
    if (tbmInspector && docInspector && !docInspector.includes(tbmInspector) && !tbmInspector.includes(docInspector)) {
      issues.push({
        id: "cross_tbm_inspector_mismatch",
        severity: "info",
        title: "TBM-체크리스트 담당자 불일치",
        message: `TBM 담당자(${tbmInspector})와 문서 점검자(${docInspector})가 다릅니다. 담당자 변경이 있었는지 확인하세요.`,
        ruleId: "cross_tbm_inspector_mismatch",
      });
    }
  }

  return issues;
}
