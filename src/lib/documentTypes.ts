export const DOCUMENT_TYPES = {
    TBM: {
        value: "TBM",
        label: "TBM (Tool Box Meeting)",
        shortLabel: "TBM",
        icon: "groups",
        color: "blue",
    },
    SAFETY_CHECKLIST: {
        value: "SAFETY_CHECKLIST",
        label: "산업안전 점검표",
        shortLabel: "안전점검",
        icon: "fact_check",
        color: "green",
    },
    RISK_ASSESSMENT: {
        value: "RISK_ASSESSMENT",
        label: "위험성 평가 보고서",
        shortLabel: "위험평가",
        icon: "warning",
        color: "orange",
    },
    PRE_WORK_CHECKLIST: {
        value: "PRE_WORK_CHECKLIST",
        label: "작업 전 안전점검표",
        shortLabel: "작업전점검",
        icon: "assignment_turned_in",
        color: "purple",
    },
    OTHER: {
        value: "OTHER",
        label: "기타 문서",
        shortLabel: "기타",
        icon: "description",
        color: "gray",
    },
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

export function getDocumentTypeInfo(type: string | null | undefined) {
    if (!type) return DOCUMENT_TYPES.OTHER;
    return DOCUMENT_TYPES[type as DocumentType] || DOCUMENT_TYPES.OTHER;
}

export const getDocumentTypeColor = (type: string | null | undefined) => {
    const info = getDocumentTypeInfo(type);
    const colorMap = {
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
        orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
        purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        gray: "bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300 border-slate-200 dark:border-slate-600",
    };
    return colorMap[info.color as keyof typeof colorMap];
};
