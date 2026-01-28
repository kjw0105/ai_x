"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastVariant } from "@/components/Toast";

interface ToastItem {
    id: string;
    message: string;
    variant?: ToastVariant;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (message: string, variant: ToastVariant = "info", duration: number = 3000) => {
            const id = crypto.randomUUID();
            setToasts((prev) => [...prev, { id, message, variant, duration }]);
        },
        []
    );

    const success = useCallback(
        (message: string, duration?: number) => showToast(message, "success", duration),
        [showToast]
    );

    const error = useCallback(
        (message: string, duration?: number) => showToast(message, "error", duration),
        [showToast]
    );

    const warning = useCallback(
        (message: string, duration?: number) => showToast(message, "warning", duration),
        [showToast]
    );

    const info = useCallback(
        (message: string, duration?: number) => showToast(message, "info", duration),
        [showToast]
    );

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            id={toast.id}
                            message={toast.message}
                            variant={toast.variant}
                            duration={toast.duration}
                            onClose={removeToast}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}
