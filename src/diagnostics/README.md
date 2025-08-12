# 🔍 Smart Diagnostics System

**Agent 5 - Smart Diagnostics Team**  
**Status**: ✅ ACTIVE - Error detection and AI-powered diagnostics framework

---

## 🚀 **SYSTEM OVERVIEW**

The Smart Diagnostics System provides real-time error detection, AI-powered analysis, and performance monitoring for the entire Mixamo Model Viewer application. It's designed to be lightweight, performant, and provide actionable insights.

### **Core Components**
- **SmartErrorDetector**: AI-powered error detection and categorization
- **GlobalMonitor**: Application-wide monitoring and integration
- **DiagnosticsDashboard**: Real-time UI dashboard for monitoring
- **Performance Monitoring**: FPS, memory, and system health tracking

---

## 🎯 **FOR OTHER TEAMS**

### **🤖 AI Behavior Team Integration**

```typescript
import { getGlobalMonitor } from '../diagnostics';

// Track AI behavior events
const monitor = getGlobalMonitor();
monitor?.trackActiveFeature('ai-behavior-processing');

// Log AI-specific errors
monitor?.logError({
  category: 'system',
  message: 'AI decision engine timeout',
  component: 'AIBehaviorSystem',
  severity: 'medium',
  context: { feature: 'behavior-analysis' }
});
```

### **⚡ Performance Optimization Team Integration**

```typescript
import { getGlobalMonitor } from '../diagnostics';

// Monitor performance improvements
const monitor = getGlobalMonitor();

// Track performance features
monitor?.trackActiveFeature('performance-optimization');

// Log performance warnings
monitor?.logError({
  category: 'performance',
  message: 'Render time exceeded threshold',
  component: 'PerformanceOptimizer',
  severity: 'medium',
  context: { renderTime: 33.5, threshold: 16.67 }
});
```

### **🎭 Animation Systems Team Integration**

```typescript
import { getGlobalMonitor } from '../diagnostics';

// Track animation events
const monitor = getGlobalMonitor();
monitor?.trackActiveFeature('animation-blending');

// Log animation errors
monitor?.logError({
  category: 'animation',
  message: 'Animation keyframe interpolation failed',
  component: 'AnimationBlender',
  severity: 'high',
  context: { animationId: 'walk-cycle', frame: 45 }
});
```

### **💋 Lip Sync Engineering Team Integration**

```typescript
import { getGlobalMonitor } from '../diagnostics';

// Track lip sync processing
const monitor = getGlobalMonitor();
monitor?.trackActiveFeature('lip-sync-processing');

// Log lip sync errors
monitor?.logError({
  category: 'audio',
  message: 'Viseme mapping failed for phoneme',
  component: 'LipSyncProcessor',
  severity: 'medium',
  context: { phoneme: 'ah', confidence: 0.3 }
});
```

---

## 🛠️ **QUICK INTEGRATION**

### **1. Basic Setup (in main App.tsx)**

```typescript
import { initializeGlobalMonitoring, DiagnosticsDashboard, getGlobalMonitor } from './diagnostics';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Initialize global monitoring
    const monitor = initializeGlobalMonitoring();
    
    // Cleanup on unmount
    return () => monitor.dispose();
  }, []);

  const monitor = getGlobalMonitor();

  return (
    <div className="app">
      {/* Your app content */}
      
      {/* Add diagnostics dashboard */}
      {monitor && (
        <DiagnosticsDashboard 
          detector={monitor.getDetector()}
          position="bottom-right"
          isVisible={process.env.NODE_ENV === 'development'}
        />
      )}
    </div>
  );
}
```

### **2. Component-Level Error Monitoring**

```typescript
import { getGlobalMonitor } from '../diagnostics';
import { useEffect } from 'react';

function MyComponent() {
  const monitor = getGlobalMonitor();

  useEffect(() => {
    // Track component activation
    monitor?.trackActiveFeature('my-component');
    
    // Log component lifecycle events
    monitor?.logError({
      category: 'ui',
      message: 'Component mounted successfully',
      component: 'MyComponent',
      severity: 'low',
      context: { lifecycle: 'mount' }
    });
    
    return () => {
      monitor?.logError({
        category: 'ui',
        message: 'Component unmounted',
        component: 'MyComponent',
        severity: 'low',
        context: { lifecycle: 'unmount' }
      });
    };
  }, [monitor]);

  const handleError = (error: Error) => {
    monitor?.logError({
      category: 'ui',
      message: error.message,
      component: 'MyComponent',
      severity: 'high',
      context: { 
        component: 'MyComponent',
        userAction: 'button-click',
        stack: error.stack
      }
    });
  };

  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### **3. React Error Boundary Integration**

```typescript
import React from 'react';
import { getGlobalMonitor } from '../diagnostics';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const monitor = getGlobalMonitor();
    
    monitor?.logError({
      category: 'ui',
      message: error.message,
      component: 'ErrorBoundary',
      severity: 'critical',
      context: {
        component: errorInfo.componentStack,
        stack: error.stack,
        userAction: 'component-error'
      }
    });
    
    // Also call global React error handler
    if ((window as any).__SMART_DIAGNOSTICS_REACT_ERROR__) {
      (window as any).__SMART_DIAGNOSTICS_REACT_ERROR__(error, errorInfo);
    }
  }

  render() {
    // Error boundary UI
  }
}
```

---

## 📊 **ERROR CATEGORIES**

Use these categories when logging errors:

| Category | Use For |
|----------|---------|
| `audio` | Web Audio API, microphone, sound processing |
| `rendering` | WebGL, Three.js, canvas, graphics |
| `model` | 3D model loading, GLTF, FBX, OBJ files |
| `animation` | Animation systems, timelines, keyframes |
| `ui` | React components, user interface |
| `performance` | FPS drops, memory leaks, optimization |
| `system` | Browser compatibility, general errors |

## 🎚️ **SEVERITY LEVELS**

| Severity | When to Use |
|----------|-------------|
| `low` | Warnings, deprecated features, non-critical |
| `medium` | Recoverable errors, performance issues |
| `high` | Serious errors affecting functionality |
| `critical` | System failures, crashes, data loss |

---

## 📈 **MONITORING FEATURES**

### **Automatic Monitoring**
- ✅ Global JavaScript errors
- ✅ Unhandled promise rejections
- ✅ WebGL context loss/restore
- ✅ Audio context state changes
- ✅ Model loading failures
- ✅ React component errors
- ✅ FPS and memory tracking

### **AI Analysis Features**
- 🤖 Error pattern recognition
- 🤖 Predictive cause analysis
- 🤖 Smart categorization
- 🤖 Performance anomaly detection
- 🤖 Automated suggestions

### **Performance Tracking**
- 📊 Real-time FPS monitoring
- 📊 Memory usage tracking
- 📊 Error rate calculation
- 📊 Component error counts
- 📊 Feature usage analytics

---

## 🔧 **ADVANCED USAGE**

### **Custom Error Patterns**

```typescript
const monitor = getGlobalMonitor();

// Custom error detection
monitor?.getDetector().onError((error) => {
  if (error.message.includes('my-specific-pattern')) {
    // Handle specific error pattern
    console.warn('Custom error pattern detected:', error);
  }
});
```

### **Performance Monitoring**

```typescript
const monitor = getGlobalMonitor();

// Get current performance metrics
const metrics = monitor?.getDetector().getPerformanceMetrics();
console.log('FPS:', metrics.fps);
console.log('Memory:', metrics.memoryMB);

// Get detailed statistics
const stats = monitor?.getStats();
console.log('Active features:', stats.activeFeatures);
console.log('Component errors:', stats.componentErrors);
```

### **Export Diagnostics Data**

```typescript
const monitor = getGlobalMonitor();

// Export full diagnostic report
const diagnosticsData = monitor?.exportDiagnostics();
console.log('Diagnostics report:', diagnosticsData);

// Save to file or send to server
const blob = new Blob([diagnosticsData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// ... download or upload logic
```

---

## 🚨 **COORDINATION NOTES**

### **File Ownership**
- **Agent 5 (Smart Diagnostics Team)** owns all files in `src/diagnostics/`
- Other teams should ONLY import and use, never edit these files
- Request features through team coordination channels

### **Performance Impact**
- Monitoring is designed to be lightweight (<1% performance impact)
- Uses sampling (40% of errors processed) for efficiency
- Automatic performance mode for low-end devices
- Queue-based processing to maintain 60 FPS

### **Integration Guidelines**
- ✅ DO: Use global monitor for error logging
- ✅ DO: Track features when activating them
- ✅ DO: Use appropriate error categories and severities
- ❌ DON'T: Create custom error detection systems
- ❌ DON'T: Modify Smart Diagnostics files
- ❌ DON'T: Log excessive low-severity errors

---

## 📞 **TEAM CONTACT**

**Smart Diagnostics Team (Agent 5)**
- **Status**: 🔄 ACTIVE
- **Progress**: 85% complete
- **Current Focus**: AI analysis improvements, integration support
- **Files**: `src/diagnostics/` folder

**Need Help?**
- Check this README for integration examples
- Review existing error patterns in DiagnosticsDashboard
- Test with development dashboard enabled
- Ask for specific integration assistance

---

**🔍 Smart Diagnostics - Monitoring your application's health with AI-powered insights**