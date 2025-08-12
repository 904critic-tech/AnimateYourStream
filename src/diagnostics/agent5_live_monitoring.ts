/**
 * Agent 5 - Live Error Monitoring System
 * Real-time monitoring of critical issues: upload system, character switching, and animations
 */

import { startAgent5ErrorAnalysis, getAgent5Analysis, getAgent5Summary } from './agent5_error_analysis';

interface CriticalIssue {
  id: string;
  type: 'upload_system' | 'character_switching' | 'animation_system';
  status: 'active' | 'resolved' | 'monitoring';
  errorCount: number;
  lastError: string;
  timestamp: number;
  assignedAgent: string;
  priority: 'critical' | 'high' | 'medium';
}

interface LiveMonitoringData {
  timestamp: number;
  criticalIssues: CriticalIssue[];
  totalErrors: number;
  healthScore: number;
  systemStatus: 'healthy' | 'degraded' | 'critical';
  recommendations: string[];
}

class Agent5LiveMonitor {
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private criticalIssues: Map<string, CriticalIssue> = new Map();
  private analysisStarted: boolean = false;

  constructor() {
    this.initializeCriticalIssues();
  }

  /**
   * Initialize critical issues tracking
   */
  private initializeCriticalIssues(): void {
    // Upload System Issues (Agent 1)
    this.criticalIssues.set('upload_system', {
      id: 'upload_system',
      type: 'upload_system',
      status: 'active',
      errorCount: 0,
      lastError: 'Failed to execute \'fetch\' on \'Window\': Illegal invocation',
      timestamp: Date.now(),
      assignedAgent: 'Agent 1',
      priority: 'critical'
    });

    // Character Switching Issues (Agent 2)
    this.criticalIssues.set('character_switching', {
      id: 'character_switching',
      type: 'character_switching',
      status: 'active',
      errorCount: 0,
      lastError: 'Character switching causes "Illegal Invocation" errors',
      timestamp: Date.now(),
      assignedAgent: 'Agent 2',
      priority: 'critical'
    });

    // Animation System Issues (Agent 3)
    this.criticalIssues.set('animation_system', {
      id: 'animation_system',
      type: 'animation_system',
      status: 'active',
      errorCount: 0,
      lastError: 'Default model loads but no animations work',
      timestamp: Date.now(),
      assignedAgent: 'Agent 3',
      priority: 'critical'
    });
  }

  /**
   * Start live monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('🔍 Agent 5: Live monitoring already active');
      return;
    }

    console.log('🚀 Agent 5: Starting live error monitoring...');
    this.isMonitoring = true;

    // Start error analysis if not already started
    if (!this.analysisStarted) {
      startAgent5ErrorAnalysis();
      this.analysisStarted = true;
    }

    // Start monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.updateMonitoring();
    }, 2000); // Update every 2 seconds

    console.log('✅ Agent 5: Live monitoring started successfully');
  }

  /**
   * Update monitoring data
   */
  private updateMonitoring(): void {
    try {
      const analysis = getAgent5Analysis();
      const summary = getAgent5Summary();

      // Update critical issues based on error analysis
      this.updateCriticalIssues(analysis);

      // Generate monitoring report
      const monitoringData = this.generateMonitoringData(summary);

      // Log current status
      this.logStatus(monitoringData);

    } catch (error) {
      console.error('❌ Agent 5: Monitoring update failed:', error);
    }
  }

  /**
   * Update critical issues based on error analysis
   */
  private updateCriticalIssues(analysis: any): void {
    const consoleErrors = analysis.consoleErrors || [];

    // Track upload system errors
    const uploadErrors = consoleErrors.filter((error: any) => 
      error.message.includes('fetch') || 
      error.message.includes('Illegal invocation') ||
      error.message.includes('upload')
    );

    const uploadIssue = this.criticalIssues.get('upload_system');
    if (uploadIssue) {
      uploadIssue.errorCount = uploadErrors.length;
      if (uploadErrors.length > 0) {
        uploadIssue.lastError = uploadErrors[uploadErrors.length - 1].message;
        uploadIssue.timestamp = Date.now();
      }
    }

    // Track character switching errors
    const switchingErrors = consoleErrors.filter((error: any) => 
      error.message.includes('character') || 
      error.message.includes('switch') ||
      error.message.includes('model')
    );

    const switchingIssue = this.criticalIssues.get('character_switching');
    if (switchingIssue) {
      switchingIssue.errorCount = switchingErrors.length;
      if (switchingErrors.length > 0) {
        switchingIssue.lastError = switchingErrors[switchingErrors.length - 1].message;
        switchingIssue.timestamp = Date.now();
      }
    }

    // Track animation system errors
    const animationErrors = consoleErrors.filter((error: any) => 
      error.message.includes('animation') || 
      error.message.includes('three.js') ||
      error.message.includes('WebGL') ||
      error.message.includes('render')
    );

    const animationIssue = this.criticalIssues.get('animation_system');
    if (animationIssue) {
      animationIssue.errorCount = animationErrors.length;
      if (animationErrors.length > 0) {
        animationIssue.lastError = animationErrors[animationErrors.length - 1].message;
        animationIssue.timestamp = Date.now();
      }
    }
  }

  /**
   * Generate monitoring data
   */
  private generateMonitoringData(summary: any): LiveMonitoringData {
    const criticalIssues = Array.from(this.criticalIssues.values());
    const totalErrors = summary.totalErrors || 0;
    const healthScore = summary.healthScore || 100;

    // Determine system status
    let systemStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (healthScore < 50) {
      systemStatus = 'critical';
    } else if (healthScore < 80) {
      systemStatus = 'degraded';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(criticalIssues, healthScore);

    return {
      timestamp: Date.now(),
      criticalIssues,
      totalErrors,
      healthScore,
      systemStatus,
      recommendations
    };
  }

  /**
   * Generate recommendations based on current issues
   */
  private generateRecommendations(criticalIssues: CriticalIssue[], healthScore: number): string[] {
    const recommendations: string[] = [];

    if (healthScore < 50) {
      recommendations.push('🚨 CRITICAL: System health is poor - immediate fixes required');
    }

    criticalIssues.forEach(issue => {
      if (issue.errorCount > 0) {
        recommendations.push(`🔧 ${issue.assignedAgent}: Fix ${issue.type} (${issue.errorCount} errors)`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ All systems appear to be functioning normally');
    }

    return recommendations;
  }

  /**
   * Log current status
   */
  private logStatus(monitoringData: LiveMonitoringData): void {
    const { criticalIssues, totalErrors, healthScore, systemStatus, recommendations } = monitoringData;

    console.log(`🔍 Agent 5 Live Monitor [${new Date().toLocaleTimeString()}]`);
    console.log(`📊 System Status: ${systemStatus.toUpperCase()} (Health: ${healthScore}%)`);
    console.log(`📈 Total Errors: ${totalErrors}`);

    criticalIssues.forEach(issue => {
      const status = issue.errorCount > 0 ? '🚨' : '✅';
      console.log(`${status} ${issue.assignedAgent}: ${issue.type} (${issue.errorCount} errors)`);
    });

    if (recommendations.length > 0) {
      console.log('💡 Recommendations:');
      recommendations.forEach(rec => console.log(`   ${rec}`));
    }

    console.log('---');
  }

  /**
   * Get current monitoring data
   */
  getMonitoringData(): LiveMonitoringData {
    const summary = getAgent5Summary();
    const criticalIssues = Array.from(this.criticalIssues.values());
    const totalErrors = summary.totalErrors || 0;
    const healthScore = summary.healthScore || 100;

    let systemStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (healthScore < 50) {
      systemStatus = 'critical';
    } else if (healthScore < 80) {
      systemStatus = 'degraded';
    }

    const recommendations = this.generateRecommendations(criticalIssues, healthScore);

    return {
      timestamp: Date.now(),
      criticalIssues,
      totalErrors,
      healthScore,
      systemStatus,
      recommendations
    };
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('🛑 Agent 5: Stopping live monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('✅ Agent 5: Live monitoring stopped');
  }

  /**
   * Mark issue as resolved
   */
  markIssueResolved(issueId: string): void {
    const issue = this.criticalIssues.get(issueId);
    if (issue) {
      issue.status = 'resolved';
      issue.errorCount = 0;
      issue.timestamp = Date.now();
      console.log(`✅ Agent 5: Marked ${issueId} as resolved`);
    }
  }

  /**
   * Get critical issues summary
   */
  getCriticalIssuesSummary(): CriticalIssue[] {
    return Array.from(this.criticalIssues.values());
  }
}

// Export singleton instance
export const agent5LiveMonitor = new Agent5LiveMonitor();

// Export convenience functions
export function startAgent5LiveMonitoring(): void {
  agent5LiveMonitor.startMonitoring();
}

export function stopAgent5LiveMonitoring(): void {
  agent5LiveMonitor.stopMonitoring();
}

export function getAgent5MonitoringData(): LiveMonitoringData {
  return agent5LiveMonitor.getMonitoringData();
}

export function markAgent5IssueResolved(issueId: string): void {
  agent5LiveMonitor.markIssueResolved(issueId);
}

// Auto-start monitoring when module is loaded
if (typeof window !== 'undefined') {
  setTimeout(() => {
    console.log('🔍 Agent 5: Auto-starting live monitoring...');
    startAgent5LiveMonitoring();
  }, 2000);
}
