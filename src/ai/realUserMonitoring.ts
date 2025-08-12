/**
 * 🚀 PHASE 3: Real User Monitoring Setup
 * Agent 1 - AI Behavior Team
 * 
 * This module provides comprehensive monitoring for AI systems in production
 * including performance tracking, error monitoring, and user behavior analytics.
 */

import { AIBehaviorSystem, ContextAnalyzer } from './index';
import { ContextType, Context } from './types';

// Real User Monitoring Configuration
interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number; // percentage of requests to monitor
  performanceThresholds: {
    maxResponseTime: number; // ms
    maxMemoryUsage: number; // MB
    minAccuracy: number; // percentage
  };
  alerting: {
    enabled: boolean;
    errorThreshold: number; // percentage
    performanceThreshold: number; // ms
  };
}

// User Session Data
interface UserSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  interactions: UserInteraction[];
  aiDecisions: AIDecision[];
  performance: PerformanceMetrics;
  errors: ErrorEvent[];
}

// User Interaction Tracking
interface UserInteraction {
  timestamp: number;
  type: string;
  data: any;
  responseTime: number;
  success: boolean;
}

// AI Decision Tracking
interface AIDecision {
  timestamp: number;
  context: ContextType;
  decision: any;
  responseTime: number;
  accuracy: number;
  confidence: number;
}

// Performance Metrics
interface PerformanceMetrics {
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  totalRequests: number;
  successRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

// Error Event
interface ErrorEvent {
  timestamp: number;
  type: string;
  message: string;
  stack?: string;
  context?: any;
}

// Monitoring Analytics
interface MonitoringAnalytics {
  totalSessions: number;
  activeSessions: number;
  avgSessionDuration: number;
  totalInteractions: number;
  avgResponseTime: number;
  errorRate: number;
  userSatisfaction: number;
  aiAccuracy: number;
}

/**
 * Real User Monitoring System
 * Tracks and analyzes AI system performance in production
 */
export class RealUserMonitoring {
  private aiSystem: AIBehaviorSystem;
  private contextAnalyzer: ContextAnalyzer;
  private config: MonitoringConfig;
  private sessions: Map<string, UserSession> = new Map();
  private analytics: MonitoringAnalytics;
  private isActive: boolean = false;
  private performanceObserver?: PerformanceObserver;
  private errorObserver?: PerformanceObserver;

  constructor(config: MonitoringConfig) {
    this.aiSystem = new AIBehaviorSystem();
    this.contextAnalyzer = new ContextAnalyzer({
      enableEnvironmentalAwareness: true,
      enableUserInteractionTracking: true,
      enableAudioAnalysis: true
    });
    this.config = config;
    this.analytics = this.initializeAnalytics();
  }

  /**
   * Initialize monitoring system
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Real User Monitoring...');
    
    try {
      // Start AI system
      await this.aiSystem.start();
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      // Set up error monitoring
      this.setupErrorMonitoring();
      
      // Set up session tracking
      this.setupSessionTracking();
      
      this.isActive = true;
      console.log('✅ Real User Monitoring initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize monitoring:', error);
      throw error;
    }
  }

  /**
   * Start monitoring a user session
   */
  startSession(sessionId: string): void {
    if (!this.isActive) {
      console.warn('⚠️ Monitoring not active, cannot start session');
      return;
    }

    const session: UserSession = {
      sessionId,
      startTime: Date.now(),
      interactions: [],
      aiDecisions: [],
      performance: this.initializePerformanceMetrics(),
      errors: []
    };

    this.sessions.set(sessionId, session);
    console.log(`📊 Started monitoring session: ${sessionId}`);
  }

  /**
   * End a user session
   */
  endSession(sessionId: string): UserSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ Session ${sessionId} not found`);
      return null;
    }

    session.endTime = Date.now();
    this.updateAnalytics(session);
    this.sessions.delete(sessionId);
    
    console.log(`📊 Ended monitoring session: ${sessionId}`);
    return session;
  }

  /**
   * Track user interaction
   */
  trackInteraction(sessionId: string, type: string, data: any): void {
    if (!this.isActive || !this.config.enabled) return;

    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ Session ${sessionId} not found for interaction tracking`);
      return;
    }

    const startTime = performance.now();
    
    try {
      // Process interaction
      const context: Context = {
        type: ContextType.INTERACTION,
        intensity: 0.5,
        timestamp: Date.now(),
        metadata: data
      };

      this.contextAnalyzer.addContext(context);
      const decision = this.aiSystem.getCurrentAnimationDecision(['idle', 'wave', 'dance']);
      
      const responseTime = performance.now() - startTime;
      
      // Record interaction
      const interaction: UserInteraction = {
        timestamp: Date.now(),
        type,
        data,
        responseTime,
        success: true
      };

      session.interactions.push(interaction);

      // Record AI decision
      const aiDecision: AIDecision = {
        timestamp: Date.now(),
        context: context as any,
        decision,
        responseTime,
        accuracy: this.calculateAccuracy(decision, data),
        confidence: this.calculateConfidence(decision)
      };

      session.aiDecisions.push(aiDecision);

      // Update performance metrics
      this.updateSessionPerformance(session, responseTime, true);

      // Check for alerts
      this.checkAlerts(sessionId, responseTime, true);

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      const interaction: UserInteraction = {
        timestamp: Date.now(),
        type,
        data,
        responseTime,
        success: false
      };

      session.interactions.push(interaction);
      this.updateSessionPerformance(session, responseTime, false);
      
      // Record error
      const errorEvent: ErrorEvent = {
        timestamp: Date.now(),
        type: 'interaction_error',
        message: error instanceof Error ? error.message : String(error),
        context: { type, data }
      };

      session.errors.push(errorEvent);
      this.checkAlerts(sessionId, responseTime, false);
    }
  }

  /**
   * Track AI system performance
   */
  trackAIPerformance(sessionId: string, operation: string, startTime: number): void {
    if (!this.isActive || !this.config.enabled) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const responseTime = performance.now() - startTime;
    
    // Update performance metrics
    this.updateSessionPerformance(session, responseTime, true);
    
    // Check performance thresholds
    if (responseTime > this.config.performanceThresholds.maxResponseTime) {
      console.warn(`⚠️ AI performance threshold exceeded: ${responseTime.toFixed(2)}ms for ${operation}`);
    }
  }

  /**
   * Get real-time analytics
   */
  getAnalytics(): MonitoringAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get session data
   */
  getSession(sessionId: string): UserSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Generate monitoring report
   */
  generateMonitoringReport(): string {
    const report = `
# 📊 Real User Monitoring Report
**Generated**: ${new Date().toISOString()}
**Agent**: Agent 1 - AI Behavior Team
**Monitoring Status**: ${this.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}

## 📈 Analytics Summary

- **Total Sessions**: ${this.analytics.totalSessions}
- **Active Sessions**: ${this.analytics.activeSessions}
- **Average Session Duration**: ${this.analytics.avgSessionDuration.toFixed(2)} minutes
- **Total Interactions**: ${this.analytics.totalInteractions}
- **Average Response Time**: ${this.analytics.avgResponseTime.toFixed(2)}ms
- **Error Rate**: ${this.analytics.errorRate.toFixed(2)}%
- **User Satisfaction**: ${this.analytics.userSatisfaction.toFixed(1)}%
- **AI Accuracy**: ${this.analytics.aiAccuracy.toFixed(1)}%

## 🎯 Performance Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Response Time | ${this.analytics.avgResponseTime.toFixed(2)}ms | <${this.config.performanceThresholds.maxResponseTime}ms | ${this.analytics.avgResponseTime <= this.config.performanceThresholds.maxResponseTime ? '✅' : '❌'} |
| Error Rate | ${this.analytics.errorRate.toFixed(2)}% | <5% | ${this.analytics.errorRate <= 5 ? '✅' : '❌'} |
| AI Accuracy | ${this.analytics.aiAccuracy.toFixed(1)}% | >${this.config.performanceThresholds.minAccuracy}% | ${this.analytics.aiAccuracy >= this.config.performanceThresholds.minAccuracy ? '✅' : '❌'} |

## 🔍 Active Sessions

${this.getActiveSessions().map(session => `
### Session: ${session.sessionId}
- **Duration**: ${((Date.now() - session.startTime) / 1000 / 60).toFixed(2)} minutes
- **Interactions**: ${session.interactions.length}
- **AI Decisions**: ${session.aiDecisions.length}
- **Errors**: ${session.errors.length}
- **Avg Response Time**: ${session.performance.avgResponseTime.toFixed(2)}ms
`).join('')}

## 🚨 Alerts & Issues

${this.getActiveSessions().flatMap(session => 
  session.errors.map(error => 
    `- **${error.type}**: ${error.message} (${new Date(error.timestamp).toLocaleTimeString()})`
  )
).join('\n')}

## 💡 Recommendations

${this.generateRecommendations()}

---

*Report generated by Agent 1 - AI Behavior Team*
`;

    return report;
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isActive = false;
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.errorObserver) {
      this.errorObserver.disconnect();
    }
    
    console.log('🛑 Real User Monitoring stopped');
  }

  // Private helper methods

  private initializeAnalytics(): MonitoringAnalytics {
    return {
      totalSessions: 0,
      activeSessions: 0,
      avgSessionDuration: 0,
      totalInteractions: 0,
      avgResponseTime: 0,
      errorRate: 0,
      userSatisfaction: 0,
      aiAccuracy: 0
    };
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      totalRequests: 0,
      successRate: 100,
      memoryUsage: 0,
      cpuUsage: 0
    };
  }

  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.trackPerformanceMeasure(entry as PerformanceMeasure);
          }
        }
      });
      
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  private setupErrorMonitoring(): void {
    // Monitor global errors
    window.addEventListener('error', (event) => {
      this.trackGlobalError(event);
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackGlobalError(event as any);
    });
  }

  private setupSessionTracking(): void {
    // Auto-start session for new page loads
    const sessionId = this.generateSessionId();
    this.startSession(sessionId);
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page hidden - could end session or pause monitoring
        console.log('📊 Page hidden - pausing monitoring');
      } else {
        // Page visible - resume monitoring
        console.log('📊 Page visible - resuming monitoring');
      }
    });
  }

  private trackPerformanceMeasure(entry: PerformanceMeasure): void {
    // Track AI-related performance measures
    if (entry.name.includes('ai_') || entry.name.includes('animation_')) {
      const sessionId = this.getCurrentSessionId();
      if (sessionId) {
        this.trackAIPerformance(sessionId, entry.name, entry.startTime);
      }
    }
  }

  private trackGlobalError(event: ErrorEvent | any): void {
    const sessionId = this.getCurrentSessionId();
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const errorEvent: ErrorEvent = {
      timestamp: Date.now(),
      type: 'global_error',
      message: event instanceof ErrorEvent ? event.message : (event as any).reason,
      stack: event instanceof ErrorEvent ? event.error?.stack : undefined
    };

    session.errors.push(errorEvent);
    this.updateAnalytics(session);
  }

  private updateSessionPerformance(session: UserSession, responseTime: number, success: boolean): void {
    const perf = session.performance;
    
    perf.totalRequests++;
    perf.avgResponseTime = (perf.avgResponseTime * (perf.totalRequests - 1) + responseTime) / perf.totalRequests;
    perf.maxResponseTime = Math.max(perf.maxResponseTime, responseTime);
    perf.minResponseTime = Math.min(perf.minResponseTime, responseTime);
    
    if (!success) {
      perf.successRate = ((perf.totalRequests - 1) * perf.successRate) / perf.totalRequests;
    }
    
    // Update memory usage if available
    if ((performance as any).memory) {
      perf.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
  }

  private updateAnalytics(session: UserSession): void {
    this.analytics.totalSessions++;
    this.analytics.activeSessions = this.sessions.size;
    
    if (session.endTime) {
      const duration = (session.endTime - session.startTime) / 1000 / 60; // minutes
      this.analytics.avgSessionDuration = 
        (this.analytics.avgSessionDuration * (this.analytics.totalSessions - 1) + duration) / this.analytics.totalSessions;
    }
    
    this.analytics.totalInteractions += session.interactions.length;
    
    // Calculate overall metrics
    const allSessions = Array.from(this.sessions.values());
    if (allSessions.length > 0) {
      const totalResponseTime = allSessions.reduce((sum, s) => sum + s.performance.avgResponseTime, 0);
      this.analytics.avgResponseTime = totalResponseTime / allSessions.length;
      
      const totalErrors = allSessions.reduce((sum, s) => sum + s.errors.length, 0);
      const totalInteractions = allSessions.reduce((sum, s) => sum + s.interactions.length, 0);
      this.analytics.errorRate = totalInteractions > 0 ? (totalErrors / totalInteractions) * 100 : 0;
      
      const totalAccuracy = allSessions.reduce((sum, s) => sum + s.aiDecisions.reduce((acc, d) => acc + d.accuracy, 0), 0);
      const totalDecisions = allSessions.reduce((sum, s) => sum + s.aiDecisions.length, 0);
      this.analytics.aiAccuracy = totalDecisions > 0 ? totalAccuracy / totalDecisions : 0;
      
      // Calculate user satisfaction based on success rate and response time
      const avgSuccessRate = allSessions.reduce((sum, s) => sum + s.performance.successRate, 0) / allSessions.length;
      const responseTimeScore = Math.max(0, 100 - (this.analytics.avgResponseTime / 10));
      this.analytics.userSatisfaction = (avgSuccessRate * 60) + (responseTimeScore * 40);
    }
  }

  private checkAlerts(sessionId: string, responseTime: number, success: boolean): void {
    if (!this.config.alerting.enabled) return;

    if (responseTime > this.config.alerting.performanceThreshold) {
      console.warn(`🚨 Performance Alert: Response time ${responseTime.toFixed(2)}ms exceeds threshold for session ${sessionId}`);
    }

    if (!success) {
      const session = this.sessions.get(sessionId);
      if (session && session.errors.length > 0) {
        const errorRate = (session.errors.length / session.interactions.length) * 100;
        if (errorRate > this.config.alerting.errorThreshold) {
          console.warn(`🚨 Error Alert: Error rate ${errorRate.toFixed(2)}% exceeds threshold for session ${sessionId}`);
        }
      }
    }
  }

  private calculateAccuracy(decision: any, data: any): number {
    // Simple accuracy calculation - in production this would be more sophisticated
    if (!decision || !data) return 0;
    
    // Check if decision matches expected behavior based on data
    const expectedBehavior = this.getExpectedBehavior(data);
    const actualBehavior = decision.animation || decision.behavior || '';
    
    return expectedBehavior && actualBehavior.includes(expectedBehavior.toLowerCase()) ? 100 : 50;
  }

  private calculateConfidence(decision: any): number {
    // Simple confidence calculation
    if (!decision) return 0;
    
    // Base confidence on decision complexity and context
    let confidence = 50;
    
    if (decision.confidence) {
      confidence = decision.confidence;
    } else if (decision.animation) {
      confidence = 75; // Animation decisions are generally confident
    } else if (decision.behavior) {
      confidence = 60; // Behavior decisions are moderately confident
    }
    
    return Math.min(100, Math.max(0, confidence));
  }

  private getExpectedBehavior(data: any): string {
    // Determine expected behavior based on interaction data
    if (data.action === 'chat_message') return 'friendly_response';
    if (data.action === 'model_rotation') return 'smooth_animation';
    if (data.action === 'audio_input') return 'audio_response';
    return 'neutral';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentSessionId(): string | null {
    // Get the most recent session ID
    const sessionIds = Array.from(this.sessions.keys());
    return sessionIds[sessionIds.length - 1] || null;
  }

  private generateRecommendations(): string {
    const recommendations: string[] = [];
    
    if (this.analytics.avgResponseTime > 50) {
      recommendations.push('Optimize AI decision algorithms for faster response times');
    }
    
    if (this.analytics.errorRate > 2) {
      recommendations.push('Implement additional error handling and retry mechanisms');
    }
    
    if (this.analytics.aiAccuracy < 90) {
      recommendations.push('Improve AI behavior matching algorithms for better accuracy');
    }
    
    if (this.analytics.userSatisfaction < 80) {
      recommendations.push('Focus on improving user experience and interaction quality');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('AI system performing well - continue monitoring for optimization opportunities');
    }
    
    return recommendations.map(rec => `- ${rec}`).join('\n');
  }
}

// Export for use in production monitoring
export default RealUserMonitoring;
