/**
 * Smart Diagnostics Configuration
 * Production-ready configuration for different environments
 */

import { SmartDiagnosticsConfig } from './types';

export const DIAGNOSTICS_CONFIG = {
  development: {
    enabled: true,
    aiAnalysis: true,
    samplingRate: 0.8, // Process 80% of errors in development
    maxErrors: 100,
    performanceMode: false
  } as SmartDiagnosticsConfig,

  production: {
    enabled: true,
    aiAnalysis: true,
    samplingRate: 0.2, // Process only 20% of errors in production
    maxErrors: 30,
    performanceMode: true
  } as SmartDiagnosticsConfig,

  testing: {
    enabled: true,
    aiAnalysis: false, // Disable AI analysis in tests for speed
    samplingRate: 1.0, // Process all errors in tests
    maxErrors: 50,
    performanceMode: false
  } as SmartDiagnosticsConfig
};

/**
 * Get configuration for current environment
 */
export function getDiagnosticsConfig(): SmartDiagnosticsConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return DIAGNOSTICS_CONFIG.production;
    case 'test':
      return DIAGNOSTICS_CONFIG.testing;
    default:
      return DIAGNOSTICS_CONFIG.development;
  }
}

/**
 * Feature flags for diagnostics system
 */
export const DIAGNOSTICS_FEATURES = {
  AUTO_REPAIR: process.env.NODE_ENV !== 'production', // Disable auto-repair in production
  REAL_TIME_DASHBOARD: process.env.NODE_ENV === 'development',
  PERFORMANCE_MONITORING: true,
  ERROR_ANALYTICS: true,
  MACHINE_LEARNING: process.env.NODE_ENV !== 'test', // Disable ML in tests
  EXPORT_DIAGNOSTICS: true
};

/**
 * Performance thresholds for monitoring
 */
export const PERFORMANCE_THRESHOLDS = {
  FPS_WARNING: 45,
  FPS_CRITICAL: 30,
  MEMORY_WARNING: 100, // MB
  MEMORY_CRITICAL: 200, // MB
  ERROR_RATE_WARNING: 5, // errors per minute
  ERROR_RATE_CRITICAL: 10 // errors per minute
};

/**
 * Error categorization patterns
 */
export const ERROR_PATTERNS = {
  webgl: /webgl|three\.js|shader|buffer|texture/i,
  audio: /audio|webaudio|microphone|sound/i,
  model: /gltf|fbx|obj|model|loader/i,
  animation: /animation|keyframe|timeline|blend/i,
  performance: /fps|memory|lag|slow|throttle/i,
  network: /fetch|network|cors|timeout|connection/i
};
