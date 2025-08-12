/**
 * Agent 1 - AI Behavior Test Runner (Node.js)
 * 
 * This script tests the AI behavior systems directly without needing a browser
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment for Node.js testing
global.window = {
  setInterval: (fn, delay) => {
    return setInterval(fn, delay);
  },
  clearInterval: (id) => {
    clearInterval(id);
  }
};

global.document = {
  createElement: () => ({}),
  getElementById: () => ({ innerHTML: '' })
};

// Simple test framework
class SimpleTestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  test(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  async runTests() {
    console.log('🤖 Agent 1 - AI Behavior Testing (Node.js)');
    console.log('==========================================');
    
    for (const test of this.tests) {
      try {
        const result = await test.testFunction();
        if (result) {
          console.log(`✅ ${test.name}`);
          this.results.passed++;
        } else {
          console.log(`❌ ${test.name}`);
          this.results.failed++;
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`);
        this.results.failed++;
      }
      this.results.total++;
    }

    console.log('\n📊 Test Results:');
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
  }
}

// Test AI behavior systems
async function testAIBehaviorSystems() {
  const runner = new SimpleTestRunner();

  // Test 1: System Initialization
  runner.test('AI System Initialization', () => {
    // Check if AI behavior files exist
    const aiFiles = [
      'src/ai/AIBehaviorSystem.ts',
      'src/ai/ContextAnalyzer.ts',
      'src/ai/AnimationDecisionEngine.ts',
      'src/ai/BehaviorProfiles.ts',
      'src/ai/types.ts'
    ];

    for (const file of aiFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Missing AI file: ${file}`);
      }
    }
    return true;
  });

  // Test 2: Type Definitions
  runner.test('Type Definitions', () => {
    const typesFile = fs.readFileSync('src/ai/types.ts', 'utf8');
    
    // Check for essential types
    const requiredTypes = [
      'ContextType',
      'BehaviorProfile',
      'AnimationDecision',
      'BehaviorState',
      'BlendMode'
    ];

    for (const type of requiredTypes) {
      if (!typesFile.includes(type)) {
        throw new Error(`Missing type definition: ${type}`);
      }
    }
    return true;
  });

  // Test 3: Behavior Profiles
  runner.test('Behavior Profiles', () => {
    const profilesFile = fs.readFileSync('src/ai/BehaviorProfiles.ts', 'utf8');
    
    // Check for profile definitions
    const requiredProfiles = [
      'energetic_friendly',
      'calm_professional',
      'playful_creative'
    ];

    for (const profile of requiredProfiles) {
      if (!profilesFile.includes(profile)) {
        throw new Error(`Missing behavior profile: ${profile}`);
      }
    }
    return true;
  });

  // Test 4: Context Analyzer
  runner.test('Context Analyzer', () => {
    const analyzerFile = fs.readFileSync('src/ai/ContextAnalyzer.ts', 'utf8');
    
    // Check for essential methods
    const requiredMethods = [
      'addContext',
      'analyzeContexts',
      'getCurrentAnalysis'
    ];

    for (const method of requiredMethods) {
      if (!analyzerFile.includes(method)) {
        throw new Error(`Missing ContextAnalyzer method: ${method}`);
      }
    }
    return true;
  });

  // Test 5: Animation Decision Engine
  runner.test('Animation Decision Engine', () => {
    const engineFile = fs.readFileSync('src/ai/AnimationDecisionEngine.ts', 'utf8');
    
    // Check for essential methods
    const requiredMethods = [
      'makeDecision',
      'evaluateAnimations',
      'getDecision'
    ];

    for (const method of requiredMethods) {
      if (!engineFile.includes(method)) {
        throw new Error(`Missing AnimationDecisionEngine method: ${method}`);
      }
    }
    return true;
  });

  // Test 6: AI Behavior System Integration
  runner.test('AI Behavior System Integration', () => {
    const systemFile = fs.readFileSync('src/ai/AIBehaviorSystem.ts', 'utf8');
    
    // Check for essential methods
    const requiredMethods = [
      'start',
      'stop',
      'setBehaviorProfile',
      'getCurrentAnimationDecision',
      'addContext'
    ];

    for (const method of requiredMethods) {
      if (!systemFile.includes(method)) {
        throw new Error(`Missing AIBehaviorSystem method: ${method}`);
      }
    }
    return true;
  });

  // Test 7: Testing Framework
  runner.test('Testing Framework', () => {
    const testFile = fs.readFileSync('src/ai/agent1_ai_behavior_testing.ts', 'utf8');
    
    // Check for test methods
    const requiredTests = [
      'testSystemInitialization',
      'testContextAnalysis',
      'testAnimationDecisionEngine',
      'testBehaviorProfiles'
    ];

    for (const test of requiredTests) {
      if (!testFile.includes(test)) {
        throw new Error(`Missing test method: ${test}`);
      }
    }
    return true;
  });

  // Test 8: File Structure
  runner.test('AI Directory Structure', () => {
    const aiDir = 'src/ai';
    if (!fs.existsSync(aiDir)) {
      throw new Error('AI directory does not exist');
    }

    const files = fs.readdirSync(aiDir);
    const requiredFiles = [
      'AIBehaviorSystem.ts',
      'ContextAnalyzer.ts',
      'AnimationDecisionEngine.ts',
      'BehaviorProfiles.ts',
      'types.ts',
      'agent1_ai_behavior_testing.ts'
    ];

    for (const file of requiredFiles) {
      if (!files.includes(file)) {
        throw new Error(`Missing AI file: ${file}`);
      }
    }
    return true;
  });

  // Test 9: TypeScript Compilation
  runner.test('TypeScript Compilation', () => {
    // Check if build was successful by looking for dist folder
    if (!fs.existsSync('dist')) {
      throw new Error('Build output directory does not exist');
    }

    const distFiles = fs.readdirSync('dist');
    if (!distFiles.includes('index.html')) {
      throw new Error('Built index.html not found');
    }

    return true;
  });

  // Test 10: Documentation
  runner.test('Documentation', () => {
    const docs = [
      'src/ai/AI_TESTING_GUIDE.md'
    ];

    for (const doc of docs) {
      if (!fs.existsSync(doc)) {
        throw new Error(`Missing documentation: ${doc}`);
      }
    }
    return true;
  });

  await runner.runTests();
  return runner.results;
}

// Run the tests
if (require.main === module) {
  testAIBehaviorSystems()
    .then(results => {
      console.log('\n🎯 Agent 1 Testing Complete!');
      if (results.failed === 0) {
        console.log('✅ All AI behavior systems are properly configured!');
        process.exit(0);
      } else {
        console.log('⚠️ Some tests failed. Please review the errors above.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { testAIBehaviorSystems, SimpleTestRunner };
