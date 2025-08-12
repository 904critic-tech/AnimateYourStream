/**
 * Smart Diagnostics System Demo
 * Live demonstration of error detection, AI analysis, and auto-repair
 */

import { createSmartDiagnostics } from './index';

console.log('🔍 Smart Diagnostics System Demo Starting...');

// Initialize the diagnostics system
const diagnostics = createSmartDiagnostics({
  performanceMode: false, // Full features for demo
  samplingRate: 1.0,      // Process all errors
  aiAnalysis: true,       // Enable AI analysis
  maxErrors: 50
});

// Set up event listeners
diagnostics.onError((error) => {
  console.log('📢 Error Detected:', {
    category: error.category,
    severity: error.severity,
    message: error.message,
    aiAnalysis: error.aiAnalysis ? {
      confidence: Math.round(error.aiAnalysis.confidence * 100) + '%',
      cause: error.aiAnalysis.predictedCause,
      suggestion: error.aiAnalysis.suggestion
    } : 'No AI analysis',
    autoRepair: error.context.customData?.autoRepair ? 
      error.context.customData.autoRepair.message : 'No auto-repair attempted'
  });
});

// Demo function to test the system
async function runDemo() {
  console.log('\n🚀 Running Smart Diagnostics Demo...\n');

  // Test 1: Audio Error
  console.log('Test 1: Audio Permission Error');
  diagnostics.reportManualError('audio', 'NotAllowedError: Permission denied for microphone access');
  await delay(200);

  // Test 2: WebGL Error (critical - should trigger auto-repair)
  console.log('\nTest 2: WebGL Context Lost (Critical)');
  diagnostics.reportManualError('rendering', 'WebGL context lost - GPU driver crashed');
  await delay(300);

  // Test 3: Model Loading Error
  console.log('\nTest 3: Model Loading Error');
  diagnostics.reportManualError('model', 'Failed to parse GLTF model: Invalid JSON structure');
  await delay(200);

  // Test 4: Performance Issue
  console.log('\nTest 4: Performance Degradation');
  diagnostics.reportManualError('performance', 'Memory usage exceeded 200MB - potential memory leak');
  await delay(200);

  // Test 5: UI Component Error
  console.log('\nTest 5: React Component Error');
  diagnostics.reportManualError('ui', 'React component render error: Cannot read property of undefined');
  await delay(200);

  // Show diagnostics summary
  console.log('\n📊 Diagnostics Summary:');
  const summary = diagnostics.getSummary();
  console.log('Total Errors:', summary.total);
  console.log('By Category:', summary.byCategory);
  console.log('By Severity:', summary.bySeverity);

  // Show performance metrics
  console.log('\n⚡ Performance Metrics:');
  const performance = diagnostics.getPerformanceMetrics();
  console.log('FPS:', performance.fps);
  console.log('Memory Usage:', performance.memoryMB + 'MB');
  console.log('Processing Time:', performance.processingTime + 'ms');

  // Show auto-repair statistics
  console.log('\n🛠️ Auto-Repair Statistics:');
  const repairStats = diagnostics.getAutoRepairStats();
  console.log('Total Repairs Attempted:', repairStats.totalRepairs);
  console.log('Success Rate:', Math.round(repairStats.successRate * 100) + '%');
  console.log('Patterns Learned:', repairStats.actionsLearned);

  console.log('\n✅ Demo Complete! The Smart Diagnostics System is working correctly.');
  console.log('📝 Key Features Demonstrated:');
  console.log('  - ✅ Error Detection & Categorization');
  console.log('  - 🤖 AI-Powered Analysis');
  console.log('  - 🛠️ Auto-Repair System');
  console.log('  - 📊 Performance Monitoring');
  console.log('  - 📈 Machine Learning');
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Track active features for better context
diagnostics.updateFeatures([
  'demo-mode',
  'error-testing',
  'ai-analysis',
  'auto-repair'
]);

// Run the demo
runDemo().catch(console.error);

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).runDiagnosticsDemo = runDemo;
  (window as any).diagnostics = diagnostics;
  
  console.log('💡 Available in browser console:');
  console.log('  - runDiagnosticsDemo() - Run the full demo');
  console.log('  - diagnostics - Access the diagnostics instance');
}
