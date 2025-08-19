/**
 * 🎭 Agent 3 - Mixamo Animation System Test
 * 
 * This file tests the new Mixamo-compatible animation system to ensure it's working properly
 * after the implementation of Mixamo's proven animation architecture.
 */

export function testMixamoAnimationSystem() {
  console.log('🎭 Agent 3: Testing Mixamo animation system...')
  
  // Check if Mixamo animation system is available
  const mixamoSystem = (window as any).__MIXAMO_ANIMATION_SYSTEM__
  if (!mixamoSystem) {
    console.error('🎭 Agent 3: Mixamo animation system not found in global scope')
    return false
  }
  
  console.log('🎭 Agent 3: Mixamo animation system found:', mixamoSystem)
  
  // Check available layers
  const layers = mixamoSystem.getLayers()
  console.log('🎭 Agent 3: Available layers:', Array.from(layers.keys()))
  
  // Check auto-rigger
  const autoRigger = mixamoSystem.getAutoRigger()
  if (autoRigger) {
    console.log('🎭 Agent 3: Auto-rigger found:', autoRigger)
    const chains = autoRigger.getChains()
    console.log('🎭 Agent 3: Auto-rigger chains:', Array.from(chains.keys()))
  } else {
    console.warn('🎭 Agent 3: Auto-rigger not found')
  }
  
  // Test Mixamo animation methods
  const methods = [
    'blendToAnimation',
    'addAdditiveLayer',
    'removeAdditiveLayer',
    'setAnimationTimeScale',
    'isAnimationPlaying',
    'getAnimationTime',
    'getAnimationWeight'
  ]
  
  for (const method of methods) {
    if (typeof mixamoSystem[method] === 'function') {
      console.log(`✅ ${method} method available`)
    } else {
      console.error(`❌ ${method} method missing`)
      return false
    }
  }
  
  // Test animation transitions
  const transitions = mixamoSystem.getTransitions()
  console.log('🎭 Agent 3: Available transitions:', Array.from(transitions.keys()))
  
  // Test with specific animations if available
  const availableAnimations = Array.from(layers.keys())
  if (availableAnimations.length > 0) {
    console.log('🎭 Agent 3: Testing with available animations:', availableAnimations)
    
    // Test first animation
    const firstAnimation = availableAnimations[0]
    console.log(`🎭 Agent 3: Testing animation: ${firstAnimation}`)
    
    // Check if animation is playing
    const isPlaying = mixamoSystem.isAnimationPlaying(firstAnimation)
    console.log(`🎭 Agent 3: Animation ${firstAnimation} playing:`, isPlaying)
    
    // Get animation time
    const animationTime = mixamoSystem.getAnimationTime(firstAnimation)
    console.log(`🎭 Agent 3: Animation ${firstAnimation} time:`, animationTime)
    
    // Get animation weight
    const animationWeight = mixamoSystem.getAnimationWeight(firstAnimation)
    console.log(`🎭 Agent 3: Animation ${firstAnimation} weight:`, animationWeight)
  }
  
  console.log('🎭 Agent 3: Mixamo animation system test passed!')
  return true
}

// Auto-run test if this file is loaded
if (typeof window !== 'undefined') {
  // Wait for the page to load and Mixamo system to initialize
  setTimeout(() => {
    testMixamoAnimationSystem()
  }, 3000)
}

export default testMixamoAnimationSystem
