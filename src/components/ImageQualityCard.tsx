"use client";

export interface ImageQuality {
  resolution: { width: number; height: number };
  fileSize: number; // bytes
  quality: "excellent" | "good" | "fair" | "poor";
  issues: string[];
  tips: string[];
}

interface ImageQualityCardProps {
  quality: ImageQuality;
  fileName: string;
}

export function ImageQualityCard({ quality, fileName }: ImageQualityCardProps) {
  const qualityConfig = {
    excellent: {
      color: "green",
      icon: "check_circle",
      label: "우수",
      bgClass: "bg-green-50 dark:bg-green-900/20",
      borderClass: "border-green-200 dark:border-green-800",
      textClass: "text-green-700 dark:text-green-300",
      iconClass: "text-green-600 dark:text-green-400",
    },
    good: {
      color: "blue",
      icon: "thumb_up",
      label: "양호",
      bgClass: "bg-blue-50 dark:bg-blue-900/20",
      borderClass: "border-blue-200 dark:border-blue-800",
      textClass: "text-blue-700 dark:text-blue-300",
      iconClass: "text-blue-600 dark:text-blue-400",
    },
    fair: {
      color: "yellow",
      icon: "warning",
      label: "보통",
      bgClass: "bg-yellow-50 dark:bg-yellow-900/20",
      borderClass: "border-yellow-200 dark:border-yellow-800",
      textClass: "text-yellow-700 dark:text-yellow-300",
      iconClass: "text-yellow-600 dark:text-yellow-400",
    },
    poor: {
      color: "red",
      icon: "error",
      label: "불량",
      bgClass: "bg-red-50 dark:bg-red-900/20",
      borderClass: "border-red-200 dark:border-red-800",
      textClass: "text-red-700 dark:text-red-300",
      iconClass: "text-red-600 dark:text-red-400",
    },
  };

  const config = qualityConfig[quality.quality];

  return (
    <div
      className={`rounded-2xl border-2 p-6 ${config.bgClass} ${config.borderClass} transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`size-12 rounded-xl ${config.bgClass} flex items-center justify-center`}
          >
            <span className={`material-symbols-outlined text-3xl ${config.iconClass}`}>
              {config.icon}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              이미지 품질 분석
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-bold ${config.textClass}`}>
                품질: {config.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                · {fileName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-lg text-slate-500">
              photo_size_select_large
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              해상도
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {quality.resolution.width} × {quality.resolution.height}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {(quality.resolution.width * quality.resolution.height / 1_000_000).toFixed(1)}MP
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-lg text-slate-500">
              file_present
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              파일 크기
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {(quality.fileSize / 1024).toFixed(1)} KB
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {quality.fileSize < 100_000 ? "압축됨" : quality.fileSize > 5_000_000 ? "대용량" : "적정"}
          </p>
        </div>
      </div>

      {/* Issues */}
      {quality.issues.length > 0 && (
        <div className={`rounded-xl p-4 mb-4 ${config.bgClass}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`material-symbols-outlined text-lg ${config.iconClass}`}>
              info
            </span>
            <span className={`text-sm font-bold ${config.textClass}`}>
              감지된 문제
            </span>
          </div>
          <ul className="space-y-1">
            {quality.issues.map((issue, idx) => (
              <li key={idx} className={`text-sm ${config.textClass} flex items-start gap-2`}>
                <span className="material-symbols-outlined text-base mt-0.5">
                  chevron_right
                </span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {quality.tips.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-lg text-blue-600 dark:text-blue-400">
              lightbulb
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              개선 팁
            </span>
          </div>
          <ul className="space-y-1">
            {quality.tips.map((tip, idx) => (
              <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-blue-500 mt-0.5">
                  check_small
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
