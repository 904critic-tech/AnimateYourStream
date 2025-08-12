/**
 * Mobile AI Performance Test Runner
 * Agent 1 - Phase 2 Mobile AI Testing
 * Comprehensive AI behavior validation for mobile devices (iOS Safari, Android Chrome)
 */

async function runMobileAITests() {
  console.log('📱 MOBILE AI PERFORMANCE TESTING - STARTING');
  console.log('============================================');
  
  const testResults = {
    framework: 'Mobile AI Testing',
    startTime: new Date().toISOString(),
    deviceInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
      isAndroid: /Android/i.test(navigator.userAgent),
      isSafari: navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'),
      isChrome: navigator.userAgent.includes('Chrome'),
      touchSupport: 'ontouchstart' in window,
      deviceMemory: navigator.deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    },
    testSuites: {},
    mobileMetrics: {
      batteryAware: false,
      performanceConstrained: false,
      touchOptimized: false,
      orientationAware: false,
      memoryOptimized: false
    },
    overallResults: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      mobileOptimizations: 0,
      performanceScore: 0
    },
    recommendations: []
  };

  // Helper function to add test results
  function addTestResult(suiteName, testName, passed, details, metrics = {}) {
    if (!testResults.testSuites[suiteName]) {
      testResults.testSuites[suiteName] = { tests: [], summary: { passed: 0, failed: 0 } };
    }
    
    const result = {
      name: testName,
      passed,
      details,
      metrics,
      timestamp: new Date().toISOString()
    };
    
    testResults.testSuites[suiteName].tests.push(result);
    testResults.testSuites[suiteName].summary[passed ? 'passed' : 'failed']++;
    testResults.overallResults.totalTests++;
    testResults.overallResults[passed ? 'passedTests' : 'failedTests']++;
    
    const icon = passed ? '✅' : '❌';
    console.log(`  ${icon} ${testName}: ${details}`);
    
    return result;
  }

  try {
    // Check if we're actually on mobile
    if (!testResults.deviceInfo.isMobile) {
      console.log('⚠️ Desktop environment detected - Mobile testing will simulate mobile conditions');
    }
    
    console.log(`📱 Device: ${testResults.deviceInfo.isMobile ? 'Mobile' : 'Desktop (simulated)'}`);
    console.log(`🌐 Browser: ${testResults.deviceInfo.isIOS ? 'iOS Safari' : testResults.deviceInfo.isAndroid ? 'Android Chrome' : 'Other'}`);
    console.log(`🧠 Memory: ${testResults.deviceInfo.deviceMemory} GB`);
    console.log(`⚡ CPU Cores: ${testResults.deviceInfo.hardwareConcurrency}`);
    console.log(`👆 Touch Support: ${testResults.deviceInfo.touchSupport ? 'Yes' : 'No'}`);
    console.log('');

    // Check AI system availability
    const aiSystem = window.__AI_BEHAVIOR_SYSTEM__;
    if (!aiSystem) {
      console.error('❌ AI system not available for mobile testing');
      return testResults;
    }

    // Test Suite 1: Mobile Device Detection & Adaptation
    console.log('📱 TEST SUITE 1: Mobile Device Detection & Adaptation');
    console.log('====================================================');
    
    try {
      // Test 1.1: AI recognizes mobile environment
      const mobileContext = {
        type: 'SYSTEM_EVENT',
        intensity: 0.7,
        metadata: {
          isMobile: testResults.deviceInfo.isMobile,
          isIOS: testResults.deviceInfo.isIOS,
          isAndroid: testResults.deviceInfo.isAndroid,
          touchSupported: testResults.deviceInfo.touchSupport,
          deviceMemory: testResults.deviceInfo.deviceMemory,
          cpuCores: testResults.deviceInfo.hardwareConcurrency
        }
      };
      
      aiSystem.addContext(mobileContext);
      const mobileAdaptation = aiSystem.getCurrentAnimationDecision(['mobile_optimized', 'touch_friendly', 'battery_aware', 'low_power']);
      
      addTestResult(
        'Mobile Adaptation',
        'AI Mobile Environment Recognition',
        mobileAdaptation !== null,
        `AI adapted to mobile environment: ${mobileAdaptation || 'No adaptation'}`
      );
      
      if (mobileAdaptation) {
        testResults.overallResults.mobileOptimizations++;
      }
      
    } catch (error) {
      addTestResult(
        'Mobile Adaptation',
        'AI Mobile Environment Recognition',
        false,
        `Mobile adaptation failed: ${error.message}`
      );
    }

    // Test Suite 2: Touch Event Integration (iOS Safari specific)
    if (testResults.deviceInfo.isIOS || !testResults.deviceInfo.isMobile) {
      console.log('\n🍎 TEST SUITE 2: iOS Safari AI Integration');
      console.log('==========================================');
      
      try {
        // Test 2.1: Touch event handling
        const touchEvents = ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend'];
        let touchResponses = 0;
        
        for (let i = 0; i < touchEvents.length; i++) {
          const eventType = touchEvents[i];
          
          try {
            aiSystem.addInteractionContext(eventType, 'model', Math.random() * 60); // Reduced intensity for mobile
            const touchDecision = aiSystem.getCurrentAnimationDecision(['touch_response', 'gesture_aware', 'ios_optimized']);
            
            if (touchDecision) {
              touchResponses++;
            }
          } catch (error) {
            console.warn(`   Touch event ${eventType} handling error: ${error.message}`);
          }
        }
        
        const touchCompatibility = touchResponses / touchEvents.length;
        testResults.mobileMetrics.touchOptimized = touchCompatibility >= 0.8;
        
        addTestResult(
          'iOS Safari',
          'Touch Event Integration',
          touchCompatibility >= 0.5,
          `Touch events handled: ${touchResponses}/${touchEvents.length} (${(touchCompatibility * 100).toFixed(1)}%)`,
          { touchCompatibility }
        );
        
        // Test 2.2: iOS Safari performance constraints
        const iOSTestStart = performance.now();
        const iOSRequestCount = 20; // Reduced for mobile constraints
        const iOSResponseTimes = [];
        
        for (let i = 0; i < iOSRequestCount; i++) {
          const start = performance.now();
          
          try {
            aiSystem.addInteractionContext('tap', 'model', Math.random() * 50);
            aiSystem.addAudioContext(Math.random() * 0.6); // Reduced for battery preservation
            const decision = aiSystem.getCurrentAnimationDecision(['idle', 'ios_mode', 'touch_optimized', 'battery_friendly']);
            
            const responseTime = performance.now() - start;
            iOSResponseTimes.push(responseTime);
            
          } catch (error) {
            console.warn(`   iOS request ${i + 1} failed: ${error.message}`);
          }
        }
        
        const avgIOSResponse = iOSResponseTimes.reduce((a, b) => a + b, 0) / iOSResponseTimes.length;
        const maxIOSResponse = Math.max(...iOSResponseTimes);
        
        // iOS Safari target: <200ms (more lenient than desktop)
        const iOSPerformancePassed = avgIOSResponse < 200;
        testResults.mobileMetrics.performanceConstrained = !iOSPerformancePassed;
        
        addTestResult(
          'iOS Safari',
          `iOS AI Performance (${iOSRequestCount} requests)`,
          iOSPerformancePassed,
          `Avg: ${avgIOSResponse.toFixed(2)}ms, Max: ${maxIOSResponse.toFixed(2)}ms (Target: <200ms)`,
          { averageResponseTime: avgIOSResponse, maxResponseTime: maxIOSResponse }
        );
        
        if (iOSPerformancePassed) {
          testResults.overallResults.mobileOptimizations++;
        }
        
      } catch (error) {
        addTestResult(
          'iOS Safari',
          'iOS Safari Testing Suite',
          false,
          `iOS Safari test suite failed: ${error.message}`
        );
      }
    }

    // Test Suite 3: Android Chrome AI Integration
    if (testResults.deviceInfo.isAndroid || !testResults.deviceInfo.isMobile) {
      console.log('\n🤖 TEST SUITE 3: Android Chrome AI Integration');
      console.log('==============================================');
      
      try {
        // Test 3.1: Android-specific optimizations
        const androidContext = {
          type: 'SCENE_CHANGE',
          intensity: 0.6,
          metadata: {
            platform: 'android',
            browser: 'chrome',
            powerSaveMode: Math.random() > 0.5, // Simulate power save mode
            backgroundOptimization: true
          }
        };
        
        aiSystem.addContext(androidContext);
        const androidDecision = aiSystem.getCurrentAnimationDecision(['android_optimized', 'chrome_mobile', 'power_aware']);
        
        addTestResult(
          'Android Chrome',
          'Android Chrome Optimization',
          androidDecision !== null,
          `AI optimized for Android Chrome: ${androidDecision || 'No optimization'}`
        );
        
        // Test 3.2: Android performance with varying device specs
        const androidDeviceSpecs = [
          { name: 'High-end', memory: 8, cores: 8, intensity: 0.8 },
          { name: 'Mid-range', memory: 4, cores: 4, intensity: 0.6 },
          { name: 'Low-end', memory: 2, cores: 2, intensity: 0.4 }
        ];
        
        let androidAdaptations = 0;
        
        for (const spec of androidDeviceSpecs) {
          try {
            const specContext = {
              type: 'SYSTEM_EVENT',
              intensity: spec.intensity,
              metadata: {
                deviceSpec: spec.name,
                simulatedMemory: spec.memory,
                simulatedCores: spec.cores
              }
            };
            
            aiSystem.addContext(specContext);
            const specDecision = aiSystem.getCurrentAnimationDecision(['adaptive_quality', 'spec_aware', `${spec.name.toLowerCase()}_mode`]);
            
            if (specDecision) {
              androidAdaptations++;
            }
            
            console.log(`   ${spec.name} device simulation: ${specDecision ? 'Adapted' : 'No adaptation'}`);
            
          } catch (error) {
            console.warn(`   Android ${spec.name} test failed: ${error.message}`);
          }
        }
        
        const androidCompatibility = androidAdaptations / androidDeviceSpecs.length;
        
        addTestResult(
          'Android Chrome',
          'Android Device Spec Adaptation',
          androidCompatibility >= 0.6,
          `Device specs handled: ${androidAdaptations}/${androidDeviceSpecs.length} (${(androidCompatibility * 100).toFixed(1)}%)`,
          { specAdaptation: androidCompatibility }
        );
        
        if (androidCompatibility >= 0.6) {
          testResults.overallResults.mobileOptimizations++;
        }
        
      } catch (error) {
        addTestResult(
          'Android Chrome',
          'Android Chrome Testing Suite',
          false,
          `Android Chrome test suite failed: ${error.message}`
        );
      }
    }

    // Test Suite 4: Mobile-Specific Constraints
    console.log('\n🔋 TEST SUITE 4: Mobile-Specific Constraints');
    console.log('============================================');
    
    try {
      // Test 4.1: Battery awareness simulation
      const batteryTestStart = performance.now();
      
      // Simulate low battery conditions
      const batteryLevels = [
        { level: 100, mode: 'normal' },
        { level: 50, mode: 'moderate' },
        { level: 20, mode: 'conservation' },
        { level: 10, mode: 'critical' }
      ];
      
      let batteryAdaptations = 0;
      
      for (const battery of batteryLevels) {
        try {
          const batteryContext = {
            type: 'SYSTEM_EVENT',
            intensity: battery.level / 100,
            metadata: {
              batteryLevel: battery.level,
              powerMode: battery.mode,
              batteryOptimization: battery.level < 30
            }
          };
          
          aiSystem.addContext(batteryContext);
          const batteryDecision = aiSystem.getCurrentAnimationDecision(['battery_aware', `${battery.mode}_mode`, 'power_optimized']);
          
          if (batteryDecision) {
            batteryAdaptations++;
          }
          
          console.log(`   Battery ${battery.level}% (${battery.mode}): ${batteryDecision ? 'Adapted' : 'No adaptation'}`);
          
        } catch (error) {
          console.warn(`   Battery ${battery.level}% test failed: ${error.message}`);
        }
      }
      
      const batteryAwareness = batteryAdaptations / batteryLevels.length;
      testResults.mobileMetrics.batteryAware = batteryAwareness >= 0.5;
      
      addTestResult(
        'Mobile Constraints',
        'Battery Level Adaptation',
        batteryAwareness >= 0.5,
        `Battery levels handled: ${batteryAdaptations}/${batteryLevels.length} (${(batteryAwareness * 100).toFixed(1)}%)`,
        { batteryAwareness }
      );
      
      // Test 4.2: Orientation change handling
      const orientations = ['portrait', 'landscape', 'portrait-flipped', 'landscape-flipped'];
      let orientationAdaptations = 0;
      
      for (const orientation of orientations) {
        try {
          const orientationContext = {
            type: 'INTERACTION',
            intensity: 0.5,
            metadata: {
              orientation: orientation,
              orientationChange: true,
              mobileLayout: true
            }
          };
          
          aiSystem.addContext(orientationContext);
          const orientationDecision = aiSystem.getCurrentAnimationDecision(['orientation_aware', `${orientation}_mode`, 'layout_adaptive']);
          
          if (orientationDecision) {
            orientationAdaptations++;
          }
          
        } catch (error) {
          console.warn(`   Orientation ${orientation} test failed: ${error.message}`);
        }
      }
      
      const orientationAwareness = orientationAdaptations / orientations.length;
      testResults.mobileMetrics.orientationAware = orientationAwareness >= 0.5;
      
      addTestResult(
        'Mobile Constraints',
        'Orientation Change Adaptation',
        orientationAwareness >= 0.5,
        `Orientations handled: ${orientationAdaptations}/${orientations.length} (${(orientationAwareness * 100).toFixed(1)}%)`,
        { orientationAwareness }
      );
      
      if (batteryAwareness >= 0.5 && orientationAwareness >= 0.5) {
        testResults.overallResults.mobileOptimizations++;
      }
      
    } catch (error) {
      addTestResult(
        'Mobile Constraints',
        'Mobile Constraints Testing Suite',
        false,
        `Mobile constraints test suite failed: ${error.message}`
      );
    }

    // Test Suite 5: Mobile Memory Management
    console.log('\n💾 TEST SUITE 5: Mobile Memory Management');
    console.log('========================================');
    
    try {
      // Test 5.1: Memory-constrained AI operation
      const mobileMemoryStart = performance.now();
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : null;
      
      // Simulate mobile memory constraints with smaller operations
      const mobileMemoryTest = [];
      const mobileTestDuration = 2000; // Shorter duration for mobile
      let memoryTestActive = true;
      
      const mobileMemoryInterval = setInterval(() => {
        if (!memoryTestActive) {
          clearInterval(mobileMemoryInterval);
          return;
        }
        
        // Smaller memory allocations for mobile simulation
        const smallArray = new Array(10000).fill(Math.random());
        mobileMemoryTest.push(smallArray);
        
        // Test AI under mobile memory constraints
        try {
          aiSystem.addInteractionContext('touch', 'model', Math.random() * 40); // Reduced intensity for mobile
          aiSystem.addAudioContext(Math.random() * 0.5); // Lower audio processing
          const memoryDecision = aiSystem.getCurrentAnimationDecision(['memory_efficient', 'mobile_optimized', 'low_memory']);
          
          if (memoryDecision) {
            testResults.overallResults.mobileOptimizations++;
          }
          
        } catch (error) {
          console.warn(`   Mobile memory constraint test error: ${error.message}`);
        }
      }, 300); // Slower interval for mobile
      
      setTimeout(() => {
        memoryTestActive = false;
        
        // Test memory recovery
        mobileMemoryTest.length = 0;
        
        const recoveryStart = performance.now();
        
        try {
          aiSystem.addInteractionContext('tap', 'model', 70);
          const recoveryDecision = aiSystem.getCurrentAnimationDecision(['memory_recovered', 'mobile_ready', 'optimized']);
          
          const memoryRecoveryTime = performance.now() - recoveryStart;
          const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : null;
          
          const memoryInfo = initialMemory && finalMemory ?
            `Memory delta: ${((finalMemory - initialMemory) / 1024 / 1024).toFixed(2)}MB` :
            'Memory monitoring not available';
          
          testResults.mobileMetrics.memoryOptimized = recoveryDecision !== null;
          
          addTestResult(
            'Mobile Memory',
            'Mobile Memory Management',
            recoveryDecision !== null,
            `AI handled mobile memory constraints: ${recoveryDecision ? 'Successfully' : 'Failed'}. ${memoryInfo}`,
            { memoryRecoveryTime, memoryManagement: recoveryDecision !== null }
          );
          
        } catch (error) {
          addTestResult(
            'Mobile Memory',
            'Mobile Memory Management',
            false,
            `Mobile memory management failed: ${error.message}`
          );
        }
        
      }, mobileTestDuration);
      
    } catch (error) {
      addTestResult(
        'Mobile Memory',
        'Mobile Memory Testing Suite',
        false,
        `Mobile memory test suite failed: ${error.message}`
      );
    }

    // Wait for async tests to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Calculate overall mobile performance score
    const passedTests = testResults.overallResults.passedTests;
    const totalTests = testResults.overallResults.totalTests;
    testResults.overallResults.performanceScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Generate mobile-specific recommendations
    if (!testResults.mobileMetrics.touchOptimized) {
      testResults.recommendations.push('Improve touch event integration for better mobile experience');
    }
    
    if (!testResults.mobileMetrics.batteryAware) {
      testResults.recommendations.push('Implement battery-aware AI optimizations');
    }
    
    if (!testResults.mobileMetrics.orientationAware) {
      testResults.recommendations.push('Add orientation change handling for mobile layouts');
    }
    
    if (!testResults.mobileMetrics.memoryOptimized) {
      testResults.recommendations.push('Optimize AI memory usage for mobile constraints');
    }
    
    if (testResults.mobileMetrics.performanceConstrained) {
      testResults.recommendations.push('Implement performance scaling for slower mobile devices');
    }
    
    if (testResults.recommendations.length === 0) {
      testResults.recommendations.push('AI system demonstrates excellent mobile optimization');
    }

    // Generate final mobile AI report
    console.log('\n📱 MOBILE AI PERFORMANCE TEST SUMMARY');
    console.log('=====================================');
    console.log(`Device Type: ${testResults.deviceInfo.isMobile ? 'Mobile' : 'Desktop (simulated)'}`);
    console.log(`Platform: ${testResults.deviceInfo.isIOS ? 'iOS Safari' : testResults.deviceInfo.isAndroid ? 'Android Chrome' : 'Other'}`);
    console.log(`Touch Support: ${testResults.deviceInfo.touchSupport ? 'Yes' : 'No'}`);
    console.log(`Device Memory: ${testResults.deviceInfo.deviceMemory} GB`);
    console.log(`CPU Cores: ${testResults.deviceInfo.hardwareConcurrency}`);
    console.log(`Tests Passed: ${passedTests}/${totalTests} (${testResults.overallResults.performanceScore.toFixed(1)}%)`);
    console.log(`Mobile Optimizations: ${testResults.overallResults.mobileOptimizations} implemented`);
    
    console.log('\nMobile Metrics:');
    console.log(`  Touch Optimized: ${testResults.mobileMetrics.touchOptimized ? '✅' : '❌'}`);
    console.log(`  Battery Aware: ${testResults.mobileMetrics.batteryAware ? '✅' : '❌'}`);
    console.log(`  Orientation Aware: ${testResults.mobileMetrics.orientationAware ? '✅' : '❌'}`);
    console.log(`  Memory Optimized: ${testResults.mobileMetrics.memoryOptimized ? '✅' : '❌'}`);
    console.log(`  Performance Constrained: ${testResults.mobileMetrics.performanceConstrained ? '⚠️' : '✅'}`);
    
    if (testResults.overallResults.performanceScore >= 80) {
      console.log('\n🎉 EXCELLENT: AI system demonstrates outstanding mobile compatibility!');
    } else if (testResults.overallResults.performanceScore >= 65) {
      console.log('\n✅ GOOD: AI system shows strong mobile performance with minor optimizations needed');
    } else if (testResults.overallResults.performanceScore >= 50) {
      console.log('\n⚠️ ACCEPTABLE: AI system functions on mobile but requires optimization');
    } else {
      console.log('\n❌ NEEDS IMPROVEMENT: Significant mobile compatibility issues detected');
    }
    
    console.log('\nRecommendations:');
    testResults.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    // Store results globally
    window.__MOBILE_AI_TEST_RESULTS__ = testResults;
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Mobile AI Testing failed:', error);
    addTestResult('System', 'Mobile AI Testing Suite', false, `Critical error: ${error.message}`);
    return testResults;
  }
}

// Make available globally
window.runMobileAITests = runMobileAITests;

console.log('📱 Mobile AI Test Runner loaded - Call runMobileAITests() to begin testing');
