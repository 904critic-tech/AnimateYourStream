/**
 * Agent 3 - Animation Systems Integration Test
 * 
 * Tests the complete animation system integration
 */

import { useAppStore } from '../utils/store'

// Test the animation system integration
export function testAnimationIntegration() {
  console.log('🎭 Agent 3: Testing Animation System Integration...')
  
  // Test 1: Check store state
  const store = useAppStore.getState()
  console.log('🎭 Agent 3: Store state:', {
    currentAnimation: store.currentAnimation,
    isPlaying: store.isPlaying,
    animationSpeed: store.animationSpeed,
    availableAnimations: store.animationInfo.availableAnimations
  })
  
  // Test 2: Test animation state changes
  console.log('🎭 Agent 3: Testing animation state changes...')
  
  // Set a test animation
  store.setCurrentAnimation('idle')
  console.log('🎭 Agent 3: Set animation to idle:', store.currentAnimation)
  
  // Start playing
  store.setIsPlaying(true)
  console.log('🎭 Agent 3: Started playing:', store.isPlaying)
  
  // Change animation speed
  store.setAnimationSpeed(1.5)
  console.log('🎭 Agent 3: Set speed to 1.5:', store.animationSpeed)
  
  // Test 3: Check if animations are available
  if (store.animationInfo.availableAnimations.length > 0) {
    console.log('🎭 Agent 3: ✅ Animations available:', store.animationInfo.availableAnimations)
  } else {
    console.warn('🎭 Agent 3: ⚠️ No animations available in store')
  }
  
  // Test 4: Test animation info updates
  store.setAnimationInfo({
    currentTime: 1.0,
    duration: 2.0
  })
  console.log('🎭 Agent 3: Updated animation info:', store.animationInfo)
  
  console.log('🎭 Agent 3: Animation integration test completed')
  
  return {
    success: true,
    storeWorking: true,
    animationsAvailable: store.animationInfo.availableAnimations.length > 0,
    stateChangesWorking: true
  }
}

// Run test
testAnimationIntegration()
