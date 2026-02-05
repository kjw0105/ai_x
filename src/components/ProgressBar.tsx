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
    // currentStep is 0-indexed: 0=stage 1, 1=stage 2, ..., steps.length=complete
    const progress = Math.min((currentStep / steps.length) * 100, 100);
    const currentStepIndex = Math.floor(currentStep);
    const currentStepData = steps[currentStepIndex];

    // Debug logging
    console.log(`[ProgressBar] currentStep: ${currentStep}, stepsLength: ${steps.length}, progress: ${progress}%, currentStepIndex: ${currentStepIndex}`);

    return (
        <div className="w-full max-w-3xl mx-auto p-6">
            {/* Current Stage Display */}
            {currentStepData && (
                <div key={`stage-${currentStepIndex}`} className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
                        <span className="material-symbols-outlined text-lg animate-pulse">{currentStepData.icon}</span>
                        <span key={`stage-label-${currentStepIndex}`} className="text-sm font-bold">Stage {currentStepIndex + 1}/{steps.length}</span>
                    </div>
                    <h4 key={`stage-title-${currentStepIndex}`} className="text-xl font-black text-slate-900 dark:text-white">
                        {currentStepData.label}
                    </h4>
                </div>
            )}

            {/* Progress Bar */}
            <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-8">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-blue-600 to-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
            </div>

            {/* Steps - Dynamic grid based on step count */}
            <div className={`grid ${
                steps.length === 3
                    ? 'grid-cols-3 gap-8 max-w-xl mx-auto'
                    : steps.length === 5
                    ? 'grid-cols-5 gap-2'
                    : 'grid-cols-4 gap-4'
            }`}>
                {steps.map((step, index) => {
                    const isActive = index === currentStepIndex;
                    const isCompleted = index < currentStepIndex;
                    // Larger icons for 3-stage layout
                    const iconSize = steps.length === 3 ? 'size-16' : 'size-14';
                    const iconTextSize = steps.length === 3 ? 'text-3xl' : 'text-2xl';

                    return (
                        <div
                            key={step.id}
                            className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                                isActive ? "scale-110" : ""
                            }`}
                        >
                            <div
                                className={`${iconSize} rounded-full flex items-center justify-center border-3 transition-all relative ${
                                    isCompleted
                                        ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/50"
                                        : isActive
                                        ? "bg-blue-500 border-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/50"
                                        : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400"
                                }`}
                            >
                                {/* Stage Number Badge */}
                                <div className="absolute -top-1 -right-1 size-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black flex items-center justify-center">
                                    {index + 1}
                                </div>

                                {isCompleted ? (
                                    <span className={`material-symbols-outlined ${iconTextSize}`}>check</span>
                                ) : (
                                    <span className={`material-symbols-outlined ${iconTextSize}`}>{step.icon}</span>
                                )}
                            </div>
                            <span
                                className={`text-xs font-bold text-center leading-tight ${
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
            <div className="text-center mt-8">
                <span key={`progress-${Math.round(progress)}`} className="text-4xl font-black text-slate-900 dark:text-white">
                    {Math.round(progress)}%
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    검증 진행 중...
                </p>
            </div>
        </div>
    );
}
