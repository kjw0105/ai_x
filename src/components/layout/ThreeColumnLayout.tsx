"use client";

import { useState, useEffect, ReactNode } from "react";

interface ThreeColumnLayoutProps {
  left: ReactNode;  // Issues list
  center: ReactNode; // Document viewer
  right: ReactNode; // Chat & summary
  forceActivePanel?: "analysis" | "issues" | null; // External control to switch tabs
  onActivePanelChange?: (panel: "analysis" | "issues") => void; // Notify parent of tab changes
}

export function ThreeColumnLayout({ left, center, right, forceActivePanel, onActivePanelChange }: ThreeColumnLayoutProps) {
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<"analysis" | "issues">("analysis");

  // Handle external tab switch request
  useEffect(() => {
    if (forceActivePanel && forceActivePanel !== activePanel) {
      setActivePanel(forceActivePanel);
      onActivePanelChange?.(forceActivePanel);
    }
  }, [forceActivePanel]);

  // Calculate widths based on collapsed state and screen size
  const getWidths = () => {
    if (rightCollapsed) {
      return { center: "100%", right: "0%" };
    }
    // More space for document viewer on smaller screens (below 1280px)
    // Use 60/40 split instead of 70/30 for better readability
    return { center: "60%", right: "40%" };
  };

  const widths = getWidths();

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Center Column - Document Viewer */}
      <div
        className="transition-all duration-300"
        style={{ width: rightCollapsed ? "100%" : widths.center }}
      >
        {center}
      </div>

      {/* Right Expand Button */}
      {rightCollapsed && (
        <button
          onClick={() => setRightCollapsed(false)}
          className="hidden lg:flex w-6 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 items-center justify-center transition-colors"
          title="분석 패널 열기"
        >
          <span className="material-symbols-outlined text-slate-500 text-lg">chevron_left</span>
        </button>
      )}

      {/* Right Column - Chat & Summary */}
      <div
        className={`border-l border-slate-200 dark:border-slate-700 transition-all duration-300 ${
          rightCollapsed ? "w-0" : ""
        } hidden lg:flex flex-col`}
        style={{ width: rightCollapsed ? "0" : widths.right }}
      >
        {!rightCollapsed && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex flex-col border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">psychology</span>
                  분석 패널
                </h3>
                <button
                  onClick={() => setRightCollapsed(true)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  title="패널 숨기기"
                >
                  <span className="material-symbols-outlined text-lg text-slate-500 dark:text-slate-400">chevron_right</span>
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setActivePanel("analysis")}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all relative ${
                    activePanel === "analysis"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-base">chat</span>
                    AI 분석
                  </span>
                  {activePanel === "analysis" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
                <button
                  onClick={() => setActivePanel("issues")}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all relative ${
                    activePanel === "issues"
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-base">error</span>
                    발견된 문제
                  </span>
                  {activePanel === "issues" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Content Panels - Both mounted, visibility toggled */}
            <div className="flex-1 overflow-hidden">
              <div className={`h-full ${activePanel === "analysis" ? "block" : "hidden"}`}>
                {right}
              </div>
              <div className={`h-full ${activePanel === "issues" ? "block" : "hidden"}`}>
                {left}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
