/**
 * Smart AI Error Detection Types
 * Lightweight, performance-optimized error detection system
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'audio' | 'rendering' | 'model' | 'animation' | 'ui' | 'performance' | 'system';

export interface SmartError {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: ErrorContext;
  aiAnalysis?: AIAnalysis;
}

export interface ErrorContext {
  component?: string;
  userAction?: string;
  systemState: {
    memoryUsage: number;
    fps: number;
    features: string[];
  };
  customData?: Record<string, any>;
}

export interface AIAnalysis {
  confidence: number;
  predictedCause: string;
  suggestion: string;
  pattern: string;
  similar: number;
}

export interface SmartDiagnosticsConfig {
  enabled: boolean;
  aiAnalysis: boolean;
  samplingRate: number; // 0.1 = 10% of errors processed
  maxErrors: number; // Maximum errors to keep in memory
  performanceMode: boolean; // Ultra-lightweight mode
}

export type ErrorCallback = (error: SmartError) => void;
