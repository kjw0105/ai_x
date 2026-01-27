/**
 * Test Data Generator for Korean Construction Safety Documents
 * Based on KOSHA (Korea Occupational Safety and Health Agency) standards
 * and MOEL (Ministry of Employment and Labor) guidelines.
 *
 * Reference categories from Korean safety regulations:
 * 1. 추락 재해 예방 (Fall Prevention)
 * 2. 가설 구조물 및 비계 (Scaffolding)
 * 3. 굴착 및 지반 (Excavation)
 * 4. 건설기계 및 장비 (Equipment)
 * 5. 화재 및 폭발 예방 (Fire Prevention)
 * 6. 질식 및 중독 예방 (Confined Space)
 * 7. 개인 보호구 (PPE)
 * 8. 전기 안전 (Electrical)
 * 9. 정리정돈 (Housekeeping)
 * 10. 비상 조치 (Emergency)
 */

export interface ChecklistItem {
    id: string;
    category: string;
    name: string;
    nameKo: string;
    value: "✔" | "✖" | "N/A" | null;
}

export interface TestDocument {
    docType: "산업안전 점검표" | "위험성 평가 보고서" | "작업 전 안전점검표" | "TBM";
    fields: {
        점검일자: string;
        현장명: string;
        작업내용: string;
        작업인원: string | null;
    };
    signature: {
        담당: "present" | "missing" | "unknown";
        소장: "present" | "missing" | "unknown";
    };
    inspectorName: string;
    riskLevel?: "high" | "medium" | "low";
    checklist: ChecklistItem[];
}

// Standard Korean safety checklist items based on KOSHA guidelines
export const STANDARD_CHECKLIST_ITEMS: Omit<ChecklistItem, "value">[] = [
    // 추락 재해 예방 (Fall Prevention)
    { id: "fall_01", category: "추락예방", name: "Working at height", nameKo: "고소작업" },
    { id: "fall_02", category: "추락예방", name: "Fall protection installed", nameKo: "추락방호장치" },
    { id: "fall_03", category: "추락예방", name: "Safety railing installed", nameKo: "안전난간" },
    { id: "fall_04", category: "추락예방", name: "Opening covers in place", nameKo: "개구부덮개" },
    { id: "fall_05", category: "추락예방", name: "Safety net installed", nameKo: "추락방호망" },

    // 개인 보호구 (PPE)
    { id: "ppe_01", category: "보호구", name: "Safety helmet worn", nameKo: "안전모착용" },
    { id: "ppe_02", category: "보호구", name: "Safety shoes worn", nameKo: "안전화착용" },
    { id: "ppe_03", category: "보호구", name: "Safety harness worn", nameKo: "안전대착용" },
    { id: "ppe_04", category: "보호구", name: "Safety glasses worn", nameKo: "보안경착용" },
    { id: "ppe_05", category: "보호구", name: "Hearing protection worn", nameKo: "귀마개착용" },

    // 전기 안전 (Electrical Safety)
    { id: "elec_01", category: "전기안전", name: "GFCI installed", nameKo: "누전차단기" },
    { id: "elec_02", category: "전기안전", name: "Electrical work performed", nameKo: "전기작업" },
    { id: "elec_03", category: "전기안전", name: "Lockout/Tagout applied", nameKo: "잠금장치" },

    // 화재 예방 (Fire Prevention)
    { id: "fire_01", category: "화재예방", name: "Hot work performed", nameKo: "화기작업" },
    { id: "fire_02", category: "화재예방", name: "Fire extinguisher available", nameKo: "소화기비치" },
    { id: "fire_03", category: "화재예방", name: "Spark prevention measures", nameKo: "불티비산방지" },

    // 밀폐공간 (Confined Space)
    { id: "conf_01", category: "밀폐공간", name: "Confined space entry", nameKo: "밀폐공간작업" },
    { id: "conf_02", category: "밀폐공간", name: "Oxygen level measured", nameKo: "산소농도측정" },
    { id: "conf_03", category: "밀폐공간", name: "Ventilation provided", nameKo: "환기조치" },

    // 굴착 (Excavation)
    { id: "exc_01", category: "굴착", name: "Excavation work", nameKo: "굴착작업" },
    { id: "exc_02", category: "굴착", name: "Shoring installed", nameKo: "흙막이설치" },
    { id: "exc_03", category: "굴착", name: "Exit ladder provided", nameKo: "탈출사다리" },
];

// IF-THEN Consistency Rules based on Korean safety logic
export interface ConsistencyRule {
    id: string;
    description: string;
    descriptionKo: string;
    condition: (checklist: ChecklistItem[]) => boolean;
    getItem: (id: string, checklist: ChecklistItem[]) => ChecklistItem | undefined;
}

export const CONSISTENCY_RULES: ConsistencyRule[] = [
    {
        id: "rule_fall_ppe",
        description: "If working at height, fall protection PPE must be used",
        descriptionKo: "고소작업 시 안전대 착용 필수",
        condition: (checklist) => {
            const heightWork = checklist.find((c) => c.id === "fall_01");
            const harness = checklist.find((c) => c.id === "ppe_03");
            // If doing height work (✔) but harness not worn (✖)
            return heightWork?.value === "✔" && harness?.value === "✖";
        },
        getItem: (id, checklist) => checklist.find((c) => c.id === id),
    },
    {
        id: "rule_fall_false_positive",
        description: "Contradiction: Not working at height but fall protection marked as used",
        descriptionKo: "고소작업 미실시이나 추락방호장치 사용으로 표시됨 (모순)",
        condition: (checklist) => {
            const heightWork = checklist.find((c) => c.id === "fall_01");
            const fallProtection = checklist.find((c) => c.id === "fall_02");
            // Not working at height (✖) but fall protection installed (✔) - contradiction
            return heightWork?.value === "✖" && fallProtection?.value === "✔";
        },
        getItem: (id, checklist) => checklist.find((c) => c.id === id),
    },
    {
        id: "rule_fire_extinguisher",
        description: "If hot work performed, fire extinguisher must be available",
        descriptionKo: "화기작업 시 소화기 비치 필수",
        condition: (checklist) => {
            const hotWork = checklist.find((c) => c.id === "fire_01");
            const extinguisher = checklist.find((c) => c.id === "fire_02");
            return hotWork?.value === "✔" && extinguisher?.value === "✖";
        },
        getItem: (id, checklist) => checklist.find((c) => c.id === id),
    },
    {
        id: "rule_confined_space",
        description: "If confined space entry, oxygen measurement and ventilation required",
        descriptionKo: "밀폐공간 작업 시 산소농도 측정 및 환기 필수",
        condition: (checklist) => {
            const confined = checklist.find((c) => c.id === "conf_01");
            const oxygen = checklist.find((c) => c.id === "conf_02");
            const ventilation = checklist.find((c) => c.id === "conf_03");
            return confined?.value === "✔" && (oxygen?.value === "✖" || ventilation?.value === "✖");
        },
        getItem: (id, checklist) => checklist.find((c) => c.id === id),
    },
    {
        id: "rule_excavation_safety",
        description: "If excavation work, shoring and exit ladder required",
        descriptionKo: "굴착작업 시 흙막이 및 탈출사다리 필수",
        condition: (checklist) => {
            const excavation = checklist.find((c) => c.id === "exc_01");
            const shoring = checklist.find((c) => c.id === "exc_02");
            const ladder = checklist.find((c) => c.id === "exc_03");
            return excavation?.value === "✔" && (shoring?.value === "✖" || ladder?.value === "✖");
        },
        getItem: (id, checklist) => checklist.find((c) => c.id === id),
    },
    {
        id: "rule_electrical_lockout",
        description: "If electrical work performed, lockout/tagout must be applied",
        descriptionKo: "전기작업 시 잠금장치(LOTO) 적용 필수",
        condition: (checklist) => {
            const electrical = checklist.find((c) => c.id === "elec_02");
            const lockout = checklist.find((c) => c.id === "elec_03");
            return electrical?.value === "✔" && lockout?.value === "✖";
        },
        getItem: (id, checklist) => checklist.find((c) => c.id === id),
    },
];

// Test data generators
export function generateValidDocument(overrides?: Partial<TestDocument>): TestDocument {
    const checklist = STANDARD_CHECKLIST_ITEMS.slice(0, 10).map((item) => ({
        ...item,
        value: "✔" as const,
    }));

    return {
        docType: "산업안전 점검표",
        fields: {
            점검일자: "2026-01-27",
            현장명: "테스트 건설현장",
            작업내용: "철골 구조물 설치 작업",
            작업인원: "5명",
        },
        signature: {
            담당: "present",
            소장: "present",
        },
        inspectorName: "김안전",
        riskLevel: "medium",
        checklist,
        ...overrides,
    };
}

export function generateContradictoryDocument(): TestDocument {
    // Create a document with contradictions for Stage 2 testing
    const checklist: ChecklistItem[] = [
        { id: "fall_01", category: "추락예방", name: "Working at height", nameKo: "고소작업", value: "✖" },
        { id: "fall_02", category: "추락예방", name: "Fall protection installed", nameKo: "추락방호장치", value: "✔" }, // Contradiction!
        { id: "ppe_01", category: "보호구", name: "Safety helmet worn", nameKo: "안전모착용", value: "✔" },
        { id: "ppe_03", category: "보호구", name: "Safety harness worn", nameKo: "안전대착용", value: "✔" },
    ];

    return {
        docType: "산업안전 점검표",
        fields: {
            점검일자: "2026-01-27",
            현장명: "테스트 건설현장",
            작업내용: "지상 작업 (고소작업 없음)",
            작업인원: "3명",
        },
        signature: {
            담당: "present",
            소장: "present",
        },
        inspectorName: "박점검",
        checklist,
    };
}

export function generateAlwaysCheckDocument(inspectorName: string, dateOffset: number): TestDocument {
    // Create documents for "always ✔" pattern detection (Stage 4)
    const date = new Date();
    date.setDate(date.getDate() - dateOffset);
    const dateStr = date.toISOString().split("T")[0];

    const checklist = STANDARD_CHECKLIST_ITEMS.slice(0, 10).map((item) => ({
        ...item,
        value: "✔" as const, // Always check everything - suspicious pattern
    }));

    return {
        docType: "산업안전 점검표",
        fields: {
            점검일자: dateStr,
            현장명: "동일 현장",
            작업내용: "일상 점검", // Same generic description - copy-paste pattern
            작업인원: "5명",
        },
        signature: {
            담당: "present",
            소장: "present",
        },
        inspectorName,
        checklist,
    };
}

export function generateInconsistentRiskDocument(): TestDocument {
    // Master plan says high-risk but checklist says no issues (Stage 3)
    const checklist = STANDARD_CHECKLIST_ITEMS.slice(0, 5).map((item) => ({
        ...item,
        value: "N/A" as const, // Everything marked N/A despite high-risk work
    }));

    return {
        docType: "위험성 평가 보고서",
        fields: {
            점검일자: "2026-01-27",
            현장명: "고위험 건설현장",
            작업내용: "고소 용접 작업", // High-risk work
            작업인원: "8명",
        },
        signature: {
            담당: "present",
            소장: "missing", // Often missing in poorly managed sites
        },
        inspectorName: "이위험",
        riskLevel: "low", // Claims low risk despite high-risk work description
        checklist,
    };
}

// Generate test dataset for Stage 4 pattern detection
export function generatePatternTestDataset(): TestDocument[] {
    const documents: TestDocument[] = [];

    // Generate 10 documents from same inspector with suspicious pattern
    for (let i = 0; i < 10; i++) {
        documents.push(generateAlwaysCheckDocument("최만점", i));
    }

    // Add some normal documents from different inspectors
    documents.push(generateValidDocument({ inspectorName: "정상일", fields: { ...generateValidDocument().fields, 점검일자: "2026-01-25" } }));
    documents.push(generateContradictoryDocument());

    return documents;
}
