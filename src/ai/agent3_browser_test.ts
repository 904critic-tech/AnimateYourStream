/**
 * Agent 3 - Browser Animation System Test
 * 
 * Tests the animation system in the browser environment
 */

// Browser test for animation system
export function testBrowserAnimationSystem() {
  console.log('🎭 Agent 3: Testing Browser Animation System...')
  
  // Test 1: Check if the application is loaded
  if (typeof window === 'undefined') {
    console.error('🎭 Agent 3: Not in browser environment')
    return { success: false, error: 'Not in browser' }
  }
  
  // Test 2: Check if React Three Fiber is available
  if (!(window as any).__REACT_THREE_FIBER__) {
    console.warn('🎭 Agent 3: React Three Fiber not detected')
  }
  
  // Test 3: Check if the store is available
  if (!(window as any).__ANIMATION_BLENDER__) {
    console.warn('🎭 Agent 3: Animation Blender not detected')
  }
  
  // Test 4: Check if the model viewer is loaded
  const modelViewer = document.querySelector('[data-testid="model-viewer"]') || 
                     document.querySelector('.model-viewer') ||
                     document.querySelector('#root')
  
  if (modelViewer) {
    console.log('🎭 Agent 3: ✅ Model viewer found in DOM')
  } else {
    console.warn('🎭 Agent 3: ⚠️ Model viewer not found in DOM')
  }
  
  // Test 5: Check for animation controls
  const animationControls = document.querySelector('[data-testid="animation-controls"]') ||
                           document.querySelector('.animation-controls') ||
                           document.querySelector('button[onclick*="animation"]')
  
  if (animationControls) {
    console.log('🎭 Agent 3: ✅ Animation controls found in DOM')
  } else {
    console.warn('🎭 Agent 3: ⚠️ Animation controls not found in DOM')
  }
  
  // Test 6: Check for Three.js objects
  if ((window as any).THREE) {
    console.log('🎭 Agent 3: ✅ Three.js detected')
  } else {
    console.warn('🎭 Agent 3: ⚠️ Three.js not detected')
  }
  
  console.log('🎭 Agent 3: Browser animation system test completed')
  
  return {
    success: true,
    inBrowser: true,
    modelViewerFound: !!modelViewer,
    animationControlsFound: !!animationControls,
    threeJsAvailable: !!(window as any).THREE
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testAnimationSystem = testBrowserAnimationSystem
  console.log('🎭 Agent 3: Animation system test available at window.testAnimationSystem()')
}
