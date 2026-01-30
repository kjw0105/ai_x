"use client";

interface Breadcrumb {
    label: string;
    onClick?: () => void;
    badge?: {
        text: string;
        color: "blue" | "gray";
        tooltip: string;
    };
}

interface BreadcrumbsProps {
    items: Breadcrumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    if (items.length === 0) return null;

    return (
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    {item.onClick ? (
                        <button
                            onClick={item.onClick}
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors hover:underline"
                        >
                            {item.label}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-slate-900 dark:text-white font-bold">
                                {item.label}
                            </span>
                            {item.badge && (
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                        item.badge.color === "blue"
                                            ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                                            : "bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30"
                                    }`}
                                    title={item.badge.tooltip}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                        description
                                    </span>
                                    <span>{item.badge.text}</span>
                                </span>
                            )}
                        </div>
                    )}
                    {index < items.length - 1 && (
                        <span className="material-symbols-outlined text-slate-400 text-base">
                            chevron_right
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
