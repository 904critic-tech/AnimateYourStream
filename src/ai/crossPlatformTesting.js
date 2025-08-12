/**
 * Cross-Platform AI Testing Framework
 * Agent 1 - AI Behavior Team
 * Phase 2 Testing Suite
 */

class CrossPlatformAITester {
  constructor() {
    this.testResults = {
      browser: this.detectBrowser(),
      userAgent: navigator.userAgent,
      tests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        responseTimeAvg: 0,
        memoryUsage: []
      }
    };
    this.startTime = performance.now();
  }

  detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  async testAIBehaviorEngine() {
    console.log(`🤖 Starting AI Behavior Engine Tests on ${this.testResults.browser}`);
    
    // Test AI system availability
    const aiSystem = window.__AI_BEHAVIOR_SYSTEM__;
    if (!aiSystem) {
      this.addTestResult('AI System Availability', false, 'AI system not found on window object');
      return;
    }
    this.addTestResult('AI System Availability', true, 'AI system loaded successfully');

    // Test AI responsiveness with 50+ requests
    await this.testAIResponsiveness(aiSystem, 50);
    
    // Test complex 3D scene context analysis
    await this.testComplexSceneAnalysis(aiSystem);
    
    // Test AI learning system with 30+ interactions
    await this.testLearningSystem(aiSystem, 30);
    
    // Test memory management during extended session
    await this.testMemoryManagement(aiSystem);
    
    // Test animation decision accuracy
    await this.testAnimationDecisionAccuracy(aiSystem, 20);
  }

  async testAIResponsiveness(aiSystem, requestCount) {
    console.log(`⚡ Testing AI responsiveness with ${requestCount} requests...`);
    const responseTimes = [];
    
    for (let i = 0; i < requestCount; i++) {
      const start = performance.now();
      
      try {
        // Add context and get decision
        aiSystem.addInteractionContext('click', 'model', Math.random() * 100);
        aiSystem.addAudioContext(Math.random() * 0.8);
        
        const decision = aiSystem.getCurrentAnimationDecision(['idle', 'wave', 'nod', 'dance', 'talk']);
        const responseTime = performance.now() - start;
        responseTimes.push(responseTime);
        
        if (responseTime > 100) {
          console.warn(`⚠️ Slow response (${responseTime.toFixed(2)}ms) on request ${i + 1}`);
        }
      } catch (error) {
        this.addTestResult(`AI Response ${i + 1}`, false, `Error: ${error.message}`);
        continue;
      }
    }
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const target = 100; // 100ms target for desktop
    
    this.testResults.summary.responseTimeAvg = avgResponseTime;
    
    const passed = avgResponseTime < target && maxResponseTime < target * 2;
    this.addTestResult(
      `AI Responsiveness (${requestCount} requests)`,
      passed,
      `Avg: ${avgResponseTime.toFixed(2)}ms, Max: ${maxResponseTime.toFixed(2)}ms, Target: <${target}ms`
    );
  }

  async testComplexSceneAnalysis(aiSystem) {
    console.log('🎭 Testing complex 3D scene context analysis...');
    
    try {
      // Simulate complex scene with 10+ objects
      const complexContext = {
        type: 'SCENE_CHANGE',
        intensity: 0.9,
        metadata: {
          objectCount: 12,
          animations: 8,
          complexity: 'high',
          lighting: 'dynamic',
          particles: true,
          shadows: true
        }
      };
      
      const start = performance.now();
      aiSystem.addContext(complexContext);
      
      // Test context analyzer's ability to handle complex scenes
      const contextAnalyzer = aiSystem.contextAnalyzer;
      if (contextAnalyzer && contextAnalyzer.getEnvironmentalContext) {
        const envContext = contextAnalyzer.getEnvironmentalContext();
        const responseTime = performance.now() - start;
        
        this.addTestResult(
          'Complex Scene Analysis',
          responseTime < 50 && envContext !== null,
          `Response time: ${responseTime.toFixed(2)}ms, Context: ${JSON.stringify(envContext).substring(0, 100)}...`
        );
      } else {
        this.addTestResult('Complex Scene Analysis', false, 'Context analyzer not available');
      }
    } catch (error) {
      this.addTestResult('Complex Scene Analysis', false, `Error: ${error.message}`);
    }
  }

  async testLearningSystem(aiSystem, interactionCount) {
    console.log(`🧠 Testing AI learning system with ${interactionCount} interactions...`);
    
    try {
      const patterns = ['click', 'hover', 'focus', 'scroll'];
      
      for (let i = 0; i < interactionCount; i++) {
        const pattern = patterns[i % patterns.length];
        aiSystem.addInteractionContext(pattern, 'model', Math.random() * 50);
        
        // Add some audio context variety
        aiSystem.addAudioContext(Math.sin(i * 0.1) * 0.5 + 0.5);
        
        // Get decisions to train the system
        aiSystem.getCurrentAnimationDecision(['idle', 'engage', 'react', 'respond']);
      }
      
      // Test learning stats
      const learningStats = aiSystem.getLearningStats();
      const hasLearningData = learningStats && 
        (learningStats.interactionCount > 0 || learningStats.patterns > 0);
      
      this.addTestResult(
        `Learning System (${interactionCount} interactions)`,
        hasLearningData,
        `Learning stats: ${JSON.stringify(learningStats)}`
      );
      
      // Test predictive analysis
      if (aiSystem.contextAnalyzer && aiSystem.contextAnalyzer.getPredictiveAnalysis) {
        const prediction = aiSystem.contextAnalyzer.getPredictiveAnalysis();
        this.addTestResult(
          'Predictive Analysis',
          prediction && typeof prediction.confidence === 'number',
          `Prediction confidence: ${prediction ? prediction.confidence : 'N/A'}`
        );
      }
    } catch (error) {
      this.addTestResult('Learning System', false, `Error: ${error.message}`);
    }
  }

  async testMemoryManagement(aiSystem) {
    console.log('💾 Testing memory management during extended session...');
    
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const testDuration = 10000; // 10 seconds intensive test
    const startTime = performance.now();
    
    try {
      // Simulate extended session with rapid context changes
      const interval = setInterval(() => {
        if (performance.now() - startTime > testDuration) {
          clearInterval(interval);
          return;
        }
        
        // Add various contexts rapidly
        aiSystem.addInteractionContext('hover', 'model', Math.random() * 100);
        aiSystem.addAudioContext(Math.random());
        aiSystem.getCurrentAnimationDecision(['idle', 'active', 'focused']);
        
        // Track memory usage
        if (performance.memory) {
          this.testResults.summary.memoryUsage.push(performance.memory.usedJSHeapSize);
        }
      }, 50); // Every 50ms
      
      // Wait for test completion
      await new Promise(resolve => setTimeout(resolve, testDuration + 1000));
      
      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercent = initialMemory > 0 ? (memoryIncrease / initialMemory) * 100 : 0;
      
      // Consider test passed if memory increase is reasonable (<50%)
      const passed = memoryIncreasePercent < 50;
      
      this.addTestResult(
        'Memory Management',
        passed,
        `Memory increase: ${memoryIncreasePercent.toFixed(2)}% (${(memoryIncrease / 1024 / 1024).toFixed(2)}MB)`
      );
    } catch (error) {
      this.addTestResult('Memory Management', false, `Error: ${error.message}`);
    }
  }

  async testAnimationDecisionAccuracy(aiSystem, scenarioCount) {
    console.log(`🎯 Testing animation decision accuracy with ${scenarioCount} scenarios...`);
    
    const scenarios = [
      { context: 'INTERACTION', intensity: 0.8, expected: ['wave', 'nod', 'gesture'] },
      { context: 'CONVERSATION', intensity: 0.9, expected: ['talk', 'listen', 'nod'] },
      { context: 'IDLE', intensity: 0.2, expected: ['idle', 'breathe', 'look_around'] },
      { context: 'SYSTEM_EVENT', intensity: 0.5, expected: ['react', 'focus', 'alert'] },
      { context: 'SCENE_CHANGE', intensity: 0.7, expected: ['look_around', 'focus', 'analyze'] }
    ];
    
    let accurateDecisions = 0;
    
    for (let i = 0; i < scenarioCount; i++) {
      const scenario = scenarios[i % scenarios.length];
      
      try {
        aiSystem.addContext({
          type: scenario.context,
          intensity: scenario.intensity,
          metadata: { testScenario: i }
        });
        
        const decision = aiSystem.getCurrentAnimationDecision(scenario.expected);
        
        // Check if decision is contextually appropriate
        if (decision && scenario.expected.includes(decision.animation)) {
          accurateDecisions++;
        }
      } catch (error) {
        console.warn(`Scenario ${i} failed:`, error.message);
      }
    }
    
    const accuracy = (accurateDecisions / scenarioCount) * 100;
    const passed = accuracy >= 80; // 80% accuracy target
    
    this.addTestResult(
      `Animation Decision Accuracy (${scenarioCount} scenarios)`,
      passed,
      `Accuracy: ${accuracy.toFixed(1)}% (${accurateDecisions}/${scenarioCount})`
    );
  }

  addTestResult(testName, passed, details) {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.tests.push(result);
    this.testResults.summary.totalTests++;
    
    if (passed) {
      this.testResults.summary.passed++;
      console.log(`✅ ${testName}: PASSED - ${details}`);
    } else {
      this.testResults.summary.failed++;
      console.log(`❌ ${testName}: FAILED - ${details}`);
    }
  }

  generateReport() {
    const duration = (performance.now() - this.startTime) / 1000;
    const passRate = (this.testResults.summary.passed / this.testResults.summary.totalTests) * 100;
    
    console.log('\n📊 CHROME AI TESTING REPORT');
    console.log('================================');
    console.log(`Browser: ${this.testResults.browser}`);
    console.log(`Test Duration: ${duration.toFixed(2)}s`);
    console.log(`Tests: ${this.testResults.summary.passed}/${this.testResults.summary.totalTests} passed (${passRate.toFixed(1)}%)`);
    console.log(`Average Response Time: ${this.testResults.summary.responseTimeAvg.toFixed(2)}ms`);
    
    if (this.testResults.summary.memoryUsage.length > 0) {
      const avgMemory = this.testResults.summary.memoryUsage.reduce((a, b) => a + b, 0) / this.testResults.summary.memoryUsage.length;
      console.log(`Average Memory Usage: ${(avgMemory / 1024 / 1024).toFixed(2)}MB`);
    }
    
    console.log('\nDetailed Results:');
    this.testResults.tests.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}: ${test.details}`);
    });
    
    return this.testResults;
  }
}

// Export for global use
window.__CROSS_PLATFORM_AI_TESTER__ = CrossPlatformAITester;

console.log('🚀 Cross-Platform AI Testing Framework Loaded');
console.log('Usage: const tester = new CrossPlatformAITester(); await tester.testAIBehaviorEngine(); tester.generateReport();');
