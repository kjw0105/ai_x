/**
 * masterPlanSchema.ts - Structured Master Safety Plan Schema
 *
 * This module defines the structured schema for Master Safety Plans,
 * replacing free-text plans with validated, queryable data structures.
 *
 * @module masterPlanSchema
 * @version 1.0.0
 */

// ============================================================
// Core Types
// ============================================================

export type RiskLevel = "critical" | "high" | "medium" | "low";
export type WorkAction = "stop" | "restrict" | "monitor" | "allow";
export type InspectionFrequency = "continuous" | "hourly" | "per-shift" | "daily" | "weekly" | "monthly" | "per-task" | "before-work";
export type SiteType = "building" | "civil" | "infrastructure" | "renovation" | "demolition";

// ============================================================
// Weather Limits
// ============================================================

export interface WeatherLimits {
  windSpeed?: {
    max: number;
    unit: "m/s" | "km/h";
    action: WorkAction;
    note?: string;  // "고소작업 중지"
  };
  temperature?: {
    min: number;
    max: number;
    unit: "celsius" | "fahrenheit";
    action: WorkAction;
    note?: string;  // "한파 시 콘크리트 작업 금지"
  };
  rainfall?: {
    max: number;
    unit: "mm/hr" | "mm/day";
    action: WorkAction;
    note?: string;  // "우천 시 외부 작업 중지"
  };
  visibility?: {
    min: number;
    unit: "meters";
    action: WorkAction;
    note?: string;  // "안개 시 크레인 작업 금지"
  };
  snow?: {
    max: number;
    unit: "cm";
    action: WorkAction;
    note?: string;  // "적설 시 지붕 작업 금지"
  };
}

// ============================================================
// PPE (Personal Protective Equipment)
// ============================================================

export interface PPERequirement {
  item: string;  // "안전모", "안전대", "안전화"
  itemEn: string;  // "Safety Helmet", "Safety Harness"
  mandatory: boolean;
  standard?: string;  // "KOSHA-GUIDE H-82-2012"
  replacementInterval?: {
    value: number;
    unit: "days" | "months" | "years" | "uses";
  };
  inspectionRequired?: boolean;
}

// ============================================================
// Work Requirements
// ============================================================

export interface HeightWorkRequirements {
  enabled: boolean;
  definition: {
    minHeight: number;
    unit: "meters" | "feet";
  };
  requiredPPE: PPERequirement[];
  requiredEquipment: string[];  // ["추락방호망", "안전난간", "이동식 비계"]
  fallProtectionMandatory: boolean;
  scaffoldingRequirements?: {
    maxHeight: number;
    inspectionFrequency: InspectionFrequency;
    certificationRequired: boolean;
  };
  inspectionFrequency: InspectionFrequency;
  specialConditions?: string[];  // ["야간 작업 금지", "우천 시 작업 금지"]
}

export interface ConfinedSpaceRequirements {
  enabled: boolean;
  definition: string;  // "밀폐공간 정의: 환기가 불충분한 공간..."
  permitRequired: boolean;
  requiredTests: Array<{
    test: string;  // "산소농도측정", "유해가스측정"
    testEn: string;  // "Oxygen Level Test"
    threshold: {
      min?: number;
      max?: number;
      unit: string;  // "%", "ppm"
    };
    frequency: InspectionFrequency;
    mandatory: boolean;
  }>;
  ventilationRequired: boolean;
  ventilationSpecs?: {
    minAirflow: number;
    unit: "m3/min" | "cfm";
  };
  emergencyProcedures: string[];
  maxOccupancy?: number;
  communicationRequired: boolean;
  standbyPersonRequired: boolean;
}

export interface HotWorkRequirements {
  enabled: boolean;
  permitRequired: boolean;
  permitValidityHours: number;
  fireExtinguishers: {
    min: number;
    type: string;  // "ABC형", "CO2형"
    placement: string;  // "작업장 반경 10m 이내"
  };
  firewatchDuration: {
    duringWork: boolean;
    afterWork: {
      value: number;
      unit: "minutes" | "hours";
    };
  };
  clearanceRadius: {
    value: number;
    unit: "meters";
  };
  combustibleMaterialRemoval: boolean;
  sparkShieldRequired: boolean;
  specialConditions?: string[];
}

export interface ExcavationRequirements {
  enabled: boolean;
  maxDepthWithoutShoring: {
    value: number;
    unit: "meters";
  };
  requiredEquipment: string[];  // ["흙막이", "탈출사다리", "배수펌프"]
  slopeRequirements?: {
    maxAngle: number;
    unit: "degrees";
  };
  inspectionFrequency: InspectionFrequency;
  soilTestingRequired: boolean;
  utilityLocationRequired: boolean;  // "지하 매설물 확인"
  barricadeRequired: boolean;
  exitRequirements: {
    maxDistance: number;  // 근로자로부터 탈출구까지 최대 거리
    unit: "meters";
  };
  specialConditions?: string[];
}

export interface ElectricalWorkRequirements {
  enabled: boolean;
  qualificationRequired: string[];  // ["전기기능사", "전기산업기사"]
  lockoutTagoutRequired: boolean;
  testingRequired: boolean;
  testEquipment?: string[];  // ["절연저항계", "검전기"]
  insulationRequired: boolean;
  permitRequired: boolean;
  doubleCheckRequired: boolean;  // "재통전 전 2중 확인"
  specialConditions?: string[];
}

export interface WorkRequirements {
  heightWork?: HeightWorkRequirements;
  confinedSpace?: ConfinedSpaceRequirements;
  hotWork?: HotWorkRequirements;
  excavation?: ExcavationRequirements;
  electrical?: ElectricalWorkRequirements;
}

// ============================================================
// Personnel Requirements
// ============================================================

export interface PersonnelRequirements {
  minWorkers?: number;
  maxWorkers?: number;
  requiredRoles: Array<{
    role: string;  // "관리감독자", "안전관리자", "신호수"
    roleEn: string;  // "Safety Manager", "Supervisor"
    certification?: string;
    mandatory: boolean;
    minCount: number;
  }>;
  trainingRequired: Array<{
    training: string;  // "신규 근로자 안전교육"
    trainingEn: string;
    frequency: InspectionFrequency;
    durationHours: number;
    mandatory: boolean;
  }>;
  healthRequirements?: {
    medicalCheckRequired: boolean;
    frequency: "annual" | "biannual" | "monthly";
    specialConditions?: string[];
  };
}

// ============================================================
// Inspection Schedule
// ============================================================

export interface InspectionSchedule {
  daily: Array<{
    inspection: string;  // "TBM", "작업전점검"
    inspectionEn: string;
    timeOfDay: "morning" | "before-work" | "after-work" | "any";
    mandatory: boolean;
  }>;
  weekly?: Array<{
    inspection: string;
    inspectionEn: string;
    dayOfWeek?: number;  // 0-6 (Sunday-Saturday)
    mandatory: boolean;
  }>;
  monthly?: Array<{
    inspection: string;
    inspectionEn: string;
    dayOfMonth?: number;
    mandatory: boolean;
  }>;
  beforeWork: Array<{
    inspection: string;
    inspectionEn: string;
    applicableWork: string[];  // ["고소작업", "화기작업"]
    mandatory: boolean;
  }>;
}

// ============================================================
// Emergency Procedures
// ============================================================

export interface EmergencyProcedures {
  evacuationRoutes: Array<{
    route: string;
    assembly: string;  // "집결지"
    capacity: number;
  }>;
  emergencyContacts: Array<{
    role: string;  // "현장소장", "안전관리자", "119"
    name: string;
    phone: string;
    available: "24/7" | "working-hours" | "on-call";
  }>;
  nearestHospital: {
    name: string;
    address: string;
    distance: number;
    distanceUnit: "km" | "miles";
    phone: string;
    directions?: string;
  };
  emergencyEquipment: Array<{
    equipment: string;  // "AED", "비상샤워기", "세안기"
    location: string;
    quantity: number;
    inspectionFrequency: InspectionFrequency;
  }>;
  emergencyDrills: {
    frequency: InspectionFrequency;
    types: string[];  // ["화재대피", "붕괴사고", "추락사고"]
  };
}

// ============================================================
// Risk Matrix (for Proposal 2)
// ============================================================

export interface RiskMatrixActivity {
  activity: string;  // "고소작업", "화기작업"
  activityEn: string;
  baseRiskLevel: RiskLevel;

  riskFactors: Array<{
    factor: string;  // "높이 5m 이상", "밀폐된 공간"
    factorEn: string;
    riskIncrease: number;  // +1 = increase one level
    condition?: string;  // "height > 5"
  }>;

  mitigations: Array<{
    action: string;  // "안전대 착용", "환기 실시"
    actionEn: string;
    riskReduction: number;  // -1 = decrease one level
    mandatory: boolean;
    verification?: string;  // "체크리스트 확인"
  }>;

  prohibitedConditions?: Array<{
    condition: string;  // "풍속 15m/s 이상"
    reason: string;
  }>;
}

export interface RiskMatrix {
  activities: RiskMatrixActivity[];

  riskLevelDefinitions: {
    critical: {
      color: string;
      colorHex: string;
      requiresPermit: boolean;
      requiredApprovals: string[];  // ["현장소장", "안전관리자", "본사 안전팀"]
      restrictions: string[];
    };
    high: {
      color: string;
      colorHex: string;
      requiresPermit: boolean;
      requiredApprovals: string[];
      restrictions: string[];
    };
    medium: {
      color: string;
      colorHex: string;
      requiresPermit: boolean;
      requiredApprovals: string[];
      restrictions: string[];
    };
    low: {
      color: string;
      colorHex: string;
      requiresPermit: boolean;
      requiredApprovals: string[];
      restrictions: string[];
    };
  };
}

// ============================================================
// Main Master Safety Plan
// ============================================================

export interface MasterSafetyPlan {
  // Metadata
  version: string;  // "1.0.0"
  createdAt: string;  // ISO 8601 date
  lastUpdatedAt: string;
  status: "draft" | "active" | "archived";

  // Site Information
  site: {
    name: string;
    nameEn?: string;
    location: {
      address: string;
      lat?: number;
      lng?: number;
    };
    type: SiteType;
    riskLevel: RiskLevel;
    startDate: string;  // ISO 8601
    expectedEndDate: string;
    actualEndDate?: string;
    contractor: string;
    projectManager: string;
    safetyManager: string;
  };

  // Weather-based work restrictions
  weatherLimits: WeatherLimits;

  // Work-specific safety requirements
  workRequirements: WorkRequirements;

  // Personnel requirements
  personnelRequirements: PersonnelRequirements;

  // Inspection schedules
  inspectionSchedule: InspectionSchedule;

  // Emergency procedures
  emergency: EmergencyProcedures;

  // Risk matrix (optional, for objective risk assessment)
  riskMatrix?: RiskMatrix;

  // Custom rules (for site-specific requirements)
  customRules?: Array<{
    id: string;
    title: string;
    titleEn: string;
    description: string;
    category: string;
    mandatory: boolean;
    verificationMethod: string;
  }>;

  // Compliance references
  complianceReferences?: {
    laws: string[];  // ["산업안전보건법", "건설기술진흥법"]
    standards: string[];  // ["KOSHA GUIDE H-82-2012"]
    internalPolicies: string[];
  };

  // Notes and attachments
  notes?: string;
  attachments?: Array<{
    filename: string;
    url: string;
    type: "pdf" | "image" | "document";
    uploadedAt: string;
  }>;
}

// ============================================================
// Validation Result Types
// ============================================================

export interface StructuredValidationIssue {
  severity: "error" | "warn" | "info";
  category: "weather" | "work_requirement" | "personnel" | "inspection" | "risk_level" | "custom";
  ruleId: string;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;

  // Reference to master plan section
  masterPlanReference: {
    section: string;  // "weatherLimits.windSpeed"
    expectedValue: any;
    actualValue: any;
  };

  // Remediation suggestion
  remediation?: string;
  remediationEn?: string;

  // Regulatory reference
  regulation?: string;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Validate document against structured master plan
 */
export function validateAgainstMasterPlan(
  document: any,
  masterPlan: MasterSafetyPlan
): StructuredValidationIssue[] {
  const issues: StructuredValidationIssue[] = [];

  // Weather validation
  if (masterPlan.weatherLimits.windSpeed && document.fields?.풍속) {
    const windSpeed = parseFloat(document.fields.풍속);
    if (!isNaN(windSpeed) && windSpeed > masterPlan.weatherLimits.windSpeed.max) {
      issues.push({
        severity: masterPlan.weatherLimits.windSpeed.action === "stop" ? "error" : "warn",
        category: "weather",
        ruleId: "weather_wind_exceeded",
        title: "기상 조건 위반 - 풍속",
        titleEn: "Weather Violation - Wind Speed",
        message: `풍속 ${windSpeed}${masterPlan.weatherLimits.windSpeed.unit}는 한계치 ${masterPlan.weatherLimits.windSpeed.max}${masterPlan.weatherLimits.windSpeed.unit}를 초과합니다.`,
        messageEn: `Wind speed ${windSpeed}${masterPlan.weatherLimits.windSpeed.unit} exceeds limit of ${masterPlan.weatherLimits.windSpeed.max}${masterPlan.weatherLimits.windSpeed.unit}`,
        masterPlanReference: {
          section: "weatherLimits.windSpeed",
          expectedValue: `<= ${masterPlan.weatherLimits.windSpeed.max}${masterPlan.weatherLimits.windSpeed.unit}`,
          actualValue: `${windSpeed}${masterPlan.weatherLimits.windSpeed.unit}`
        },
        remediation: masterPlan.weatherLimits.windSpeed.action === "stop"
          ? "작업을 즉시 중단하고 기상 조건 개선 후 재개하세요."
          : "작업 범위를 제한하고 추가 안전 조치를 취하세요.",
        remediationEn: masterPlan.weatherLimits.windSpeed.action === "stop"
          ? "Stop work immediately and resume after weather improves."
          : "Restrict work scope and take additional safety measures.",
        regulation: "산업안전보건기준에 관한 규칙 제38조"
      });
    }
  }

  // Height work validation
  if (masterPlan.workRequirements.heightWork?.enabled && document.checklist) {
    const heightWork = document.checklist.find((c: any) => c.id === "fall_01");

    if (heightWork?.value === "✔") {
      // Check required PPE
      for (const ppe of masterPlan.workRequirements.heightWork.requiredPPE) {
        if (ppe.mandatory) {
          const ppeItem = document.checklist.find((c: any) =>
            c.nameKo.includes(ppe.item) || c.id === getPPEId(ppe.item)
          );

          if (!ppeItem || ppeItem.value !== "✔") {
            issues.push({
              severity: "error",
              category: "work_requirement",
              ruleId: `height_work_ppe_${ppe.item}`,
              title: "고소작업 안전 조치 미이행",
              titleEn: "Height Work Safety Violation",
              message: `고소작업 시 ${ppe.item} 착용이 필수입니다.`,
              messageEn: `${ppe.itemEn} is mandatory for height work.`,
              masterPlanReference: {
                section: "workRequirements.heightWork.requiredPPE",
                expectedValue: `${ppe.item} 착용`,
                actualValue: ppeItem ? ppeItem.value : "확인 안 됨"
              },
              remediation: `${ppe.item}를 착용하고 체크리스트를 다시 작성하세요.`,
              remediationEn: `Wear ${ppe.itemEn} and re-submit checklist.`,
              regulation: ppe.standard || "산업안전보건기준에 관한 규칙 제42조"
            });
          }
        }
      }
    }
  }

  // Add more validation logic here...

  return issues;
}

/**
 * Helper to map PPE item names to checklist IDs
 */
function getPPEId(ppeName: string): string {
  const mapping: Record<string, string> = {
    "안전모": "ppe_01",
    "안전대": "ppe_03",
    "안전화": "ppe_02",
    "보안경": "ppe_04",
  };
  return mapping[ppeName] || "";
}

/**
 * Calculate risk level based on risk matrix
 */
export function calculateRiskLevel(
  activity: string,
  document: any,
  riskMatrix: RiskMatrix
): RiskLevel {
  const activityDef = riskMatrix.activities.find(a => a.activity === activity);
  if (!activityDef) return "medium";

  let riskLevel = activityDef.baseRiskLevel;
  let riskScore = getRiskScore(riskLevel);

  // Apply risk factors
  for (const factor of activityDef.riskFactors) {
    if (evaluateCondition(factor.condition, document)) {
      riskScore += factor.riskIncrease;
    }
  }

  // Apply mitigations
  for (const mitigation of activityDef.mitigations) {
    if (isMitigationApplied(mitigation, document)) {
      riskScore -= mitigation.riskReduction;
    }
  }

  return getLevelFromScore(riskScore);
}

function getRiskScore(level: RiskLevel): number {
  const scores = { low: 1, medium: 2, high: 3, critical: 4 };
  return scores[level];
}

function getLevelFromScore(score: number): RiskLevel {
  if (score >= 4) return "critical";
  if (score >= 3) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function evaluateCondition(condition: string | undefined, document: any): boolean {
  if (!condition) return false;
  // Simple condition evaluation - can be extended
  // Example: "height > 5" checks if document.fields.height > 5
  return false;  // Placeholder
}

function isMitigationApplied(mitigation: any, document: any): boolean {
  // Check if mitigation action is present in checklist
  return false;  // Placeholder
}

// ============================================================
// Default/Example Master Plan
// ============================================================

export const EXAMPLE_MASTER_PLAN: MasterSafetyPlan = {
  version: "1.0.0",
  createdAt: new Date().toISOString(),
  lastUpdatedAt: new Date().toISOString(),
  status: "active",

  site: {
    name: "김포 한강신도시 A공구",
    nameEn: "Gimpo Hangang New Town Site A",
    location: {
      address: "경기도 김포시 한강로 123",
      lat: 37.6150,
      lng: 126.7158
    },
    type: "building",
    riskLevel: "high",
    startDate: "2026-01-01",
    expectedEndDate: "2027-12-31",
    contractor: "한국건설",
    projectManager: "김프로",
    safetyManager: "박안전"
  },

  weatherLimits: {
    windSpeed: {
      max: 10,
      unit: "m/s",
      action: "stop",
      note: "풍속 10m/s 이상 시 고소작업 및 크레인 작업 중지"
    },
    temperature: {
      min: -10,
      max: 35,
      unit: "celsius",
      action: "restrict",
      note: "한파/폭염 시 야외 작업 제한, 2시간마다 휴식"
    },
    rainfall: {
      max: 5,
      unit: "mm/hr",
      action: "stop",
      note: "시간당 5mm 이상 강우 시 외부 작업 중지"
    }
  },

  workRequirements: {
    heightWork: {
      enabled: true,
      definition: { minHeight: 2, unit: "meters" },
      requiredPPE: [
        {
          item: "안전모",
          itemEn: "Safety Helmet",
          mandatory: true,
          standard: "KOSHA GUIDE H-14-2012"
        },
        {
          item: "안전대",
          itemEn: "Safety Harness",
          mandatory: true,
          standard: "KOSHA GUIDE H-82-2012",
          inspectionRequired: true
        }
      ],
      requiredEquipment: ["추락방호망", "안전난간", "이동식 비계"],
      fallProtectionMandatory: true,
      inspectionFrequency: "daily",
      specialConditions: ["야간 작업 금지", "우천 시 작업 금지"]
    },

    hotWork: {
      enabled: true,
      permitRequired: true,
      permitValidityHours: 8,
      fireExtinguishers: {
        min: 2,
        type: "ABC형",
        placement: "작업장 반경 10m 이내"
      },
      firewatchDuration: {
        duringWork: true,
        afterWork: { value: 30, unit: "minutes" }
      },
      clearanceRadius: { value: 10, unit: "meters" },
      combustibleMaterialRemoval: true,
      sparkShieldRequired: true
    }
  },

  personnelRequirements: {
    minWorkers: 2,
    requiredRoles: [
      {
        role: "안전관리자",
        roleEn: "Safety Manager",
        certification: "산업안전기사",
        mandatory: true,
        minCount: 1
      },
      {
        role: "관리감독자",
        roleEn: "Supervisor",
        mandatory: true,
        minCount: 1
      }
    ],
    trainingRequired: [
      {
        training: "신규 근로자 안전교육",
        trainingEn: "New Worker Safety Training",
        frequency: "daily",
        durationHours: 1,
        mandatory: true
      },
      {
        training: "특별안전교육",
        trainingEn: "Special Safety Training",
        frequency: "monthly",
        durationHours: 2,
        mandatory: true
      }
    ]
  },

  inspectionSchedule: {
    daily: [
      {
        inspection: "TBM (Tool Box Meeting)",
        inspectionEn: "TBM (Tool Box Meeting)",
        timeOfDay: "morning",
        mandatory: true
      },
      {
        inspection: "작업 전 안전점검",
        inspectionEn: "Pre-work Safety Inspection",
        timeOfDay: "before-work",
        mandatory: true
      }
    ],
    beforeWork: [
      {
        inspection: "고소작업 전 점검",
        inspectionEn: "Height Work Pre-inspection",
        applicableWork: ["고소작업"],
        mandatory: true
      }
    ]
  },

  emergency: {
    evacuationRoutes: [
      { route: "동측 계단", assembly: "정문 광장", capacity: 100 },
      { route: "서측 계단", assembly: "정문 광장", capacity: 100 }
    ],
    emergencyContacts: [
      { role: "현장소장", name: "김소장", phone: "010-1234-5678", available: "24/7" },
      { role: "안전관리자", name: "박안전", phone: "010-2345-6789", available: "working-hours" },
      { role: "119", name: "소방서", phone: "119", available: "24/7" }
    ],
    nearestHospital: {
      name: "김포병원",
      address: "경기도 김포시 병원로 1",
      distance: 2.5,
      distanceUnit: "km",
      phone: "031-1234-5678"
    },
    emergencyEquipment: [
      { equipment: "AED", location: "1층 현장사무소", quantity: 1, inspectionFrequency: "monthly" },
      { equipment: "비상샤워기", location: "작업장 출입구", quantity: 2, inspectionFrequency: "weekly" }
    ],
    emergencyDrills: {
      frequency: "monthly",
      types: ["화재대피", "추락사고", "붕괴사고"]
    }
  }
};
