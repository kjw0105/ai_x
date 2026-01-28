"use client";

import { useEffect } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
    id: string;
    message: string;
    variant?: ToastVariant;
    duration?: number;
    onClose: (id: string) => void;
}

const variantStyles = {
    success: "bg-green-500 border-green-600",
    error: "bg-red-500 border-red-600",
    warning: "bg-yellow-500 border-yellow-600",
    info: "bg-blue-500 border-blue-600",
};

const variantIcons = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
};

export function Toast({ id, message, variant = "info", duration = 3000, onClose }: ToastProps) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => onClose(id), duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    return (
        <div
            className={`${variantStyles[variant]} text-white px-4 py-3 rounded-lg shadow-lg border-l-4 flex items-center gap-3 min-w-[300px] max-w-md animate-in slide-in-from-right duration-300`}
        >
            <span className="material-symbols-outlined text-2xl">{variantIcons[variant]}</span>
            <span className="flex-1 font-medium text-sm">{message}</span>
            <button
                onClick={() => onClose(id)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
                <span className="material-symbols-outlined text-lg">close</span>
            </button>
        </div>
    );
}
