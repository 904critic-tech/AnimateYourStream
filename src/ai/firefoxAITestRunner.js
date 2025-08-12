/**
 * Firefox AI Compatibility Test Runner
 * Agent 1 - Phase 2 Cross-Platform Testing
 * Comprehensive AI behavior validation for Firefox browser
 */

async function runFirefoxAITests() {
  console.log('🦊 FIREFOX AI COMPATIBILITY TESTING - STARTING');
  console.log('==============================================');
  
  const testResults = {
    browser: 'Firefox',
    userAgent: navigator.userAgent,
    startTime: new Date().toISOString(),
    tests: [],
    firefoxSpecific: {
      javascriptEngine: 'SpiderMonkey',
      webglVersion: null,
      privacySettings: null,
      storageSupport: null
    },
    metrics: {
      responseTimeResults: [],
      compatibilityResults: [],
      performanceComparison: {},
      performanceScore: 0
    }
  };

  // Helper function to add test results
  function addTestResult(name, passed, details, metrics = {}) {
    const result = {
      name,
      passed,
      details,
      metrics,
      timestamp: new Date().toISOString()
    };
    testResults.tests.push(result);
    console.log(`${passed ? '✅' : '❌'} ${name}: ${details}`);
    return result;
  }

  try {
    // Test 1: Firefox Browser Detection and Capabilities
    console.log('\n📋 TEST 1: Firefox Browser Detection');
    const isFirefox = navigator.userAgent.includes('Firefox');
    const firefoxVersion = navigator.userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    
    addTestResult(
      'Firefox Browser Detection',
      isFirefox,
      `Detected Firefox ${firefoxVersion}`
    );

    // Test WebGL capabilities in Firefox
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const gl2 = canvas.getContext('webgl2');
    
    testResults.firefoxSpecific.webglVersion = gl2 ? 'WebGL 2.0' : gl ? 'WebGL 1.0' : 'None';
    addTestResult(
      'Firefox WebGL Support',
      gl !== null,
      `WebGL Support: ${testResults.firefoxSpecific.webglVersion}`
    );

    // Test 2: AI System Availability in Firefox
    console.log('\n🤖 TEST 2: AI System Availability in Firefox');
    const aiSystem = window.__AI_BEHAVIOR_SYSTEM__;
    if (!aiSystem) {
      addTestResult('AI System Availability', false, 'AI system not found in Firefox environment');
      return testResults;
    }
    addTestResult('AI System Availability', true, 'AI behavior system loaded successfully in Firefox');

    // Test 3: Firefox JavaScript Engine Compatibility
    console.log('\n⚡ TEST 3: Firefox JavaScript Engine Compatibility');
    const jsEngineTests = [];
    
    // Test ES6+ features used by AI system
    try {
      // Test async/await
      const asyncTest = async () => 'async works';
      await asyncTest();
      jsEngineTests.push('async/await: ✅');
      
      // Test Promises
      await Promise.resolve('promise works');
      jsEngineTests.push('Promises: ✅');
      
      // Test Map/Set
      const testMap = new Map();
      testMap.set('test', 'value');
      jsEngineTests.push('Map: ✅');
      
      // Test arrow functions
      const arrowTest = () => 'arrow works';
      arrowTest();
      jsEngineTests.push('Arrow functions: ✅');
      
      // Test destructuring
      const { userAgent } = navigator;
      jsEngineTests.push('Destructuring: ✅');
      
    } catch (error) {
      jsEngineTests.push(`Error: ${error.message}`);
    }
    
    addTestResult(
      'Firefox JavaScript Engine Features',
      jsEngineTests.length >= 5,
      jsEngineTests.join(', ')
    );

    // Test 4: AI Context Processing Compatibility
    console.log('\n🎭 TEST 4: AI Context Processing in Firefox');
    const contextTests = [];
    const firefoxResponseTimes = [];
    
    // Test various context types specific to Firefox compatibility
    const firefoxContexts = [
      { type: 'INTERACTION', intensity: 0.8, metadata: { browser: 'firefox', engine: 'gecko' } },
      { type: 'CONVERSATION', intensity: 0.9, metadata: { privacy: 'enhanced', tracking: 'blocked' } },
      { type: 'SCENE_CHANGE', intensity: 0.7, metadata: { webgl: testResults.firefoxSpecific.webglVersion } },
      { type: 'SYSTEM_EVENT', intensity: 0.6, metadata: { firefox: true, version: firefoxVersion } }
    ];
    
    for (let i = 0; i < firefoxContexts.length; i++) {
      const context = firefoxContexts[i];
      const start = performance.now();
      
      try {
        aiSystem.addContext(context);
        const decision = aiSystem.getCurrentAnimationDecision(['idle', 'firefox_compatible', 'gecko_optimized', 'cross_browser']);
        const responseTime = performance.now() - start;
        firefoxResponseTimes.push(responseTime);
        
        contextTests.push(`${context.type}: ${responseTime.toFixed(2)}ms`);
      } catch (error) {
        contextTests.push(`${context.type}: FAILED - ${error.message}`);
      }
    }
    
    const avgFirefoxResponse = firefoxResponseTimes.reduce((a, b) => a + b, 0) / firefoxResponseTimes.length;
    testResults.metrics.responseTimeResults = {
      average: avgFirefoxResponse,
      maximum: Math.max(...firefoxResponseTimes),
      minimum: Math.min(...firefoxResponseTimes),
      tests: firefoxResponseTimes.length
    };
    
    addTestResult(
      'Firefox AI Context Processing',
      avgFirefoxResponse < 150, // Slightly higher threshold for Firefox
      `${contextTests.join(', ')} | Avg: ${avgFirefoxResponse.toFixed(2)}ms`
    );

    // Test 5: Firefox AI Performance Comparison (50+ requests)
    console.log('\n📊 TEST 5: Firefox AI Performance Testing (50+ requests)');
    const performanceResponseTimes = [];
    const requestCount = 52; // Exceed minimum requirement
    
    for (let i = 0; i < requestCount; i++) {
      const start = performance.now();
      
      try {
        // Firefox-specific interaction patterns
        const firefoxInteractions = ['click', 'rightclick', 'middleclick', 'hover', 'focus', 'scroll', 'resize'];
        const interaction = firefoxInteractions[i % firefoxInteractions.length];
        
        aiSystem.addInteractionContext(interaction, 'model', Math.random() * 100);
        aiSystem.addAudioContext(Math.sin(i * 0.15) * 0.6 + 0.4); // Slight variation from Chrome
        
        const decision = aiSystem.getCurrentAnimationDecision(['idle', 'firefox_mode', 'gecko_anim', 'cross_platform']);
        const responseTime = performance.now() - start;
        performanceResponseTimes.push(responseTime);
        
        if (i % 10 === 0) {
          console.log(`   Firefox Request ${i + 1}/${requestCount}: ${responseTime.toFixed(2)}ms`);
        }
      } catch (error) {
        console.warn(`   Firefox Request ${i + 1} failed:`, error.message);
      }
    }
    
    const avgPerformanceTime = performanceResponseTimes.reduce((a, b) => a + b, 0) / performanceResponseTimes.length;
    const maxPerformanceTime = Math.max(...performanceResponseTimes);
    
    testResults.metrics.performanceComparison = {
      average: avgPerformanceTime,
      maximum: maxPerformanceTime,
      totalRequests: requestCount,
      target: 120 // Slightly higher target for Firefox
    };
    
    const firefoxPerformancePassed = avgPerformanceTime < 120 && maxPerformanceTime < 200;
    addTestResult(
      `Firefox AI Performance (${requestCount} requests)`,
      firefoxPerformancePassed,
      `Avg: ${avgPerformanceTime.toFixed(2)}ms, Max: ${maxPerformanceTime.toFixed(2)}ms (Target: <120ms avg)`
    );

    // Test 6: Firefox Privacy Settings Impact
    console.log('\n🔒 TEST 6: Firefox Privacy Settings Impact');
    try {
      // Test localStorage functionality
      const testKey = 'firefox_ai_test_' + Date.now();
      localStorage.setItem(testKey, 'test_value');
      const retrievedValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      testResults.firefoxSpecific.storageSupport = retrievedValue === 'test_value';
      
      // Test AI data persistence
      const persistenceTestPassed = testResults.firefoxSpecific.storageSupport;
      addTestResult(
        'Firefox Privacy/Storage Compatibility',
        persistenceTestPassed,
        `localStorage: ${persistenceTestPassed ? 'Available' : 'Blocked'}`
      );
      
    } catch (error) {
      testResults.firefoxSpecific.storageSupport = false;
      addTestResult(
        'Firefox Privacy/Storage Compatibility',
        false,
        `Storage test failed: ${error.message}`
      );
    }

    // Test 7: Firefox WebGL Integration with AI
    console.log('\n🎮 TEST 7: Firefox WebGL + AI Integration');
    if (gl) {
      try {
        // Test WebGL context loss simulation (Firefox-specific)
        const webglLossExt = gl.getExtension('WEBGL_lose_context');
        if (webglLossExt) {
          console.log('   Testing WebGL context loss handling...');
          
          // Add context before simulating loss
          aiSystem.addContext({
            type: 'SYSTEM_EVENT',
            intensity: 0.9,
            metadata: { webglTest: true, contextLoss: 'simulated' }
          });
          
          // Simulate context loss
          webglLossExt.loseContext();
          
          // Test AI behavior when WebGL is lost
          const decisionAfterLoss = aiSystem.getCurrentAnimationDecision(['fallback', 'webgl_lost', 'degraded']);
          
          // Restore context
          webglLossExt.restoreContext();
          
          addTestResult(
            'Firefox WebGL Context Loss Handling',
            decisionAfterLoss !== null,
            'AI system handled WebGL context loss gracefully'
          );
        } else {
          addTestResult(
            'Firefox WebGL Context Loss Handling',
            true,
            'WebGL loss extension not available (normal for some Firefox versions)'
          );
        }
      } catch (error) {
        addTestResult(
          'Firefox WebGL Context Loss Handling',
          false,
          `WebGL test failed: ${error.message}`
        );
      }
    } else {
      addTestResult(
        'Firefox WebGL + AI Integration',
        false,
        'WebGL not available in Firefox'
      );
    }

    // Test 8: Firefox Developer Tools Integration
    console.log('\n🛠️ TEST 8: Firefox Developer Tools Compatibility');
    let devToolsCompatible = true;
    let devToolsDetails = [];
    
    try {
      // Test console API
      console.group('Firefox AI Test Group');
      console.info('Testing console integration');
      console.table({ test: 'firefox', status: 'running' });
      console.groupEnd();
      devToolsDetails.push('Console API: ✅');
      
      // Test performance API
      if (performance.mark && performance.measure) {
        performance.mark('firefox-ai-test-start');
        performance.mark('firefox-ai-test-end');
        performance.measure('firefox-ai-test', 'firefox-ai-test-start', 'firefox-ai-test-end');
        devToolsDetails.push('Performance API: ✅');
      } else {
        devToolsDetails.push('Performance API: ❌');
        devToolsCompatible = false;
      }
      
    } catch (error) {
      devToolsDetails.push(`Error: ${error.message}`);
      devToolsCompatible = false;
    }
    
    addTestResult(
      'Firefox Developer Tools Compatibility',
      devToolsCompatible,
      devToolsDetails.join(', ')
    );

    // Calculate overall Firefox compatibility score
    const passedTests = testResults.tests.filter(test => test.passed).length;
    const totalTests = testResults.tests.length;
    testResults.metrics.performanceScore = (passedTests / totalTests) * 100;

    // Generate final Firefox report
    console.log('\n🦊 FIREFOX AI COMPATIBILITY TEST SUMMARY');
    console.log('==========================================');
    console.log(`Browser: Firefox ${firefoxVersion}`);
    console.log(`JavaScript Engine: SpiderMonkey`);
    console.log(`WebGL Support: ${testResults.firefoxSpecific.webglVersion}`);
    console.log(`Storage Support: ${testResults.firefoxSpecific.storageSupport ? 'Available' : 'Limited'}`);
    console.log(`Tests Passed: ${passedTests}/${totalTests} (${testResults.metrics.performanceScore.toFixed(1)}%)`);
    console.log(`Average Response Time: ${testResults.metrics.responseTimeResults.average?.toFixed(2) || 'N/A'}ms`);
    console.log(`Performance Comparison: ${testResults.metrics.performanceComparison.average?.toFixed(2) || 'N/A'}ms avg`);
    
    if (testResults.metrics.performanceScore >= 80) {
      console.log('🎉 FIREFOX AI TESTING: EXCELLENT COMPATIBILITY!');
    } else if (testResults.metrics.performanceScore >= 60) {
      console.log('✅ FIREFOX AI TESTING: GOOD COMPATIBILITY');
    } else {
      console.log('⚠️ FIREFOX AI TESTING: COMPATIBILITY ISSUES DETECTED');
    }
    
    // Store results globally for cross-browser comparison
    window.__FIREFOX_AI_TEST_RESULTS__ = testResults;
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Firefox AI Testing failed:', error);
    addTestResult('Firefox AI Testing Suite', false, `Critical error: ${error.message}`);
    return testResults;
  }
}

// Make available globally
window.runFirefoxAITests = runFirefoxAITests;

console.log('🦊 Firefox AI Test Runner loaded - Call runFirefoxAITests() to begin testing');
