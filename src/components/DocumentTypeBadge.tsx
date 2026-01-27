"use client";

import { getDocumentTypeInfo, getDocumentTypeColor } from "@/lib/documentTypes";

interface DocumentTypeBadgeProps {
    type: string | null | undefined;
    size?: "sm" | "md" | "lg";
    showIcon?: boolean;
}

export function DocumentTypeBadge({ type, size = "md", showIcon = true }: DocumentTypeBadgeProps) {
    const info = getDocumentTypeInfo(type);
    const colorClass = getDocumentTypeColor(type);

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5",
    };

    const iconSizes = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
    };

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-bold border ${colorClass} ${sizeClasses[size]}`}
        >
            {showIcon && <span className={`material-symbols-outlined ${iconSizes[size]}`}>{info.icon}</span>}
            <span>{info.shortLabel}</span>
        </span>
    );
}
