/**
 * validationConfig.ts - Centralized configuration for validation system
 *
 * This module provides configurable parameters for all validation stages,
 * allowing easy customization per project or deployment.
 *
 * @module validationConfig
 * @version 1.0.0
 */

import type { PatternThresholds } from "./patternAnalysis";

/**
 * Validation Configuration
 * All parameters can be customized based on project requirements
 */
export interface ValidationConfig {
    // Stage 2: Intra-Checklist Logic
    stage2: {
        // Enable/disable specific rule categories
        enableSafetyViolations: boolean;
        enableContradictions: boolean;
        enableCompleteness: boolean;
        enableSuspiciousPatterns: boolean;

        // Minimum checklist length
        minimumChecklistItems: number;

        // N/A pattern threshold (0-1 = percentage)
        excessiveNAThreshold: number;
    };

    // Stage 3: Cross-Document Consistency
    stage3: {
        // Enable AI-powered context checking
        enabled: boolean;

        // Master Plan required for project
        requireMasterPlan: boolean;

        // Risk level validation strictness
        strictRiskLevelMatching: boolean;
    };

    // Stage 4: Behavioral Pattern Analysis
    stage4: {
        // Enable pattern analysis
        enabled: boolean;

        // Pattern detection thresholds
        thresholds: PatternThresholds;

        // Enable name normalization (handles "김철수" = "김 철수")
        normalizeInspectorNames: boolean;

        // Enable time-weighted analysis
        useTimeWeighting: boolean;

        // Cumulative score threshold for alerts
        criticalScoreThreshold: number; // 0-100+
        highScoreThreshold: number;
        mediumScoreThreshold: number;
    };

    // Stage 5: Risk Signal Guidance
    stage5: {
        // Enable risk signals
        enabled: boolean;

        // Include Korean safety law references
        includeReferences: boolean;

        // Include actionable guidance
        includeGuidance: boolean;
    };

    // Global settings
    global: {
        // API provider preference
        defaultAIProvider: "openai" | "claude" | "auto";

        // Maximum validation time (ms)
        maxValidationTime: number;

        // Enable detailed logging
        verboseLogging: boolean;
    };
}

/**
 * Default configuration (Production-ready)
 * Conservative thresholds suitable for real construction sites
 */
export const DEFAULT_CONFIG: ValidationConfig = {
    stage2: {
        enableSafetyViolations: true,
        enableContradictions: true,
        enableCompleteness: true,
        enableSuspiciousPatterns: true,
        minimumChecklistItems: 5,
        excessiveNAThreshold: 0.5, // 50% or more N/A = suspicious
    },

    stage3: {
        enabled: true,
        requireMasterPlan: false, // Optional for backward compatibility
        strictRiskLevelMatching: false, // Warn instead of error
    },

    stage4: {
        enabled: true,
        thresholds: {
            alwaysCheckRate: 0.95, // 95%+ always checked
            copyPasteCount: 3, // 3+ identical descriptions
            rapidCompletionMinutes: 30, // 30-minute window
            rapidCompletionCount: 5, // 5+ reports
            minimumReports: 5, // Need 5 reports for analysis
            timeWeightDays: 30, // Last 30 days weighted higher
        },
        normalizeInspectorNames: true,
        useTimeWeighting: true,
        criticalScoreThreshold: 80,
        highScoreThreshold: 50,
        mediumScoreThreshold: 30,
    },

    stage5: {
        enabled: true,
        includeReferences: true,
        includeGuidance: true,
    },

    global: {
        defaultAIProvider: "auto",
        maxValidationTime: 30000, // 30 seconds
        verboseLogging: false,
    },
};

/**
 * Strict configuration (Demo/Testing)
 * More aggressive thresholds for catching all potential issues
 */
export const STRICT_CONFIG: ValidationConfig = {
    ...DEFAULT_CONFIG,
    stage2: {
        ...DEFAULT_CONFIG.stage2,
        excessiveNAThreshold: 0.3, // 30% N/A = suspicious (stricter)
    },
    stage4: {
        ...DEFAULT_CONFIG.stage4,
        thresholds: {
            alwaysCheckRate: 0.90, // 90%+ (stricter)
            copyPasteCount: 2, // 2+ identical (stricter)
            rapidCompletionMinutes: 20, // 20 minutes (stricter)
            rapidCompletionCount: 4, // 4+ reports (stricter)
            minimumReports: 3, // Lower minimum
            timeWeightDays: 14, // Last 2 weeks
        },
        criticalScoreThreshold: 60, // Lower thresholds (more alerts)
        highScoreThreshold: 35,
        mediumScoreThreshold: 20,
    },
};

/**
 * Lenient configuration (High-Volume Sites)
 * Less aggressive for sites with many legitimate reports
 */
export const LENIENT_CONFIG: ValidationConfig = {
    ...DEFAULT_CONFIG,
    stage2: {
        ...DEFAULT_CONFIG.stage2,
        excessiveNAThreshold: 0.7, // 70% N/A (more lenient)
    },
    stage4: {
        ...DEFAULT_CONFIG.stage4,
        thresholds: {
            alwaysCheckRate: 0.98, // 98%+ (more lenient)
            copyPasteCount: 5, // 5+ identical (more lenient)
            rapidCompletionMinutes: 60, // 1 hour window
            rapidCompletionCount: 10, // 10+ reports
            minimumReports: 10, // Need more data
            timeWeightDays: 60, // Last 60 days
        },
        criticalScoreThreshold: 100, // Higher thresholds (fewer alerts)
        highScoreThreshold: 70,
        mediumScoreThreshold: 40,
    },
};

/**
 * Load configuration from environment or use default
 * Can be extended to load from database or config file
 */
export function getValidationConfig(): ValidationConfig {
    const env = process.env.VALIDATION_MODE;

    switch (env) {
        case "strict":
            return STRICT_CONFIG;
        case "lenient":
            return LENIENT_CONFIG;
        default:
            return DEFAULT_CONFIG;
    }
}

/**
 * Override specific config values
 * Useful for per-project customization
 */
export function customizeConfig(
    base: ValidationConfig,
    overrides: Partial<ValidationConfig>
): ValidationConfig {
    return {
        ...base,
        stage2: { ...base.stage2, ...overrides.stage2 },
        stage3: { ...base.stage3, ...overrides.stage3 },
        stage4: { ...base.stage4, ...overrides.stage4 },
        stage5: { ...base.stage5, ...overrides.stage5 },
        global: { ...base.global, ...overrides.global },
    };
}

/**
 * Validation config examples for specific use cases
 */
export const PRESET_CONFIGS = {
    // For demo/competition - catches everything
    demo: STRICT_CONFIG,

    // For production with experienced inspectors
    production: DEFAULT_CONFIG,

    // For high-volume sites with batch processing
    highVolume: LENIENT_CONFIG,

    // For testing - very strict, no pattern analysis
    testing: {
        ...STRICT_CONFIG,
        stage4: {
            ...STRICT_CONFIG.stage4,
            enabled: false, // Disable pattern analysis for unit tests
        },
    },
};
