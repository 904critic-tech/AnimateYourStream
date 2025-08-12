/**
 * Lightweight Diagnostics Dashboard
 * Performance-optimized React component for error monitoring
 */

import { useState, useMemo, useEffect } from 'react';
import { useSmartDiagnostics, useErrorMonitor } from './useSmartDiagnostics';
import { SmartError } from './types';
import { runAgent5ErrorAnalysis, getAgent5Status } from './agent5_test_runner';

interface DiagnosticsDashboardProps {
  compact?: boolean;
  showPerformance?: boolean;
  maxErrors?: number;
  className?: string;
}

export function DiagnosticsDashboard({ 
  compact = false, 
  showPerformance = true,
  maxErrors = 5,
  className = ''
}: DiagnosticsDashboardProps) {
  const {
    errors,
    errorCount,
    criticalCount,
    performance,
    summary,
    isActive,
    clearErrors
  } = useSmartDiagnostics({
    maxDisplayErrors: maxErrors,
    performanceMode: true
  });

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [agent5Status, setAgent5Status] = useState<any>(null);

  // Start Agent 5 error analysis on component mount
  useEffect(() => {
    const startAnalysis = async () => {
      try {
        await runAgent5ErrorAnalysis();
        console.log('✅ Agent 5: Error analysis integrated into dashboard');
      } catch (error) {
        console.error('❌ Agent 5: Failed to start analysis:', error);
      }
    };

    startAnalysis();

    // Update Agent 5 status periodically
    const statusInterval = setInterval(() => {
      const status = getAgent5Status();
      setAgent5Status(status);
    }, 2000);

    return () => clearInterval(statusInterval);
  }, []);

  // Memoized calculations for performance
  const stats = useMemo(() => ({
    errorRate: summary.byCategory ? Object.values(summary.byCategory).reduce((a, b) => (a as number) + (b as number), 0) : 0,
    mostCommonCategory: summary.byCategory ? 
      Object.entries(summary.byCategory).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] : 'none',
    healthScore: Math.max(0, 100 - (criticalCount * 20) - (errorCount * 2))
  }), [summary, criticalCount, errorCount]);

  if (compact && !isExpanded) {
    return (
      <div className={`diagnostics-compact ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="diagnostics-toggle"
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            background: criticalCount > 0 ? '#ef4444' : errorCount > 0 ? '#f59e0b' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔍 {errorCount} errors
        </button>
      </div>
    );
  }

  return (
    <div className={`diagnostics-dashboard ${className}`} style={{ 
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '300px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 50,
      maxHeight: '400px',
      overflow: 'auto',
      pointerEvents: 'auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '14px' }}>🔍 Smart Diagnostics</h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={clearErrors}
            style={{ background: '#374151', border: 'none', color: 'white', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer' }}
          >
            Clear
          </button>
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              style={{ background: '#374151', border: 'none', color: 'white', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer' }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Agent 5 Status */}
      {agent5Status && (
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid #3b82f6', 
          borderRadius: '4px', 
          padding: '6px', 
          marginBottom: '8px',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🎖️ Agent 5: {agent5Status.isRunning ? 'Analyzing' : 'Stopped'}</span>
            <span style={{ color: agent5Status.isRunning ? '#10b981' : '#6b7280' }}>
              {agent5Status.isRunning ? '●' : '○'}
            </span>
          </div>
          {agent5Status.currentSummary && (
            <div style={{ marginTop: '4px', fontSize: '10px', color: '#9ca3af' }}>
              Errors: {agent5Status.currentSummary.totalErrors} | 
              Critical: {agent5Status.currentSummary.criticalErrors} | 
              Health: {agent5Status.currentSummary.healthScore}%
            </div>
          )}
        </div>
      )}

      {/* Status Indicator */}
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isActive ? '#10b981' : '#ef4444'
        }} />
        <span>Status: {isActive ? 'Active' : 'Inactive'}</span>
        <span style={{ marginLeft: 'auto', color: getHealthColor(stats.healthScore) }}>
          Health: {stats.healthScore}%
        </span>
      </div>

      {/* Error Summary */}
      <div style={{ marginBottom: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <div style={{ color: '#9ca3af' }}>Total Errors</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{errorCount}</div>
        </div>
        <div>
          <div style={{ color: '#9ca3af' }}>Critical</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: criticalCount > 0 ? '#ef4444' : '#10b981' }}>
            {criticalCount}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {showPerformance && performance && (
        <div style={{ marginBottom: '8px', padding: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
          <div style={{ color: '#9ca3af', marginBottom: '4px' }}>Performance</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', fontSize: '11px' }}>
            <div>FPS: {performance.fps}</div>
            <div>RAM: {performance.memoryMB}MB</div>
            <div>Queue: {performance.queueSize || 0}</div>
          </div>
        </div>
      )}

      {/* Recent Errors */}
      {errors.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ color: '#9ca3af', marginBottom: '4px' }}>Recent Errors</div>
          <div style={{ maxHeight: '150px', overflow: 'auto' }}>
            {errors.slice(-5).map((error) => (
              <ErrorItem key={error.id} error={error} />
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {summary.byCategory && Object.keys(summary.byCategory).length > 0 && (
        <div style={{ fontSize: '11px' }}>
          <div style={{ color: '#9ca3af', marginBottom: '4px' }}>By Category</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
            {Object.entries(summary.byCategory).map(([category, count]) => (
              <div key={category} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{category}:</span>
                <span>{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual error item component
 */
function ErrorItem({ error }: { error: SmartError }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        marginBottom: '4px',
        padding: '4px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '3px',
        borderLeft: `3px solid ${getSeverityColor(error.severity)}`,
        cursor: 'pointer'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>
          {error.category} • {error.severity}
        </span>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>
          {new Date(error.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div style={{ fontSize: '11px', marginTop: '2px' }}>
        {error.message.length > 50 && !isExpanded 
          ? error.message.substring(0, 50) + '...'
          : error.message
        }
      </div>
      {isExpanded && error.aiAnalysis && (
        <div style={{ marginTop: '4px', fontSize: '10px', color: '#9ca3af' }}>
          <div>💡 {error.aiAnalysis.suggestion}</div>
          {error.aiAnalysis.confidence && (
            <div>Confidence: {Math.round(error.aiAnalysis.confidence * 100)}%</div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Minimal error monitor component for status bars
 */
export function ErrorStatusIndicator({ className = '' }: { className?: string }) {
  const { errorCount, criticalCount, hasErrors } = useErrorMonitor();

  if (!hasErrors) {
    return (
      <div className={`error-status-ok ${className}`} style={{ color: '#10b981' }}>
        ✓ No Errors
      </div>
    );
  }

  return (
    <div 
      className={`error-status-errors ${className}`} 
      style={{ 
        color: criticalCount > 0 ? '#ef4444' : '#f59e0b',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      ⚠️ {errorCount} errors
      {criticalCount > 0 && <span style={{ color: '#ef4444' }}>({criticalCount} critical)</span>}
    </div>
  );
}

// Utility functions
function getSeverityColor(severity: string): string {
  const colors = {
    low: '#10b981',
    medium: '#f59e0b', 
    high: '#ef4444',
    critical: '#dc2626'
  };
  return colors[severity as keyof typeof colors] || '#6b7280';
}

function getHealthColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#ef4444';
  return '#dc2626';
}