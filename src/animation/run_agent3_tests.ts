/**
 * Agent 3 - Animation Testing Runner
 * 
 * Executes animation system tests and generates reports
 */

import { SimpleAnimationTester } from './agent3_simple_testing.ts'

// Run the animation tests
console.log('🎭 Agent 3 - Starting Animation Systems Testing...\n')

const tester = new SimpleAnimationTester()
const results = tester.runAllTests()
const report = tester.generateReport()

// Output the report
console.log('\n' + report)

// Save the report to a file
import { writeFileSync } from 'fs'
import { join } from 'path'

const reportPath = join(__dirname, '../../coordination/AGENT_3_ANIMATION_TESTING_REPORT.md')
writeFileSync(reportPath, report)

console.log(`📄 Test report saved to: ${reportPath}`)

// Exit with appropriate code
const failedTests = results.filter(result => result.status === 'FAIL').length
process.exit(failedTests === 0 ? 0 : 1)
