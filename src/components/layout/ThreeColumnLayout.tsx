"use client";

import { useState, ReactNode } from "react";

interface ThreeColumnLayoutProps {
  left: ReactNode;  // Issues list
  center: ReactNode; // Document viewer
  right: ReactNode; // Chat & summary
}

export function ThreeColumnLayout({ left, center, right }: ThreeColumnLayoutProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Calculate widths based on collapsed state
  const getWidths = () => {
    if (leftCollapsed && rightCollapsed) {
      return { left: "0%", center: "100%", right: "0%" };
    }
    if (leftCollapsed) {
      return { left: "0%", center: "70%", right: "30%" };
    }
    if (rightCollapsed) {
      return { left: "30%", center: "70%", right: "0%" };
    }
    return { left: "25%", center: "50%", right: "25%" };
  };

  const widths = getWidths();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Column - Issues */}
      <div
        className={`border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
          leftCollapsed ? "w-0" : ""
        } hidden lg:flex flex-col`}
        style={{ width: leftCollapsed ? "0" : widths.left }}
      >
        {!leftCollapsed && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                발견된 문제
              </h3>
              <button
                onClick={() => setLeftCollapsed(true)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="패널 숨기기"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {left}
            </div>
          </div>
        )}
      </div>

      {/* Left Expand Button */}
      {leftCollapsed && (
        <button
          onClick={() => setLeftCollapsed(false)}
          className="hidden lg:flex w-6 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 items-center justify-center transition-colors"
          title="문제 목록 열기"
        >
          <span className="material-symbols-outlined text-slate-500 text-lg">chevron_right</span>
        </button>
      )}

      {/* Center Column - Document Viewer */}
      <div
        className="flex-1 transition-all duration-300"
        style={{ width: widths.center }}
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">psychology</span>
                AI 분석
              </h3>
              <button
                onClick={() => setRightCollapsed(true)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="패널 숨기기"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {right}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
