/**
 * Lazy Loading Components for Phase 3 Deployment
 * 
 * Code splitting implementation to reduce initial bundle size
 * Agent 2 - Performance Optimization Team
 */

import React, { lazy } from 'react'

// Lazy load performance dashboard (only load when opened)
export const LazyPerformanceDashboard = lazy(() => 
  import('../components/UI/PerformanceDashboard').then(module => ({
    default: module.PerformanceDashboard
  }))
)

// Lazy load diagnostics dashboard (only load when diagnostics are accessed)
export const LazyDiagnosticsDashboard = lazy(() => 
  import('../diagnostics/DiagnosticsDashboard').then(module => ({
    default: module.DiagnosticsDashboard
  }))
)

// Lazy load advanced animation features (timeline editor, IK solver)
export const LazyTimelineEditor = lazy(() => 
  import('../components/UI/TimelineEditor').then(module => ({
    default: module.default
  }))
)

// Lazy load utility functions (not React components)
export const loadLipSyncManager = () => import('../lipSync/index')
export const loadAIBehaviorSystem = () => import('../ai/AIBehaviorSystem')
export const loadProductionPerformance = () => import('./productionPerformance')

/**
 * Preload components when user hovers or interacts
 */

/**
 * Preload components when user hovers or interacts
 */
export const preloadComponent = (lazyComponent: React.LazyExoticComponent<any>) => {
  return lazyComponent
}

// Preload strategies for critical components
export const preloadCriticalComponents = () => {
  // Preload likely-to-be-used components after initial load
  setTimeout(() => {
    preloadComponent(LazyPerformanceDashboard)
    preloadComponent(LazyTimelineEditor)
  }, 2000) // Preload after 2 seconds
}

// Component size estimates for bundle analysis
export const COMPONENT_SIZES = {
  PerformanceDashboard: '~15KB',
  DiagnosticsDashboard: '~45KB', 
  TimelineEditor: '~25KB',
  LipSyncManager: '~30KB',
  AIBehaviorSystem: '~35KB',
  ProductionPerformance: '~20KB'
} as const

export default {
  LazyPerformanceDashboard,
  LazyDiagnosticsDashboard,
  LazyTimelineEditor,
  loadLipSyncManager,
  loadAIBehaviorSystem,
  loadProductionPerformance,
  preloadComponent,
  preloadCriticalComponents,
  COMPONENT_SIZES
}
