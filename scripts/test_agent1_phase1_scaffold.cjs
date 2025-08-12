#!/usr/bin/env node
/**
 * Agent 1 - Phase 1 Scaffold Validator (Node.js)
 * Verifies new files and essential exports exist.
 */

const fs = require('fs')

function assertFile(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing file: ${path}`)
}

function assertContains(path, needles) {
  const content = fs.readFileSync(path, 'utf8')
  for (const needle of needles) {
    if (!content.includes(needle)) throw new Error(`Missing symbol '${needle}' in ${path}`)
  }
}

function main() {
  const checks = []
  try {
    // PersonalitySystem
    assertFile('src/core/PersonalitySystem.tsx')
    assertContains('src/core/PersonalitySystem.tsx', [
      'export enum PersonalityPresetId',
      'export enum MoodId',
      'export class PersonalitySystem',
      'suggestAnimations('
    ])

    // EnvironmentAwareness
    assertFile('src/core/EnvironmentAwareness.tsx')
    assertContains('src/core/EnvironmentAwareness.tsx', [
      'export class EnvironmentAwareness',
      'recordInteraction(',
      'getSnapshot('
    ])

    // AIBehaviorTree
    assertFile('src/core/AIBehaviorTree.tsx')
    assertContains('src/core/AIBehaviorTree.tsx', [
      'export class BehaviorTree',
      'export class SelectorNode',
      'export class SequenceNode',
      'export class ActionNode'
    ])

    console.log('✅ Agent 1 Phase 1 scaffold: OK')
    process.exit(0)
  } catch (err) {
    console.error('❌ Agent 1 Phase 1 scaffold: FAILED')
    console.error(String(err.message || err))
    process.exit(1)
  }
}

if (require.main === module) main()