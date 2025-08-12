/**
 * Character Loading Test - Agent 2
 * 
 * This test file helps debug the character loading issue where
 * "No character files found" error occurs.
 */

import { loadOptimizedFBX } from './fbxLoaderOptimizer'

export async function testCharacterLoading() {
  console.log('⚡ Agent 2: Starting character loading test...')
  
  const testUrl = '/models/Default_Model.fbx'
  
  try {
    console.log(`⚡ Agent 2: Testing character loading for: ${testUrl}`)
    
    // Test the optimized FBX loader
    const result = await loadOptimizedFBX(testUrl, (progress) => {
      console.log(`⚡ Agent 2: Loading progress: ${progress.percentage.toFixed(1)}% - ${progress.message}`)
    })
    
    console.log('⚡ Agent 2: Character loading test SUCCESS!')
    console.log('⚡ Agent 2: Loaded model:', result.model)
    console.log('⚡ Agent 2: Animations count:', result.animations.length)
    console.log('⚡ Agent 2: Has mixer:', !!result.mixer)
    console.log('⚡ Agent 2: Loading time:', result.loadingTime)
    
    return {
      success: true,
      model: result.model,
      animations: result.animations,
      mixer: result.mixer,
      loadingTime: result.loadingTime
    }
    
  } catch (error) {
    console.error('⚡ Agent 2: Character loading test FAILED:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function testFileAccess() {
  console.log('⚡ Agent 2: Testing file access...')
  
  const testUrl = '/models/Default_Model.fbx'
  
  try {
    // Test if the file is accessible via fetch
    const response = await fetch(testUrl, { method: 'HEAD' })
    
    if (response.ok) {
      console.log('⚡ Agent 2: File access test SUCCESS - file exists and is accessible')
      console.log('⚡ Agent 2: Content-Length:', response.headers.get('content-length'))
      console.log('⚡ Agent 2: Content-Type:', response.headers.get('content-type'))
      return { success: true, status: response.status }
    } else {
      console.error('⚡ Agent 2: File access test FAILED - file not found or not accessible')
      return { success: false, status: response.status, error: 'File not accessible' }
    }
    
  } catch (error) {
    console.error('⚡ Agent 2: File access test FAILED with error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function runCharacterLoadingDiagnostics() {
  console.log('⚡ Agent 2: Running character loading diagnostics...')
  
  // Test 1: File access
  const fileAccessResult = await testFileAccess()
  console.log('⚡ Agent 2: File access result:', fileAccessResult)
  
  if (!fileAccessResult.success) {
    console.error('⚡ Agent 2: File access failed - this is the root cause!')
    return fileAccessResult
  }
  
  // Test 2: Character loading
  const loadingResult = await testCharacterLoading()
  console.log('⚡ Agent 2: Character loading result:', loadingResult)
  
  return {
    fileAccess: fileAccessResult,
    characterLoading: loadingResult,
    overallSuccess: fileAccessResult.success && loadingResult.success
  }
}
