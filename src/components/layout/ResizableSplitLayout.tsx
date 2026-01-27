
"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface ResizableSplitLayoutProps {
    left: ReactNode;
    right: ReactNode;
    initialLeftWidthPercent?: number; // 0-100
}

export default function ResizableSplitLayout({ left, right, initialLeftWidthPercent = 60 }: ResizableSplitLayoutProps) {
    const [leftWidth, setLeftWidth] = useState(initialLeftWidthPercent);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mobile check (simple via window width)
    const [isMobile, setIsMobile] = useState(false);
    const [activeTab, setActiveTab] = useState<"left" | "right">("left");

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };
        handleResize(); // init
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Drag logic
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const w = rect.width;
            let pct = (x / w) * 100;

            // Clamp
            if (pct < 20) pct = 20;
            if (pct > 80) pct = 80;

            setLeftWidth(pct);
        };

        const handleUp = () => {
            setIsDragging(false);
            document.body.style.cursor = "default";
            document.body.style.userSelect = "auto";
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }

        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [isDragging]);

    if (isMobile) {
        // Mobile Tab View
        return (
            <div className="flex-1 flex flex-col min-h-0 relative">
                <div className="flex-1 relative overflow-hidden">
                    {/* Use absolute positioning or conditional rendering. Conditional is safer for react state preservation? 
                 Actually absolute stacking is better to keep state alive (like scroll position) */}
                    <div className={`absolute inset-0 ${activeTab === "left" ? "z-10" : "z-0 hidden"}`}>
                        {left}
                    </div>
                    <div className={`absolute inset-0 ${activeTab === "right" ? "z-10" : "z-0 hidden"}`}>
                        {right}
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="shrink-0 flex border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark safe-area-pb">
                    <button
                        onClick={() => setActiveTab("left")}
                        className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeTab === "left" ? "text-primary" : "text-slate-400"}`}
                    >
                        <span className="material-symbols-outlined">description</span>
                        <span className="text-xs font-bold">현재 파일</span>
                    </button>
                    <div className="w-px bg-slate-100 dark:bg-slate-700 my-2"></div>
                    <button
                        onClick={() => setActiveTab("right")}
                        className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeTab === "right" ? "text-primary" : "text-slate-400"}`}
                    >
                        {/* Badge suggestion? */}
                        <span className="material-symbols-outlined">smart_toy</span>
                        <span className="text-xs font-bold">AI 분석</span>
                    </button>
                </div>
            </div>
        );
    }

    // Desktop Split View
    return (
        <div className="flex-1 flex min-h-0 relative overflow-hidden" ref={containerRef}>
            <div style={{ width: `${leftWidth}%` }} className="h-full relative shrink-0">
                {left}
            </div>

            {/* Resizer Handle */}
            <div
                className="w-4 bg-slate-100 dark:bg-slate-900 border-l border-r border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-col-resize flex flex-col items-center justify-center gap-1 group z-20 shrink-0 transition-colors"
                onMouseDown={() => setIsDragging(true)}
            >
                <div className="w-1 h-8 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-400 transition-colors" />
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-400 transition-colors" />
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-400 transition-colors" />
            </div>

            <div style={{ width: `${100 - leftWidth}%` }} className="h-full relative shrink-0">
                {right}
            </div>
        </div>
    );
}
