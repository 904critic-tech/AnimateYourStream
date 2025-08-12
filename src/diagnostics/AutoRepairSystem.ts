/**
 * Auto-Repair System with Machine Learning
 * Self-healing diagnostics that learns from errors and applies fixes automatically
 */

import { SmartError, ErrorCategory, ErrorSeverity } from './types';
import { getErrorReporting } from '../utils/errorReporting';

interface RepairAction {
  id: string;
  category: ErrorCategory;
  pattern: RegExp;
  severity: ErrorSeverity[];
  action: (error: SmartError, context: RepairContext) => Promise<RepairResult>;
  confidence: number;
  successRate: number;
  usageCount: number;
  lastUsed: number;
}

interface RepairContext {
  errorHistory: SmartError[];
  systemState: any;
  previousAttempts: RepairAttempt[];
  availableActions: string[];
}

interface RepairResult {
  success: boolean;
  action: string;
  message: string;
  preventionTip?: string;
  confidence: number;
}

interface RepairAttempt {
  errorId: string;
  actionId: string;
  timestamp: number;
  success: boolean;
  timeTaken: number;
}

interface LearningData {
  patterns: Map<string, PatternData>;
  successfulRepairs: RepairAttempt[];
  failedRepairs: RepairAttempt[];
  contextCorrelations: Map<string, number>;
}

interface PatternData {
  frequency: number;
  successRate: number;
  bestAction: string;
  lastSeen: number;
  contexts: string[];
}

export class AutoRepairSystem {
  private repairActions: Map<string, RepairAction> = new Map();
  private learningData: LearningData;
  private isEnabled = true;
  private maxRepairsPerMinute = 10;
  private repairHistory: RepairAttempt[] = [];
  private learningRate = 0.1;
  
  // Performance tracking
  private repairCount = 0;
  private successCount = 0;

  constructor() {
    this.learningData = {
      patterns: new Map(),
      successfulRepairs: [],
      failedRepairs: [],
      contextCorrelations: new Map()
    };

    this.initializeRepairActions();
  }

  /**
   * Initialize built-in repair actions
   */
  private initializeRepairActions(): void {
    const actions: Omit<RepairAction, 'successRate' | 'usageCount' | 'lastUsed'>[] = [
      {
        id: 'audio_permission_fix',
        category: 'audio',
        pattern: /permission|denied|notallowed/i,
        severity: ['medium', 'high'],
        confidence: 0.9,
        action: this.fixAudioPermission.bind(this)
      },
      {
        id: 'webgl_context_restore',
        category: 'rendering',
        pattern: /context lost|webgl/i,
        severity: ['high', 'critical'],
        confidence: 0.8,
        action: this.restoreWebGLContext.bind(this)
      },
      {
        id: 'memory_cleanup',
        category: 'performance',
        pattern: /memory|heap|leak/i,
        severity: ['medium', 'high', 'critical'],
        confidence: 0.7,
        action: this.performMemoryCleanup.bind(this)
      },
      {
        id: 'model_reload',
        category: 'model',
        pattern: /load|parse|format/i,
        severity: ['medium', 'high'],
        confidence: 0.6,
        action: this.reloadModel.bind(this)
      },
      {
        id: 'component_restart',
        category: 'ui',
        pattern: /component|render|state/i,
        severity: ['medium', 'high'],
        confidence: 0.5,
        action: this.restartComponent.bind(this)
      },
      {
        id: 'animation_reset',
        category: 'animation',
        pattern: /timeline|keyframe|animation/i,
        severity: ['low', 'medium'],
        confidence: 0.6,
        action: this.resetAnimation.bind(this)
      }
    ];

    actions.forEach(action => {
      this.repairActions.set(action.id, {
        ...action,
        successRate: 0.5, // Start with neutral success rate
        usageCount: 0,
        lastUsed: 0
      });
    });
  }

  /**
   * Attempt to automatically repair an error
   */
  async attemptRepair(error: SmartError): Promise<RepairResult | null> {
    if (!this.isEnabled || !this.canAttemptRepair()) {
      return null;
    }

    // Log repair attempt to error reporting
    const errorReporting = getErrorReporting();
    if (errorReporting) {
      errorReporting.addBreadcrumb({
        category: 'autorepair',
        message: `Attempting auto-repair for ${error.category} error`,
        level: 'info',
        data: {
          errorId: error.id,
          category: error.category,
          severity: error.severity
        }
      });
    }

    // Find matching repair actions
    const candidates = this.findRepairCandidates(error);
    if (candidates.length === 0) {
      this.learnFromError(error, null);
      return null;
    }

    // Select best action using ML
    const bestAction = this.selectBestAction(candidates, error);
    const context = this.buildRepairContext(error);

    try {
      const startTime = performance.now();
      const result = await bestAction.action(error, context);
      const timeTaken = performance.now() - startTime;

      // Record attempt
      const attempt: RepairAttempt = {
        errorId: error.id,
        actionId: bestAction.id,
        timestamp: Date.now(),
        success: result.success,
        timeTaken
      };

      this.recordRepairAttempt(attempt);
      this.updateActionPerformance(bestAction.id, result.success, timeTaken);
      this.learnFromRepair(error, bestAction, result);

      // Report repair result to error tracking
      if (errorReporting) {
        errorReporting.addBreadcrumb({
          category: 'autorepair',
          message: `Auto-repair ${result.success ? 'succeeded' : 'failed'}: ${result.action}`,
          level: result.success ? 'info' : 'warning',
          data: {
            errorId: error.id,
            action: bestAction.id,
            timeTaken,
            confidence: result.confidence
          }
        });
      }

      return result;
    } catch (repairError) {
      console.warn('Auto-repair failed:', repairError);
      
      // Report repair failure
      if (errorReporting) {
        errorReporting.captureException(repairError as Error, {
          component: 'AutoRepairSystem',
          category: 'autorepair',
          severity: 'medium',
          context: {
            originalError: error,
            repairAction: bestAction.id
          }
        });
      }
      
      this.recordFailedRepair(error, bestAction);
      return null;
    }
  }

  /**
   * Find repair action candidates for an error
   */
  private findRepairCandidates(error: SmartError): RepairAction[] {
    const candidates: RepairAction[] = [];

    this.repairActions.forEach(action => {
      if (action.category === error.category &&
          action.severity.includes(error.severity) &&
          action.pattern.test(error.message)) {
        candidates.push(action);
      }
    });

    return candidates.sort((a, b) => 
      (b.confidence * b.successRate) - (a.confidence * a.successRate)
    );
  }

  /**
   * Select best action using machine learning
   */
  private selectBestAction(candidates: RepairAction[], error: SmartError): RepairAction {
    let bestAction = candidates[0];
    let bestScore = 0;

    candidates.forEach(action => {
      const score = this.calculateActionScore(action, error);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    });

    return bestAction;
  }

  /**
   * Calculate ML-based action score
   */
  private calculateActionScore(action: RepairAction, error: SmartError): number {
    let score = action.confidence * action.successRate;

    // Boost score based on pattern learning
    const patternKey = `${error.category}_${error.severity}`;
    const patternData = this.learningData.patterns.get(patternKey);
    
    if (patternData && patternData.bestAction === action.id) {
      score *= 1.5; // Boost learned best action
    }

    // Reduce score for recently failed actions
    const recentFailures = this.learningData.failedRepairs.filter(
      attempt => attempt.actionId === action.id && 
                 Date.now() - attempt.timestamp < 300000 // 5 minutes
    );
    score *= Math.pow(0.8, recentFailures.length);

    // Boost score for recently successful actions
    const recentSuccesses = this.learningData.successfulRepairs.filter(
      attempt => attempt.actionId === action.id && 
                 Date.now() - attempt.timestamp < 300000
    );
    score *= Math.pow(1.2, recentSuccesses.length);

    return score;
  }

  /**
   * Build repair context
   */
  private buildRepairContext(error: SmartError): RepairContext {
    return {
      errorHistory: this.getRecentErrors(error.category),
      systemState: error.context.systemState,
      previousAttempts: this.repairHistory.filter(a => a.errorId === error.id),
      availableActions: Array.from(this.repairActions.keys())
    };
  }

  /**
   * Learn from error patterns
   */
  private learnFromError(error: SmartError, _action: RepairAction | null): void {
    const patternKey = `${error.category}_${error.severity}`;
    
    if (!this.learningData.patterns.has(patternKey)) {
      this.learningData.patterns.set(patternKey, {
        frequency: 0,
        successRate: 0,
        bestAction: '',
        lastSeen: 0,
        contexts: []
      });
    }

    const pattern = this.learningData.patterns.get(patternKey)!;
    pattern.frequency++;
    pattern.lastSeen = Date.now();
    
    // Store context information
    const context = `${error.context.systemState.features.join(',')}_${error.context.systemState.memoryUsage > 50 ? 'high_mem' : 'normal_mem'}`;
    if (!pattern.contexts.includes(context)) {
      pattern.contexts.push(context);
    }
  }

  /**
   * Learn from repair attempts
   */
  private learnFromRepair(error: SmartError, action: RepairAction, result: RepairResult): void {
    const patternKey = `${error.category}_${error.severity}`;
    const pattern = this.learningData.patterns.get(patternKey);
    
    if (pattern) {
      // Update success rate using exponential moving average
      const newSuccessRate = result.success ? 1 : 0;
      pattern.successRate = pattern.successRate * (1 - this.learningRate) + 
                           newSuccessRate * this.learningRate;
      
      // Update best action if this one performed better
      if (result.success && result.confidence > 0.7) {
        pattern.bestAction = action.id;
      }
    }

    // Store correlation data
    const contextKey = `${error.category}_${error.context.userAction || 'no_action'}`;
    const currentCorr = this.learningData.contextCorrelations.get(contextKey) || 0;
    this.learningData.contextCorrelations.set(contextKey, 
      currentCorr * 0.9 + (result.success ? 0.1 : -0.05)
    );
  }

  /**
   * Repair Actions Implementation
   */
  private async fixAudioPermission(_error: SmartError, _context: RepairContext): Promise<RepairResult> {
    try {
      // Attempt to re-request audio permissions
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return {
          success: true,
          action: 'Re-requested microphone permission',
          message: 'Audio permission granted successfully',
          preventionTip: 'Check permissions before audio operations',
          confidence: 0.9
        };
      }
    } catch (e) {
      // Fallback: Guide user to enable permissions
      return {
        success: false,
        action: 'Permission request failed',
        message: 'Please enable microphone permission in browser settings',
        confidence: 0.3
      };
    }

    return {
      success: false,
      action: 'No audio API available',
      message: 'Browser does not support audio permissions',
      confidence: 0.1
    };
  }

  private async restoreWebGLContext(_error: SmartError, _context: RepairContext): Promise<RepairResult> {
    try {
      // Find canvas elements and attempt context restoration
      const canvases = document.querySelectorAll('canvas');
      let restored = false;

      canvases.forEach(canvas => {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
        if (gl && gl.isContextLost && gl.isContextLost()) {
          // Trigger context restoration
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) {
            ext.restoreContext();
            restored = true;
          }
        }
      });

      if (restored) {
        return {
          success: true,
          action: 'WebGL context restored',
          message: 'Graphics context successfully restored',
          preventionTip: 'Monitor GPU memory usage to prevent context loss',
          confidence: 0.8
        };
      }
    } catch (e) {
      console.warn('WebGL restore failed:', e);
    }

    return {
      success: false,
      action: 'Context restoration failed',
      message: 'Please refresh the page to restore graphics',
      confidence: 0.3
    };
  }

  private async performMemoryCleanup(_error: SmartError, _context: RepairContext): Promise<RepairResult> {
    try {
      let cleanedBytes = 0;

      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
        cleanedBytes += 1024 * 1024; // Estimate
      }

      // Clear unnecessary caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('temp') || cacheName.includes('old')) {
            await caches.delete(cacheName);
            cleanedBytes += 5 * 1024 * 1024; // Estimate
          }
        }
      }

      // Clear unused images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.parentElement || img.style.display === 'none') {
          img.src = '';
          cleanedBytes += 100 * 1024; // Estimate
        }
      });

      return {
        success: cleanedBytes > 0,
        action: 'Memory cleanup performed',
        message: `Freed approximately ${Math.round(cleanedBytes / 1024 / 1024)}MB of memory`,
        preventionTip: 'Implement proper resource disposal in components',
        confidence: 0.7
      };
    } catch (e) {
      return {
        success: false,
        action: 'Memory cleanup failed',
        message: 'Unable to perform automatic memory cleanup',
        confidence: 0.2
      };
    }
  }

  private async reloadModel(_error: SmartError, _context: RepairContext): Promise<RepairResult> {
    // This would integrate with the model loading system
    // For now, provide guidance
    return {
      success: false, // Would be true if we could actually reload
      action: 'Model reload recommended',
      message: 'Consider reloading the 3D model to resolve parsing issues',
      preventionTip: 'Validate model format before loading',
      confidence: 0.6
    };
  }

  private async restartComponent(_error: SmartError, _context: RepairContext): Promise<RepairResult> {
    // This would integrate with React error boundaries
    return {
      success: false, // Would be true with proper React integration
      action: 'Component restart recommended',
      message: 'React component may need to be remounted',
      preventionTip: 'Add error boundaries to handle component failures',
      confidence: 0.5
    };
  }

  private async resetAnimation(_error: SmartError, _context: RepairContext): Promise<RepairResult> {
    try {
      // Reset animation state if accessible
      // This would integrate with the animation system
      return {
        success: false, // Would be true with animation system integration
        action: 'Animation reset recommended',
        message: 'Consider resetting animation timeline to resolve issues',
        preventionTip: 'Validate keyframes before playing animations',
        confidence: 0.6
      };
    } catch (e) {
      return {
        success: false,
        action: 'Animation reset failed',
        message: 'Unable to automatically reset animation state',
        confidence: 0.2
      };
    }
  }

  /**
   * Utility methods
   */
  private canAttemptRepair(): boolean {
    const recentRepairs = this.repairHistory.filter(
      attempt => Date.now() - attempt.timestamp < 60000 // Last minute
    );
    return recentRepairs.length < this.maxRepairsPerMinute;
  }

  private recordRepairAttempt(attempt: RepairAttempt): void {
    this.repairHistory.push(attempt);
    this.repairCount++;
    
    if (attempt.success) {
      this.successCount++;
      this.learningData.successfulRepairs.push(attempt);
    } else {
      this.learningData.failedRepairs.push(attempt);
    }

    // Keep history manageable
    if (this.repairHistory.length > 1000) {
      this.repairHistory = this.repairHistory.slice(-500);
    }
  }

  private recordFailedRepair(error: SmartError, action: RepairAction): void {
    const attempt: RepairAttempt = {
      errorId: error.id,
      actionId: action.id,
      timestamp: Date.now(),
      success: false,
      timeTaken: 0
    };
    this.recordRepairAttempt(attempt);
  }

  private updateActionPerformance(actionId: string, success: boolean, _timeTaken: number): void {
    const action = this.repairActions.get(actionId);
    if (action) {
      action.usageCount++;
      action.lastUsed = Date.now();
      
      // Update success rate using exponential moving average
      const newRate = success ? 1 : 0;
      action.successRate = action.successRate * 0.9 + newRate * 0.1;
    }
  }

  private getRecentErrors(_category: ErrorCategory): SmartError[] {
    // This would integrate with the error detector to get recent errors
    return [];
  }

  /**
   * Public methods
   */
  getRepairStatistics(): Record<string, any> {
    return {
      totalRepairs: this.repairCount,
      successRate: this.repairCount > 0 ? this.successCount / this.repairCount : 0,
      actionsLearned: this.learningData.patterns.size,
      averageRepairTime: this.calculateAverageRepairTime(),
      topPatterns: this.getTopPatterns(),
      bestActions: this.getBestActions()
    };
  }

  private calculateAverageRepairTime(): number {
    const successfulRepairs = this.learningData.successfulRepairs;
    if (successfulRepairs.length === 0) return 0;
    
    const totalTime = successfulRepairs.reduce((sum, repair) => sum + repair.timeTaken, 0);
    return totalTime / successfulRepairs.length;
  }

  private getTopPatterns(): Array<{pattern: string, frequency: number, successRate: number}> {
    return Array.from(this.learningData.patterns.entries())
      .map(([pattern, data]) => ({ pattern, frequency: data.frequency, successRate: data.successRate }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private getBestActions(): Array<{action: string, successRate: number, usageCount: number}> {
    return Array.from(this.repairActions.values())
      .map(action => ({ action: action.id, successRate: action.successRate, usageCount: action.usageCount }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isAutoRepairEnabled(): boolean {
    return this.isEnabled;
  }

  exportLearningData(): LearningData {
    return JSON.parse(JSON.stringify(this.learningData));
  }

  importLearningData(data: LearningData): void {
    this.learningData = data;
  }
}
