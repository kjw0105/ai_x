
import { MasterSafetyPlan, RiskLevel, WorkAction, InspectionFrequency } from "./masterPlanSchema";

// Helper to create a base plan
const createBasePlan = (title: string, type: any): MasterSafetyPlan => ({
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    status: "active",
    site: {
        name: "Project Site",
        location: { address: "TBD" },
        type: type,
        riskLevel: "medium",
        startDate: new Date().toISOString().split('T')[0],
        expectedEndDate: "2026-12-31",
        contractor: "Main Contractor",
        projectManager: "Project Manager",
        safetyManager: "Safety Manager"
    },
    weatherLimits: {},
    workRequirements: {},
    personnelRequirements: { requiredRoles: [], trainingRequired: [] },
    inspectionSchedule: { daily: [], beforeWork: [] },
    emergency: {
        evacuationRoutes: [],
        emergencyContacts: [],
        nearestHospital: {
            name: "Nearest Hospital",
            address: "TBD",
            distance: 5,
            distanceUnit: "km",
            phone: "119"
        },
        emergencyEquipment: [],
        emergencyDrills: { frequency: "monthly", types: ["Fire"] }
    }
});

export const TEMPLATES: Record<string, MasterSafetyPlan> = {
    "general_construction": {
        ...createBasePlan("General Construction", "building"),
        weatherLimits: {
            windSpeed: { max: 10, unit: "m/s", action: "stop", note: "Stop lifting operations" },
            rainfall: { max: 10, unit: "mm/hr", action: "stop", note: "Stop outdoor work" }
        },
        workRequirements: {
            heightWork: {
                enabled: true,
                definition: { minHeight: 2, unit: "meters" },
                requiredPPE: [
                    { item: "안전모", itemEn: "Safety Helmet", mandatory: true },
                    { item: "안전대", itemEn: "Safety Harness", mandatory: true },
                    { item: "안전화", itemEn: "Safety Shoes", mandatory: true }
                ],
                requiredEquipment: ["Guardrails", "Safety Net"],
                fallProtectionMandatory: true,
                inspectionFrequency: "daily"
            },
            hotWork: {
                enabled: true,
                permitRequired: true,
                permitValidityHours: 8,
                fireExtinguishers: { min: 2, type: "ABC", placement: "Within 5m" },
                firewatchDuration: { duringWork: true, afterWork: { value: 1, unit: "hours" } },
                clearanceRadius: { value: 10, unit: "meters" },
                combustibleMaterialRemoval: true,
                sparkShieldRequired: true
            },
            electrical: {
                enabled: true,
                qualificationRequired: ["Electrician"],
                lockoutTagoutRequired: true,
                testingRequired: true,
                insulationRequired: true,
                permitRequired: false,
                doubleCheckRequired: true
            }
        },
        inspectionSchedule: {
            daily: [
                { inspection: "TBM", inspectionEn: "TBM", timeOfDay: "morning", mandatory: true },
                { inspection: "Site Cleanup", inspectionEn: "Housekeeping", timeOfDay: "after-work", mandatory: true }
            ],
            beforeWork: []
        }
    },

    "high_rise": {
        ...createBasePlan("High-Rise Building", "building"),
        site: { ...createBasePlan("High-Rise", "building").site, riskLevel: "high" },
        weatherLimits: {
            windSpeed: { max: 8, unit: "m/s", action: "stop", note: "Strict crane limits" }, // Stricter wind limit
            visibility: { min: 100, unit: "meters", action: "stop", note: "Crane visibility" }
        },
        workRequirements: {
            heightWork: {
                enabled: true,
                definition: { minHeight: 1.5, unit: "meters" }, // Stricter height def
                requiredPPE: [
                    { item: "안전모", itemEn: "Safety Helmet", mandatory: true },
                    { item: "안전대", itemEn: "Safety Harness", mandatory: true },
                    { item: "보안경", itemEn: "Safety Glasses", mandatory: true } // Added glasses for wind/dust
                ],
                requiredEquipment: ["Guardrails", "Safety Net", "Lifelines"],
                fallProtectionMandatory: true,
                inspectionFrequency: "per-shift" // More frequent
            },
            hotWork: {
                enabled: true,
                permitRequired: true,
                permitValidityHours: 4, // Stricter permit
                fireExtinguishers: { min: 4, type: "ABC", placement: "Within 3m" },
                firewatchDuration: { duringWork: true, afterWork: { value: 2, unit: "hours" } },
                clearanceRadius: { value: 15, unit: "meters" },
                combustibleMaterialRemoval: true,
                sparkShieldRequired: true
            }
        },
        inspectionSchedule: {
            daily: [
                { inspection: "TBM", inspectionEn: "TBM", timeOfDay: "morning", mandatory: true },
                { inspection: "Crane Inspection", inspectionEn: "Crane Check", timeOfDay: "morning", mandatory: true },
                { inspection: "Fall Protection Check", inspectionEn: "Safety Net Check", timeOfDay: "before-work", mandatory: true }
            ],
            beforeWork: []
        }
    },

    "infrastructure": {
        ...createBasePlan("Infrastructure / Civil", "civil"),
        weatherLimits: {
            rainfall: { max: 5, unit: "mm/hr", action: "stop", note: "Soil stability risk" }, // Stricter rain
            temperature: { min: -5, max: 35, unit: "celsius", action: "restrict", note: "Concrete curing limits" }
        },
        workRequirements: {
            excavation: {
                enabled: true,
                maxDepthWithoutShoring: { value: 1.5, unit: "meters" },
                requiredEquipment: ["Shoring", "Ladder", "Pump"],
                slopeRequirements: { maxAngle: 45, unit: "degrees" },
                inspectionFrequency: "daily",
                soilTestingRequired: true,
                utilityLocationRequired: true,
                barricadeRequired: true,
                exitRequirements: { maxDistance: 7, unit: "meters" }
            },
            confinedSpace: {
                enabled: true, // Manholes, tunnels
                definition: "Tunnels, Manholes",
                permitRequired: true,
                requiredTests: [
                    { test: "산소농도", testEn: "Oxygen", threshold: { min: 19.5, max: 23.5, unit: "%" }, frequency: "continuous", mandatory: true },
                    { test: "황화수소", testEn: "H2S", threshold: { max: 10, unit: "ppm" }, frequency: "continuous", mandatory: true }
                ],
                ventilationRequired: true,
                emergencyProcedures: ["Rescue Tripod", "Winches"],
                communicationRequired: true,
                standbyPersonRequired: true
            }
        },
        inspectionSchedule: {
            daily: [
                { inspection: "TBM", inspectionEn: "TBM", timeOfDay: "morning", mandatory: true },
                { inspection: "Heavy Equipment Check", inspectionEn: "Excavator Check", timeOfDay: "before-work", mandatory: true }
            ],
            beforeWork: []
        }
    },

    "interior_renovation": {
        ...createBasePlan("Interior Renovation", "renovation"),
        weatherLimits: {}, // Indoor mostly
        workRequirements: {
            hotWork: {
                enabled: true, // Cutting/Welding common in reno
                permitRequired: true,
                permitValidityHours: 8,
                fireExtinguishers: { min: 2, type: "ABC", placement: "Within 5m" },
                firewatchDuration: { duringWork: true, afterWork: { value: 1, unit: "hours" } },
                clearanceRadius: { value: 10, unit: "meters" },
                combustibleMaterialRemoval: true,
                sparkShieldRequired: true
            },
            electrical: {
                enabled: true,
                qualificationRequired: ["Electrician"],
                lockoutTagoutRequired: true,
                testingRequired: true,
                insulationRequired: true,
                permitRequired: true, // Strict for existing buildings
                doubleCheckRequired: true
            },
            heightWork: {
                enabled: true, // Ladders/Mobile Scaffolds
                definition: { minHeight: 2, unit: "meters" },
                requiredPPE: [
                    { item: "안전모", itemEn: "Safety Helmet", mandatory: true }
                ],
                requiredEquipment: ["A-Frame Ladder", "Rolling Scaffold"],
                fallProtectionMandatory: false, // Often not possible indoors for low height, but buckets/rails required
                scaffoldingRequirements: { maxHeight: 5, inspectionFrequency: "daily", certificationRequired: false },
                inspectionFrequency: "daily"
            }
        },
        inspectionSchedule: {
            daily: [
                { inspection: "TBM", inspectionEn: "TBM", timeOfDay: "morning", mandatory: true },
                { inspection: "Dust Control Check", inspectionEn: "Dust Check", timeOfDay: "any", mandatory: true }
            ],
            beforeWork: []
        }
    }
};

export const TEMPLATE_METADATA = [
    { id: "general_construction", name: "일반 건설 현장 (General)", description: "표준적인 안전 기준을 적용한 일반 건설 현장용 템플릿입니다." },
    { id: "high_rise", name: "고층 건축 공사 (High-Rise)", description: "낙하물, 크레인, 고소작업에 대한 엄격한 기준을 적용합니다." },
    { id: "infrastructure", name: "토목/기반시설 (Infrastructure)", description: "굴착, 밀폐공간(맨홀/터널), 중장비 작업에 최적화되었습니다." },
    { id: "interior_renovation", name: "실내 리모델링 (Interior)", description: "화재(화기작업), 전기 안전, 실내 비계 작업에 중점을 둡니다." }
];
