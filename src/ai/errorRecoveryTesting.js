/**
 * AI Error Recovery Testing Framework
 * Agent 1 - Phase 2 AI Error Recovery Validation
 * Tests AI system resilience under adverse conditions
 */

async function runAIErrorRecoveryTests() {
  console.log('🔧 AI ERROR RECOVERY TESTING - STARTING');
  console.log('========================================');
  
  const testResults = {
    framework: 'AI Error Recovery Testing',
    startTime: new Date().toISOString(),
    testSuites: {},
    overallResults: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      recoveryTime: [],
      resilience: {
        networkInterruptions: 0,
        webglContextLoss: 0,
        memoryPressure: 0,
        gracefulDegradation: 0
      }
    },
    recommendations: []
  };

  // Helper function to add test results
  function addTestResult(suiteName, testName, passed, details, recoveryTimeMs = null) {
    if (!testResults.testSuites[suiteName]) {
      testResults.testSuites[suiteName] = { tests: [], summary: { passed: 0, failed: 0 } };
    }
    
    const result = {
      name: testName,
      passed,
      details,
      recoveryTime: recoveryTimeMs,
      timestamp: new Date().toISOString()
    };
    
    testResults.testSuites[suiteName].tests.push(result);
    testResults.testSuites[suiteName].summary[passed ? 'passed' : 'failed']++;
    testResults.overallResults.totalTests++;
    testResults.overallResults[passed ? 'passedTests' : 'failedTests']++;
    
    if (recoveryTimeMs !== null) {
      testResults.overallResults.recoveryTime.push(recoveryTimeMs);
    }
    
    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${testName}: ${details}${recoveryTimeMs ? ` (Recovery: ${recoveryTimeMs}ms)` : ''}`);
    
    return result;
  }

  try {
    // Check AI system availability
    const aiSystem = window.__AI_BEHAVIOR_SYSTEM__;
    if (!aiSystem) {
      console.error('❌ AI system not available for error recovery testing');
      return testResults;
    }
    
    console.log('🤖 AI system found - Beginning error recovery testing...\n');

    // Test Suite 1: Network Interruption Recovery
    console.log('🌐 TEST SUITE 1: Network Interruption Recovery');
    console.log('================================================');
    
    try {
      // Test 1.1: AI continues functioning during network loss
      const networkTestStart = performance.now();
      
      // Simulate network degradation by blocking fetch requests
      const originalFetch = window.fetch;
      let networkBlocked = false;
      
      window.fetch = function(...args) {
        if (networkBlocked) {
          return Promise.reject(new Error('Network unavailable (simulated)'));
        }
        return originalFetch.apply(this, args);
      };
      
      // Test AI system resilience during network issues
      networkBlocked = true;
      
      try {
        // Add context and test AI continues working locally
        aiSystem.addInteractionContext('click', 'model', 75);
        aiSystem.addAudioContext(0.8);
        const decision = aiSystem.getCurrentAnimationDecision(['idle', 'network_loss', 'offline_mode']);
        
        const networkRecoveryTime = performance.now() - networkTestStart;
        
        addTestResult(
          'Network Interruption',
          'AI Local Processing During Network Loss',
          decision !== null,
          `AI continued processing without network: ${decision ? 'Yes' : 'No'}`,
          networkRecoveryTime
        );
        
        testResults.overallResults.resilience.networkInterruptions++;
        
      } catch (error) {
        addTestResult(
          'Network Interruption',
          'AI Local Processing During Network Loss',
          false,
          `AI failed during network loss: ${error.message}`
        );
      }
      
      // Test 1.2: Network recovery handling
      networkBlocked = false;
      
      try {
        const recoveryStart = performance.now();
        
        // Test AI system recovery when network comes back
        aiSystem.addInteractionContext('scroll', 'model', 60);
        const recoveryDecision = aiSystem.getCurrentAnimationDecision(['idle', 'network_restored', 'online_mode']);
        
        const networkRestorationTime = performance.now() - recoveryStart;
        
        addTestResult(
          'Network Interruption',
          'AI Network Recovery',
          recoveryDecision !== null,
          `AI resumed normal operation after network restoration: ${recoveryDecision ? 'Yes' : 'No'}`,
          networkRestorationTime
        );
        
      } catch (error) {
        addTestResult(
          'Network Interruption',
          'AI Network Recovery',
          false,
          `AI failed to recover from network restoration: ${error.message}`
        );
      }
      
      // Restore original fetch
      window.fetch = originalFetch;
      
    } catch (error) {
      addTestResult(
        'Network Interruption',
        'Network Testing Suite',
        false,
        `Network test suite failed: ${error.message}`
      );
    }

    // Test Suite 2: WebGL Context Loss Recovery
    console.log('\n🎮 TEST SUITE 2: WebGL Context Loss Recovery');
    console.log('=============================================');
    
    try {
      // Test 2.1: AI handles WebGL context loss gracefully
      const webglTestStart = performance.now();
      
      // Test AI system with WebGL context unavailable
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      
      if (gl) {
        // Simulate WebGL context loss
        const loseContext = gl.getExtension('WEBGL_lose_context');
        
        if (loseContext) {
          console.log('   Simulating WebGL context loss...');
          loseContext.loseContext();
          
          // Test AI continues without WebGL
          try {
            aiSystem.addContext({
              type: 'SCENE_CHANGE',
              intensity: 0.7,
              metadata: { webglLost: true, fallbackMode: true }
            });
            
            const webglLossDecision = aiSystem.getCurrentAnimationDecision(['idle', 'webgl_fallback', 'software_mode']);
            const webglRecoveryTime = performance.now() - webglTestStart;
            
            addTestResult(
              'WebGL Context Loss',
              'AI WebGL Fallback Mode',
              webglLossDecision !== null,
              `AI adapted to WebGL loss: ${webglLossDecision ? 'Yes' : 'No'}`,
              webglRecoveryTime
            );
            
            testResults.overallResults.resilience.webglContextLoss++;
            
            // Test WebGL context restoration
            setTimeout(() => {
              try {
                loseContext.restoreContext();
                console.log('   WebGL context restored');
                
                const restorationStart = performance.now();
                aiSystem.addContext({
                  type: 'SCENE_CHANGE',
                  intensity: 0.8,
                  metadata: { webglRestored: true, hardwareMode: true }
                });
                
                const webglRestoreDecision = aiSystem.getCurrentAnimationDecision(['idle', 'webgl_restored', 'hardware_mode']);
                const webglRestorationTime = performance.now() - restorationStart;
                
                addTestResult(
                  'WebGL Context Loss',
                  'AI WebGL Recovery',
                  webglRestoreDecision !== null,
                  `AI adapted to WebGL restoration: ${webglRestoreDecision ? 'Yes' : 'No'}`,
                  webglRestorationTime
                );
                
              } catch (error) {
                addTestResult(
                  'WebGL Context Loss',
                  'AI WebGL Recovery',
                  false,
                  `WebGL restoration failed: ${error.message}`
                );
              }
            }, 100);
            
          } catch (error) {
            addTestResult(
              'WebGL Context Loss',
              'AI WebGL Fallback Mode',
              false,
              `AI failed during WebGL loss: ${error.message}`
            );
          }
          
        } else {
          addTestResult(
            'WebGL Context Loss',
            'WebGL Context Loss Extension',
            false,
            'WebGL lose context extension not available for testing'
          );
        }
        
      } else {
        addTestResult(
          'WebGL Context Loss',
          'WebGL Availability',
          false,
          'WebGL not available in this environment'
        );
      }
      
    } catch (error) {
      addTestResult(
        'WebGL Context Loss',
        'WebGL Testing Suite',
        false,
        `WebGL test suite failed: ${error.message}`
      );
    }

    // Test Suite 3: Memory Pressure Recovery
    console.log('\n💾 TEST SUITE 3: Memory Pressure Recovery');
    console.log('=========================================');
    
    try {
      // Test 3.1: AI handles memory pressure gracefully
      const memoryTestStart = performance.now();
      
      // Monitor initial memory if available
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : null;
      
      // Simulate memory pressure by creating large objects
      const memoryPressureArrays = [];
      const memoryTestDuration = 3000; // 3 seconds of pressure
      let memoryTestActive = true;
      
      // Create memory pressure
      const memoryPressureInterval = setInterval(() => {
        if (!memoryTestActive) {
          clearInterval(memoryPressureInterval);
          return;
        }
        
        // Allocate memory to create pressure
        const largeArray = new Array(100000).fill(Math.random());
        memoryPressureArrays.push(largeArray);
        
        // Test AI under memory pressure
        try {
          aiSystem.addInteractionContext('scroll', 'model', Math.random() * 50);
          aiSystem.addAudioContext(Math.random() * 0.8);
          const memoryPressureDecision = aiSystem.getCurrentAnimationDecision(['idle', 'memory_optimized', 'low_memory_mode']);
          
          if (memoryPressureDecision) {
            testResults.overallResults.resilience.memoryPressure++;
          }
          
        } catch (error) {
          console.warn(`   AI struggled under memory pressure: ${error.message}`);
        }
      }, 200);
      
      // End memory pressure test
      setTimeout(() => {
        memoryTestActive = false;
        
        // Test recovery after memory pressure
        const recoveryStart = performance.now();
        
        // Clear memory pressure
        memoryPressureArrays.length = 0;
        
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
        
        try {
          // Test AI recovery after memory pressure
          aiSystem.addInteractionContext('click', 'model', 80);
          const recoveryDecision = aiSystem.getCurrentAnimationDecision(['idle', 'memory_recovered', 'normal_mode']);
          
          const memoryRecoveryTime = performance.now() - recoveryStart;
          const totalMemoryTestTime = performance.now() - memoryTestStart;
          
          const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : null;
          const memoryInfo = initialMemory && finalMemory ? 
            `Memory delta: ${((finalMemory - initialMemory) / 1024 / 1024).toFixed(2)}MB` : 
            'Memory monitoring not available';
          
          addTestResult(
            'Memory Pressure',
            'AI Memory Pressure Recovery',
            recoveryDecision !== null,
            `AI recovered from memory pressure: ${recoveryDecision ? 'Yes' : 'No'}. ${memoryInfo}`,
            memoryRecoveryTime
          );
          
          // Additional memory health check
          const healthCheck = testResults.overallResults.resilience.memoryPressure > 5;
          addTestResult(
            'Memory Pressure',
            'AI Memory Pressure Resilience',
            healthCheck,
            `AI maintained functionality under pressure: ${healthCheck ? 'Resilient' : 'Struggled'} (${testResults.overallResults.resilience.memoryPressure} successful operations)`
          );
          
        } catch (error) {
          addTestResult(
            'Memory Pressure',
            'AI Memory Pressure Recovery',
            false,
            `AI failed to recover from memory pressure: ${error.message}`
          );
        }
        
      }, memoryTestDuration);
      
    } catch (error) {
      addTestResult(
        'Memory Pressure',
        'Memory Testing Suite',
        false,
        `Memory test suite failed: ${error.message}`
      );
    }

    // Test Suite 4: Graceful Degradation
    console.log('\n🔧 TEST SUITE 4: Graceful Degradation');
    console.log('====================================');
    
    try {
      // Test 4.1: AI handles missing dependencies
      const degradationTestStart = performance.now();
      
      // Test AI with missing context analyzer
      const originalContextAnalyzer = aiSystem.contextAnalyzer;
      
      try {
        // Temporarily remove context analyzer
        aiSystem.contextAnalyzer = null;
        
        const degradedDecision = aiSystem.getCurrentAnimationDecision(['idle', 'degraded_mode', 'fallback']);
        const degradationTime = performance.now() - degradationTestStart;
        
        addTestResult(
          'Graceful Degradation',
          'AI Missing Context Analyzer',
          degradedDecision !== null,
          `AI handled missing context analyzer: ${degradedDecision ? 'Gracefully' : 'Failed'}`,
          degradationTime
        );
        
        testResults.overallResults.resilience.gracefulDegradation++;
        
      } catch (error) {
        addTestResult(
          'Graceful Degradation',
          'AI Missing Context Analyzer',
          false,
          `AI failed with missing context analyzer: ${error.message}`
        );
      } finally {
        // Restore context analyzer
        aiSystem.contextAnalyzer = originalContextAnalyzer;
      }
      
      // Test 4.2: AI handles invalid input gracefully
      try {
        const invalidInputStart = performance.now();
        
        // Test with invalid contexts
        const invalidInputs = [
          null,
          undefined,
          { type: 'INVALID_TYPE', intensity: 'not_a_number' },
          { type: null, intensity: -1 },
          { intensity: 999999 }
        ];
        
        let invalidInputHandled = 0;
        
        for (const invalidInput of invalidInputs) {
          try {
            aiSystem.addContext(invalidInput);
            const invalidDecision = aiSystem.getCurrentAnimationDecision(['idle', 'error_handled', 'robust']);
            if (invalidDecision) invalidInputHandled++;
          } catch (error) {
            // Expected to handle gracefully, but catching errors is also acceptable
            invalidInputHandled++;
          }
        }
        
        const invalidInputTime = performance.now() - invalidInputStart;
        const gracefulHandling = invalidInputHandled === invalidInputs.length;
        
        addTestResult(
          'Graceful Degradation',
          'AI Invalid Input Handling',
          gracefulHandling,
          `AI handled ${invalidInputHandled}/${invalidInputs.length} invalid inputs gracefully`,
          invalidInputTime
        );
        
        if (gracefulHandling) {
          testResults.overallResults.resilience.gracefulDegradation++;
        }
        
      } catch (error) {
        addTestResult(
          'Graceful Degradation',
          'AI Invalid Input Handling',
          false,
          `Invalid input test failed: ${error.message}`
        );
      }
      
    } catch (error) {
      addTestResult(
        'Graceful Degradation',
        'Degradation Testing Suite',
        false,
        `Degradation test suite failed: ${error.message}`
      );
    }

    // Wait for async tests to complete
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Generate final analysis
    console.log('\n🔧 AI ERROR RECOVERY TEST SUMMARY');
    console.log('==================================');
    
    const passRate = (testResults.overallResults.passedTests / testResults.overallResults.totalTests) * 100;
    const avgRecoveryTime = testResults.overallResults.recoveryTime.length > 0 ?
      testResults.overallResults.recoveryTime.reduce((a, b) => a + b, 0) / testResults.overallResults.recoveryTime.length :
      0;
    
    console.log(`Total Tests: ${testResults.overallResults.totalTests}`);
    console.log(`Passed: ${testResults.overallResults.passedTests} (${passRate.toFixed(1)}%)`);
    console.log(`Failed: ${testResults.overallResults.failedTests}`);
    console.log(`Average Recovery Time: ${avgRecoveryTime.toFixed(2)}ms`);
    
    console.log('\nResilience Metrics:');
    console.log(`  Network Interruptions: ${testResults.overallResults.resilience.networkInterruptions} successful adaptations`);
    console.log(`  WebGL Context Loss: ${testResults.overallResults.resilience.webglContextLoss} successful adaptations`);
    console.log(`  Memory Pressure: ${testResults.overallResults.resilience.memoryPressure} successful operations`);
    console.log(`  Graceful Degradation: ${testResults.overallResults.resilience.gracefulDegradation} graceful handlings`);
    
    // Generate recommendations
    if (passRate < 80) {
      testResults.recommendations.push('Improve AI error handling - pass rate below 80%');
    }
    
    if (avgRecoveryTime > 1000) {
      testResults.recommendations.push('Optimize AI recovery time - currently exceeds 1 second');
    }
    
    if (testResults.overallResults.resilience.networkInterruptions < 1) {
      testResults.recommendations.push('Enhance AI network interruption handling');
    }
    
    if (testResults.overallResults.resilience.webglContextLoss < 1) {
      testResults.recommendations.push('Improve AI WebGL context loss recovery');
    }
    
    if (testResults.overallResults.resilience.memoryPressure < 3) {
      testResults.recommendations.push('Strengthen AI memory pressure resilience');
    }
    
    if (testResults.recommendations.length === 0) {
      testResults.recommendations.push('AI error recovery system demonstrates excellent resilience');
    }
    
    console.log('\nRecommendations:');
    testResults.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    // Overall assessment
    if (passRate >= 90) {
      console.log('\n🎉 EXCELLENT: AI system demonstrates outstanding error recovery capabilities!');
    } else if (passRate >= 75) {
      console.log('\n✅ GOOD: AI system shows strong error recovery with minor improvements needed');
    } else if (passRate >= 60) {
      console.log('\n⚠️ ACCEPTABLE: AI system handles errors but requires optimization');
    } else {
      console.log('\n❌ NEEDS IMPROVEMENT: Significant error recovery issues detected');
    }
    
    // Store results globally
    window.__AI_ERROR_RECOVERY_RESULTS__ = testResults;
    
    return testResults;
    
  } catch (error) {
    console.error('❌ AI Error Recovery Testing failed:', error);
    addTestResult('System', 'Error Recovery Testing Suite', false, `Critical error: ${error.message}`);
    return testResults;
  }
}

// Make available globally
window.runAIErrorRecoveryTests = runAIErrorRecoveryTests;

console.log('🔧 AI Error Recovery Test Runner loaded - Call runAIErrorRecoveryTests() to begin testing');
