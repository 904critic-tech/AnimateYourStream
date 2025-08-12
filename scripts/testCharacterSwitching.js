/**
 * Character Switching Test Runner
 * 
 * Agent 2 - Performance Optimization Team
 * Validates character switching fixes
 */

const { testCharacterSwitching, checkForIllegalInvocationErrors } = require('../src/utils/characterSwitchingTest.ts')

async function runCharacterSwitchingTests() {
  console.log('🚀 Agent 2: Starting Character Switching Validation...')
  console.log('=' .repeat(60))
  
  try {
    // Quick check for existing errors
    console.log('🔍 Checking for existing illegal invocation errors...')
    const hasErrors = checkForIllegalInvocationErrors()
    
    if (hasErrors) {
      console.log('⚠️  Found existing illegal invocation errors')
    } else {
      console.log('✅ No existing illegal invocation errors found')
    }
    
    // Run comprehensive tests
    console.log('\n🧪 Running character switching test suite...')
    const results = await testCharacterSwitching()
    
    // Display results
    console.log('\n📊 Test Results:')
    console.log('=' .repeat(40))
    console.log(`✅ Success: ${results.success}`)
    console.log(`❌ Errors: ${results.errors.length}`)
    console.log(`⚠️  Warnings: ${results.warnings.length}`)
    console.log(`⚡ Max Switch Time: ${results.performance.switchTime.toFixed(2)}ms`)
    console.log(`🎭 Characters Tested: ${results.details.charactersTested.length}`)
    console.log(`📁 Uploads Tested: ${results.details.uploadsTested}`)
    console.log(`🔄 Total Switches: ${results.details.totalSwitches}`)
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors Found:')
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      results.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`)
      })
    }
    
    // Final status
    console.log('\n🎯 Final Status:')
    if (results.success) {
      console.log('✅ CHARACTER SWITCHING FIXES VALIDATED - No illegal invocation errors detected')
    } else {
      console.log('❌ CHARACTER SWITCHING ISSUES REMAIN - Illegal invocation errors still present')
    }
    
    return results.success
    
  } catch (error) {
    console.error('💥 Test runner failed:', error)
    return false
  }
}

// Run tests if called directly
if (require.main === module) {
  runCharacterSwitchingTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Test runner crashed:', error)
      process.exit(1)
    })
}

module.exports = { runCharacterSwitchingTests }
