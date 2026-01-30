"use client";

interface Step {
    id: string;
    label: string;
    icon: string;
}

interface ProgressBarProps {
    currentStep: number;
    steps: Step[];
}

export function ProgressBar({ currentStep, steps }: ProgressBarProps) {
    // Support fractional steps for smoother progress (e.g., 2.5 for 50% through step 2)
    const progress = ((currentStep + 1) / steps.length) * 100;
    const currentStepIndex = Math.floor(currentStep);

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
            </div>

            {/* Steps */}
            <div className="flex justify-between items-center">
                {steps.map((step, index) => {
                    const isActive = index === currentStepIndex;
                    const isCompleted = index < currentStepIndex;

                    return (
                        <div
                            key={step.id}
                            className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                                isActive ? "scale-110" : ""
                            }`}
                        >
                            <div
                                className={`size-12 rounded-full flex items-center justify-center border-2 transition-all ${
                                    isCompleted
                                        ? "bg-green-500 border-green-500 text-white"
                                        : isActive
                                        ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                                        : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400"
                                }`}
                            >
                                {isCompleted ? (
                                    <span className="material-symbols-outlined">check</span>
                                ) : (
                                    <span className="material-symbols-outlined">{step.icon}</span>
                                )}
                            </div>
                            <span
                                className={`text-xs font-bold text-center ${
                                    isActive
                                        ? "text-blue-600 dark:text-blue-400"
                                        : isCompleted
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-slate-400"
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Percentage */}
            <div className="text-center mt-6">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
}
