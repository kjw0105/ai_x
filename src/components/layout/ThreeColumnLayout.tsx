"use client";

import { useState, ReactNode } from "react";

interface ThreeColumnLayoutProps {
  left: ReactNode;  // Issues list
  center: ReactNode; // Document viewer
  right: ReactNode; // Chat & summary
}

export function ThreeColumnLayout({ left, center, right }: ThreeColumnLayoutProps) {
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<"analysis" | "issues">("analysis");

  // Calculate widths based on collapsed state
  const getWidths = () => {
    if (rightCollapsed) {
      return { center: "100%", right: "0%" };
    }
    return { center: "70%", right: "30%" };
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
            <div className="flex flex-col gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">psychology</span>
                  분석 패널
                </h3>
                <button
                  onClick={() => setRightCollapsed(true)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                  title="패널 숨기기"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActivePanel("analysis")}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    activePanel === "analysis"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  AI 분석
                </button>
                <button
                  onClick={() => setActivePanel("issues")}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    activePanel === "issues"
                      ? "bg-red-500 text-white"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  발견된 문제
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {activePanel === "analysis" ? right : left}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
