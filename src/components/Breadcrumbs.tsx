"use client";

interface Breadcrumb {
    label: string;
    onClick?: () => void;
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
                        <span className="text-slate-900 dark:text-white font-bold">
                            {item.label}
                        </span>
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
