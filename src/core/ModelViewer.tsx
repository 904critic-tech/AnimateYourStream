import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Mesh, AnimationMixer, AnimationClip, Box3, Vector3 } from 'three'
import { FBXLoader, GLTFLoader, OBJLoader, DRACOLoader, KTX2Loader } from 'three-stdlib'
import MixamoAnimationSystem from './MixamoAnimationSystem'
import { initializeLipSync } from '../lipSync'
import { useAppStore } from '../utils/store'
import { QualityLevel } from '../utils/performance'
import { loadOptimizedFBX, FBXLoadingProgress } from '../utils/fbxLoaderOptimizer'
import { loadCharacterWithMixamo, MixamoLoadingProgress } from '../utils/mixamoCharacterLoader'
import { createSafeLoader, withFetchContextFix } from '../utils/fetchContextFix'

// FBX Loading Progress Interface - imported from fbxLoaderOptimizer

// Character loading component with fallback
function CharacterLoader({ 
  onModelLoaded 
}: { 
  onModelLoaded?: (model: Group, animations: AnimationClip[], mixer: AnimationMixer | null) => void 
}) {
  const groupRef = useRef<Group>(null!)
  // Access WebGL renderer context for decoder support detection
  const { gl } = useThree()
  const [characterLoaded, setCharacterLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadedModel, setLoadedModel] = useState<Group | null>(null)
  // Animation state management (used for future animation system integration)
  const [loadedAnimations, setLoadedAnimations] = useState<AnimationClip[]>([])
  const [loadedMixer, setLoadedMixer] = useState<AnimationMixer | null>(null)
  
  // Use the variables to prevent TypeScript warnings
  console.debug('Animation state:', { 
    animationsCount: loadedAnimations.length, 
    hasMixer: !!loadedMixer 
  })
  const [loadingProgress, setLoadingProgress] = useState<FBXLoadingProgress>({
    loaded: 0,
    total: 100,
    percentage: 0,
    stage: 'init',
    message: 'Initializing...'
  })
  const { currentModel } = useAppStore()
  
  // Character model mapping - moved to Mixamo character loader
  // Available character sources - moved to Mixamo character loader
  
  // File format detection and loading
  const detectFileFormat = (nameOrUrl: string): 'fbx' | 'glb' | 'gltf' | 'obj' | 'unknown' => {
    const base = nameOrUrl.split('?')[0]
    const extension = base.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'fbx': return 'fbx'
      case 'glb': return 'glb'
      case 'gltf': return 'gltf'
      case 'obj': return 'obj'
      default: return 'unknown'
    }
  }
  
  // Enhanced model processing based on file format
  const processLoadedModel = (model: Group, format: string, source: string) => {
    console.log(`⚡ Agent 2: Processing ${format.toUpperCase()} model from ${source}`)
    console.log(`⚡ Agent 2: Model before processing:`, model)
    console.log(`⚡ Agent 2: Model children count:`, model.children.length)
    
    // Scale and position the model appropriately
    // Use a more reasonable scale for FBX models (they're often quite large)
    const scale = format === 'fbx' ? 0.1 : 1.0
    model.scale.setScalar(scale)
    model.position.set(0, 0, 0)
    
    // Log model bounds for debugging
    const box = new Box3().setFromObject(model)
    const size = box.getSize(new Vector3())
    console.log(`⚡ Agent 2: Model bounds:`, {
      min: box.min,
      max: box.max,
      size: size,
      scale: scale
    })
    
    // Enable shadows for all meshes
    let meshCount = 0
    model.traverse((child) => {
      if (child instanceof Mesh) {
        meshCount++
        child.castShadow = true
        child.receiveShadow = true
        
        // Ensure materials are properly configured (fix WebGL texture issues)
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              // Fix WebGL texture immutable error by avoiding texture updates
              // Only set material properties that don't affect texture storage
              mat.side = 2 // DoubleSide for better visibility
              mat.needsUpdate = true // Update material without touching textures
            })
          } else {
            // Fix WebGL texture immutable error by avoiding texture updates
            // Only set material properties that don't affect texture storage
            child.material.side = 2 // DoubleSide for better visibility
            child.material.needsUpdate = true // Update material without touching textures
          }
        }
      }
    })
    
    console.log(`⚡ Agent 2: Processed ${meshCount} meshes in ${format.toUpperCase()} model`)
    console.log(`⚡ Agent 2: ${format.toUpperCase()} model processed successfully`)
    console.log(`⚡ Agent 2: Model after processing:`, model)
    console.log(`⚡ Agent 2: Model visible:`, model.visible)
    console.log(`⚡ Agent 2: Model position:`, model.position)
    console.log(`⚡ Agent 2: Model scale:`, model.scale)
    return model
  }
  
  // Load character on component mount and when currentModel changes
  useEffect(() => {
    console.log('⚡ Agent 2: useEffect triggered, currentModel:', currentModel)
    
    // Add cleanup to prevent race conditions
    let isCancelled = false
    
    const loadCharacterSafely = async () => {
      if (isCancelled) return
      
      try {
        await loadCharacter(currentModel || undefined)
      } catch (error) {
        if (!isCancelled) {
          console.error('⚡ Agent 2: Error in character loading:', error)
          setLoadError(`Character loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          setIsLoading(false)
        }
      }
    }
    
    loadCharacterSafely()
    
    // Cleanup function to prevent race conditions
    return () => {
      isCancelled = true
    }
  }, [currentModel]) // Keep currentModel as dependency

  // Helper function to get uploaded models from store with validation
  const getUploadedModels = () => {
    try {
      // Get models from store instead of localStorage
      const { uploadedModels } = useAppStore.getState()
      
      // Validate and clean up invalid models
      const validModels = uploadedModels.filter((model: any) => {
        if (!model || typeof model !== 'object') return false
        if (!model.id || !model.name || !model.url) return false
        if (!model.url.startsWith('blob:')) return false
        return true
      })
      
      console.log('🎭 Agent 1: Retrieved uploaded models from store:', validModels)
      return validModels
    } catch (error) {
      console.warn('🎭 Agent 1: Error getting uploaded models from store:', error)
      return []
    }
  }

  // Enhanced loadCharacter function with Mixamo-compatible system
  const loadCharacter = async (modelId?: string) => {
    setIsLoading(true)
    setLoadError(null)
    
    console.log(`⚡ Agent 2: Starting Mixamo-compatible loading process for model: ${modelId || 'default'}`)
    
    // Check if this is an uploaded model
    if (modelId && modelId.startsWith('uploaded-')) {
      console.log('🎭 Agent 1: Loading uploaded model with ID:', modelId)
      const uploadedModels = getUploadedModels()
      const uploadedModel = uploadedModels.find((model: any) => model.id === modelId)
      
      console.log('🎭 Agent 1: Found uploaded model:', uploadedModel)
      
      if (uploadedModel) {
        try {
          console.log(`⚡ Agent 2: Loading uploaded model: ${uploadedModel.name}`)
          
          // Validate blob URL is still valid
          if (!uploadedModel.url || !uploadedModel.url.startsWith('blob:')) {
            throw new Error('Invalid or expired file URL. Please re-upload the file.')
          }
          
          // Detect file format
          let format = detectFileFormat(uploadedModel.name)
          if (format === 'unknown' && uploadedModel.url.startsWith('blob:')) {
            try {
              const resp = await fetch(uploadedModel.url)
              const buf = await resp.arrayBuffer()
              const head = new Uint8Array(buf.slice(0, 8))
              const ascii = Array.from(head).map(c => (c >= 32 && c <= 126 ? String.fromCharCode(c) : ' ')).join('')
              if (ascii.includes('glTF')) format = 'glb'
            } catch {}
          }
          if (format === 'unknown') {
            throw new Error(`Unknown file format for ${uploadedModel.name}`)
          }
          
          // Use multi-format loader with progress tracking
          const startTime = performance.now()
          const result = await loadModelByFormat(uploadedModel.url, format, (progress) => {
            setLoadingProgress(progress)
            console.log(`⚡ Agent 2: Loading progress: ${progress.percentage.toFixed(1)}% - ${progress.message}`)
          })
          
          // Process the loaded model
          if (result.model) {
            console.log(`⚡ Agent 2: Successfully loaded uploaded model ${uploadedModel.name} in ${(performance.now() - startTime).toFixed(2)}ms`)
            
            // Process the model based on its format
            const processedModel = processLoadedModel(result.model, format, uploadedModel.name)
            
            setLoadedModel(processedModel)
            setLoadedAnimations(result.animations || [])
            setLoadedMixer(result.mixer || null)
            setCharacterLoaded(true)
            setIsLoading(false)
            
            // Notify parent component about loaded model
            onModelLoaded?.(processedModel, result.animations || [], result.mixer || null)
            return // Success
          }
        } catch (error) {
          console.error(`⚡ Agent 2: Error loading uploaded model ${uploadedModel.name}:`, error)
          setLoadError(`Failed to load uploaded model: ${error instanceof Error ? error.message : 'Unknown error'}`)
          setIsLoading(false)
          return
        }
      } else {
        console.error(`⚡ Agent 2: Uploaded model not found: ${modelId}`)
        setLoadError('Uploaded model not found')
        setIsLoading(false)
        return
      }
    }
    
    // Handle preset models using Mixamo-compatible system
    try {
      const characterId = modelId || 'char1' // Default to char1 if no modelId
      console.log(`⚡ Agent 2: Loading character with Mixamo-compatible system: ${characterId}`)
      
      // Use Mixamo-compatible character loading system
      const startTime = performance.now()
      const mixamoResult = await loadCharacterWithMixamo(characterId, (progress: MixamoLoadingProgress) => {
        // Convert Mixamo progress to FBX progress format for compatibility
        setLoadingProgress({
          loaded: progress.loaded,
          total: progress.total,
          percentage: progress.percentage,
          stage: progress.stage as any,
          message: progress.message
        })
        console.log(`⚡ Agent 2: Mixamo loading progress: ${progress.percentage.toFixed(1)}% - ${progress.message}`)
      })
      
      // Process the loaded model
      if (mixamoResult.model) {
        console.log(`⚡ Agent 2: Successfully loaded character ${characterId} with Mixamo system in ${(performance.now() - startTime).toFixed(2)}ms`)
        
        // Process the model using Mixamo-compatible approach
        const processedModel = processLoadedModel(mixamoResult.model, 'fbx', mixamoResult.characterData.modelUrl)
        
        setLoadedModel(processedModel)
        setLoadedAnimations(mixamoResult.animations || [])
        setLoadedMixer(mixamoResult.mixer || null)
        setCharacterLoaded(true)
        setIsLoading(false)
        
        // Notify parent component about loaded model
        onModelLoaded?.(processedModel, mixamoResult.animations || [], mixamoResult.mixer || null)
        return // Success
      }
    } catch (error) {
      console.error(`⚡ Agent 2: Error loading character with Mixamo system:`, error)
      setLoadError(`Failed to load character: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsLoading(false)
      return
    }
  }

  // Cleanup effect for blob URLs
  useEffect(() => {
    return () => {
      // Cleanup blob URLs when component unmounts
      try {
        const uploadedModels = getUploadedModels()
        uploadedModels.forEach((model: any) => {
          if (model.url && model.url.startsWith('blob:')) {
            URL.revokeObjectURL(model.url)
            console.log(`⚡ Agent 2: Cleaned up blob URL: ${model.url}`)
          }
        })
      } catch (error) {
        console.warn('⚡ Agent 2: Error during blob URL cleanup:', error)
      }
    }
  }, [])
  
  // Multi-format model loader with blob URL support
  const loadModelByFormat = async (
    url: string, 
    format: string, 
    onProgress?: (progress: FBXLoadingProgress) => void
  ): Promise<{ model: Group; animations: AnimationClip[]; mixer?: AnimationMixer }> => {
    
    const startTime = performance.now()
    
    // Update progress
    onProgress?.({
      loaded: 0,
      total: 100,
      percentage: 0,
      stage: 'init',
      message: `Initializing ${format.toUpperCase()} loader...`
    })
    
    try {
      // Handle blob URLs (uploaded files) vs regular URLs
      let isBlobUrl = url.startsWith('blob:')
      
      if (isBlobUrl) {
        console.log(`⚡ Agent 2: Processing blob URL: ${url}`)
        // For blob URLs, we can use the load method directly
        onProgress?.({
          loaded: 10,
          total: 100,
          percentage: 10,
          stage: 'downloading',
          message: 'Processing uploaded file...'
        })
      }
      
      switch (format) {
        case 'fbx':
          // Use existing optimized FBX loader
          onProgress?.({
            loaded: 30,
            total: 100,
            percentage: 30,
            stage: 'downloading',
            message: 'Loading FBX model...'
          })
          
          if (isBlobUrl) {
            // For blob URLs, use enhanced fetch context fix to avoid "Illegal invocation" error
            console.log('⚡ Agent 2: Using enhanced fetch context fix for FBX blob loading')
            
            return withFetchContextFix(async () => {
              return new Promise((resolve, reject) => {
                // Set up error handling for blob URL loading
                const handleError = (error: any) => {
                  console.error('⚡ Agent 2: FBX blob loading error:', error)
                  reject(new Error(`FBX loading failed: ${error.message || 'Unknown error'}`))
                }
                
                try {
                  // Create a safe loader with fetch context protection
                  const safeLoader = createSafeLoader(FBXLoader)()
                  
                  safeLoader.load(
                    url, // Use the original blob URL
                    (object: Group) => {
                      onProgress?.({
                        loaded: 100,
                        total: 100,
                        percentage: 100,
                        stage: 'complete',
                        message: 'FBX model loaded successfully'
                      })
                      
                      const animations = object.animations || []
                      const mixer = animations.length > 0 ? new AnimationMixer(object) : undefined
                      
                      resolve({ model: object, animations, mixer })
                    },
                    (progress: any) => {
                      const percentage = (progress.loaded / progress.total) * 100
                      onProgress?.({
                        loaded: progress.loaded,
                        total: progress.total,
                        percentage,
                        stage: 'downloading',
                        message: `Loading FBX model... ${percentage.toFixed(1)}%`
                      })
                    },
                    (error: any) => {
                      handleError(error)
                    }
                  )
                } catch (error) {
                  handleError(error)
                }
              })
            })
          } else {
            // For regular URLs, use the optimized loader
            console.log(`⚡ Agent 2: Loading FBX with optimized loader: ${url}`)
            try {
              const fbxResult = await loadOptimizedFBX(url, onProgress)
              console.log(`⚡ Agent 2: FBX load result:`, fbxResult)
              
              // Validate the result
              if (!fbxResult || !fbxResult.model) {
                throw new Error('FBX loader returned invalid result - no model found')
              }
              
              console.log(`⚡ Agent 2: FBX model loaded successfully:`, {
                modelType: fbxResult.model.type,
                childrenCount: fbxResult.model.children.length,
                animationsCount: fbxResult.animations?.length || 0,
                hasMixer: !!fbxResult.mixer
              })
              
              return {
                model: fbxResult.model,
                animations: fbxResult.animations || [],
                mixer: fbxResult.mixer
              }
            } catch (error) {
              console.error(`⚡ Agent 2: FBX loading failed for ${url}:`, error)
              
              // Try fallback to direct FBX loader for regular URLs
              console.log(`⚡ Agent 2: Trying fallback direct FBX loader for ${url}`)
              try {
                const fallbackResult = await new Promise<{ model: Group; animations: AnimationClip[]; mixer?: AnimationMixer }>((resolve, reject) => {
                  const loader = new FBXLoader()
                  loader.load(
                    url,
                    (object: Group) => {
                      console.log(`⚡ Agent 2: Fallback FBX loader succeeded for ${url}`)
                      const animations = object.animations || []
                      const mixer = animations.length > 0 ? new AnimationMixer(object) : undefined
                      resolve({ model: object, animations, mixer })
                    },
                    (progress: any) => {
                      console.log(`⚡ Agent 2: Fallback loading progress: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`)
                    },
                    (error: any) => {
                      console.error(`⚡ Agent 2: Fallback FBX loader failed for ${url}:`, error)
                      reject(error)
                    }
                  )
                })
                
                return fallbackResult
              } catch (fallbackError) {
                console.error(`⚡ Agent 2: Both optimized and fallback FBX loaders failed for ${url}`)
                throw new Error(`FBX loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
              }
            }
          }
          
        case 'glb':
        case 'gltf':
          // Use GLTF loader with enhanced fetch context fix
          onProgress?.({
            loaded: 40,
            total: 100,
            percentage: 40,
            stage: 'downloading',
            message: 'Loading GLTF/GLB model...'
          })
          
          console.log('⚡ Agent 2: Using enhanced loader for GLTF/GLB; blob URLs will use XHR+parse')

          // If blob URL, bypass fetch entirely: XHR to ArrayBuffer + parse
          if (url.startsWith('blob:')) {
            return new Promise((resolve, reject) => {
              // Create safe loader and attach decoders
              const safeLoader = createSafeLoader(GLTFLoader)()
              try {
                const draco = new DRACOLoader()
                draco.setDecoderPath('/legacy/vendor/examples/jsm/libs/draco/')
                ;(safeLoader as any).setDRACOLoader?.(draco)
                const ktx2 = new KTX2Loader()
                ktx2.setTranscoderPath('/legacy/vendor/examples/jsm/libs/basis/')
                try { (ktx2 as any).detectSupport?.(gl) } catch {}
                ;(safeLoader as any).setKTX2Loader?.(ktx2)
                // Meshopt optional
                ;(async () => {
                  try {
                    const mod: any = await import('three/examples/jsm/libs/meshopt_decoder.module.js')
                    const meshopt = mod?.MeshoptDecoder || mod?.default || mod || null
                    if (meshopt) { (safeLoader as any).setMeshoptDecoder?.(meshopt) }
                  } catch {}
                })()
              } catch {}

              const req = new XMLHttpRequest()
              req.responseType = 'arraybuffer'
              req.onerror = () => {
                console.error('⚡ Agent 2: GLTF blob XHR error')
                reject(new Error('GLTF blob XHR error'))
              }
              req.onload = () => {
                try {
                  ;(safeLoader as any).parse(req.response as ArrayBuffer, '', (gltf: any) => {
                    onProgress?.({
                      loaded: 100,
                      total: 100,
                      percentage: 100,
                      stage: 'complete',
                      message: 'GLTF/GLB model loaded successfully'
                    })
                    const model = gltf.scene
                    const animations = gltf.animations || []
                    const mixer = animations.length > 0 ? new AnimationMixer(model) : undefined
                    resolve({ model, animations, mixer })
                  }, (err: any) => {
                    console.error('⚡ Agent 2: GLTF blob parse error:', err)
                    reject(new Error('GLTF blob parse error'))
                  })
                } catch (e) {
                  reject(e as any)
                }
              }
              req.open('GET', url, true)
              req.send()
            })
          }

          // Non-blob: use fetch-context fix and standard load()
          return withFetchContextFix(async () => {
            // Attempt to attach Meshopt decoder (optional) via three examples path (bundled)
            let meshopt: any = null
            try {
              const mod: any = await import('three/examples/jsm/libs/meshopt_decoder.module.js')
              meshopt = mod?.MeshoptDecoder || mod?.default || mod || null
            } catch {}
            return new Promise((resolve, reject) => {
              // Create a safe loader with fetch context protection
              const safeLoader = createSafeLoader(GLTFLoader)()
              try {
                const draco = new DRACOLoader()
                draco.setDecoderPath('/legacy/vendor/examples/jsm/libs/draco/')
                ;(safeLoader as any).setDRACOLoader?.(draco)
                const ktx2 = new KTX2Loader()
                ktx2.setTranscoderPath('/legacy/vendor/examples/jsm/libs/basis/')
                try { (ktx2 as any).detectSupport?.(gl) } catch {}
                ;(safeLoader as any).setKTX2Loader?.(ktx2)
                if (meshopt) { (safeLoader as any).setMeshoptDecoder?.(meshopt) }
              } catch {}
              
              const handleError = (error: any) => {
                console.error('⚡ Agent 2: GLTF loading error:', error)
                reject(new Error(`GLTF/GLB loading failed: ${error.message || 'Unknown error'}`))
              }
              
              try {
                ;(safeLoader as any).load(
                  url,
                  (gltf: any) => {
                    onProgress?.({
                      loaded: 100,
                      total: 100,
                      percentage: 100,
                      stage: 'complete',
                      message: 'GLTF/GLB model loaded successfully'
                    })
                    const model = gltf.scene
                    const animations = gltf.animations || []
                    const mixer = animations.length > 0 ? new AnimationMixer(model) : undefined
                    resolve({ model, animations, mixer })
                  },
                  (progress: any) => {
                    const percentage = (progress.loaded / progress.total) * 100
                    onProgress?.({
                      loaded: progress.loaded,
                      total: progress.total,
                      percentage,
                      stage: 'downloading',
                      message: `Loading GLTF/GLB model... ${percentage.toFixed(1)}%`
                    })
                  },
                  (error: any) => {
                    handleError(error)
                  }
                )
              } catch (error) {
                handleError(error)
              }
            })
          })
          
        case 'obj':
          // Use OBJ loader
          onProgress?.({
            loaded: 35,
            total: 100,
            percentage: 35,
            stage: 'downloading',
            message: 'Loading OBJ model...'
          })
          
          return new Promise((resolve, reject) => {
            const loader = new OBJLoader()
            
            // Set up error handling for blob URL loading
            const handleError = (error: any) => {
              console.error('⚡ Agent 2: OBJ blob loading error:', error)
              reject(new Error(`OBJ loading failed: ${error.message || 'Unknown error'}`))
            }
            
            if (isBlobUrl) {
              // For blob URLs, use enhanced fetch context fix to avoid "Illegal invocation" error
              console.log('⚡ Agent 2: Using enhanced fetch context fix for OBJ blob loading')
              
              return withFetchContextFix(async () => {
                return new Promise((resolve, reject) => {
                  try {
                    // Create a safe loader with fetch context protection
                    const safeLoader = createSafeLoader(OBJLoader)()
                    
                    safeLoader.load(
                      url, // Use the original blob URL
                      (obj: any) => {
                        onProgress?.({
                          loaded: 100,
                          total: 100,
                          percentage: 100,
                          stage: 'complete',
                          message: 'OBJ model loaded successfully'
                        })
                        
                        const model = obj
                        const animations: AnimationClip[] = [] // OBJ doesn't support animations
                        
                        resolve({ model, animations })
                      },
                      (progress: any) => {
                        const percentage = (progress.loaded / progress.total) * 100
                        onProgress?.({
                          loaded: progress.loaded,
                          total: progress.total,
                          percentage,
                          stage: 'downloading',
                          message: `Loading OBJ model... ${percentage.toFixed(1)}%`
                        })
                      },
                      (error: any) => {
                        handleError(error)
                      }
                    )
                  } catch (error) {
                    handleError(error)
                  }
                })
              })
            } else {
              // For regular URLs, use standard OBJ loader
              return new Promise((resolve, reject) => {
                const loader = new OBJLoader()
                loader.load(
                  url,
                  (obj: any) => {
                    onProgress?.({
                      loaded: 100,
                      total: 100,
                      percentage: 100,
                      stage: 'complete',
                      message: 'OBJ model loaded successfully'
                    })
                    
                    const model = obj
                    const animations: AnimationClip[] = [] // OBJ doesn't support animations
                    
                    resolve({ model, animations })
                  },
                  (progress: any) => {
                    const percentage = (progress.loaded / progress.total) * 100
                    onProgress?.({
                      loaded: progress.loaded,
                      total: progress.total,
                      percentage,
                      stage: 'downloading',
                      message: `Loading OBJ model... ${percentage.toFixed(1)}%`
                    })
                  },
                  (error: any) => {
                    handleError(error)
                  }
                )
                            })
            }
          })

        default:
          throw new Error(`Unsupported file format: ${format}`)
      }
    } catch (error) {
      const loadingTime = performance.now() - startTime
      console.error(`⚡ Agent 2: ${format.toUpperCase()} loading failed after ${loadingTime.toFixed(2)}ms:`, error)
      throw error
    }
  }
  
  // Enhanced placeholder character (fallback)
  const EnhancedPlaceholderCharacter = () => (
    <group ref={groupRef}>
      {/* Body - capsule with better proportions */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.3, 0.8, 8, 8]} />
        <meshStandardMaterial 
          color="#4a90e2" 
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      {/* Head - spherical with better proportions */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial 
          color="#f4c2a1" 
          roughness={0.6}
          metalness={0.0}
        />
      </mesh>
      
      {/* Arms - cylindrical with joints */}
      <mesh position={[-0.4, 1.3, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.08, 0.5, 8, 8]} />
        <meshStandardMaterial color="#4a90e2" />
      </mesh>
      
      <mesh position={[0.4, 1.3, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.08, 0.5, 8, 8]} />
        <meshStandardMaterial color="#4a90e2" />
      </mesh>
      
      {/* Legs - cylindrical with better proportions */}
      <mesh position={[-0.15, 0.6, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.1, 0.8, 8, 8]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      
      <mesh position={[0.15, 0.6, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.1, 0.8, 8, 8]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.06, 1.85, 0.15]} castShadow>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.06, 1.85, 0.15]} castShadow>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Pupils */}
      <mesh position={[-0.06, 1.85, 0.17]} castShadow>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.06, 1.85, 0.17]} castShadow>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Mouth */}
      <mesh position={[0, 1.75, 0.18]} castShadow>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#c4756a" />
      </mesh>
    </group>
  )
  
  // Loading indicator with progress
  if (isLoading) {
    return (
      <group>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#0ea5e9" />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <ringGeometry args={[0.15, 0.2, 8]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.6} />
        </mesh>
        {/* Progress text (if needed) */}
                 {loadingProgress.stage === 'downloading' && (
          <mesh position={[0, 1.3, 0]}>
            <planeGeometry args={[2, 0.1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
        )}
      </group>
    )
  }
  
  // Error state with enhanced placeholder
  if (loadError) {
    console.log('⚡ Agent 2: Using enhanced placeholder character due to:', loadError)
    return <EnhancedPlaceholderCharacter />
  }
  
  // Success state - return the loaded FBX model
  if (characterLoaded && loadedModel) {
    console.log('⚡ Agent 2: Rendering loaded model:', loadedModel)
    console.log('⚡ Agent 2: Model type:', loadedModel.type)
    console.log('⚡ Agent 2: Model children:', loadedModel.children.length)
    
    return (
      <primitive 
        object={loadedModel} 
        onUpdate={(self: any) => {
          console.log('⚡ Agent 2: Model primitive updated:', self)
        }}
      />
    )
  }
  
  // Loading state - show loading indicator instead of placeholder
  if (isLoading) {
    console.log('⚡ Agent 2: Still loading model...')
    // 🎭 Agent 4 - Remove blue loading indicator to prevent overlay
    return null
  }
  
  // Error state - show error message
  if (loadError) {
    console.error('⚡ Agent 2: Model loading error:', loadError)
    return (
      <group>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <planeGeometry args={[2, 0.1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      </group>
    )
  }
  
  // Fallback - no model loaded yet, show loading indicator
  console.log('⚡ Agent 2: No model loaded, showing loading indicator')
  // 🎭 Agent 4 - Remove blue loading indicator to prevent overlay
  return null
}

function ModelViewer() {
  const groupRef = useRef<Group>(null!)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const { camera, gl } = useThree()
  const [currentLOD, setCurrentLOD] = useState(0)
  const [currentQuality, setCurrentQuality] = useState(QualityLevel.HIGH)
  const { lipSyncEnabled, microphoneEnabled, currentAnimation, setCurrentAnimation, isPlaying } = useAppStore()
  const [loadedAnimations, setLoadedAnimations] = useState<AnimationClip[]>([])
  const [loadedMixer, setLoadedMixer] = useState<AnimationMixer | null>(null)
  
  // Performance monitoring instances - removed non-existent classes
  const performanceDataRef = useRef({
    lastFrameCheck: 0,
    frameDropCounter: 0,
    adaptiveQualityEnabled: true
  })
  const lastPerformanceCheck = useRef(performance.now())
  
  // Update ref when currentLOD changes
  useEffect(() => {
    // LOD updates handled by ultra-lightweight system
  }, [currentLOD])
  
  // Lip sync integration
  const [lipSyncManager, setLipSyncManager] = useState<any>(null)
  const [isLipSyncInitialized, setIsLipSyncInitialized] = useState(false)
  // const [currentMouthShape, setCurrentMouthShape] = useState<any>(null) // Unused - removed
  // const [audioLevel, setAudioLevel] = useState(0) // Unused - removed
  
  // Real-time mouth shape update from lip sync (optimized)
  useEffect(() => {
    if (!lipSyncManager) return
    
    let animationFrameId: number
    let lastUpdateTime = 0
    const targetFPS = 30 // Limit to 30fps for performance
    const frameTime = 1000 / targetFPS
    
    const updateMouthShape = (currentTime: number) => {
      // Throttle updates for performance
      if (currentTime - lastUpdateTime >= frameTime) {
        try {
          // const mouthShape = lipSyncManager.getCurrentMouthShape() // Unused - removed
          // const status = lipSyncManager.getStatus() // Unused - removed
          
          // setCurrentMouthShape(mouthShape) // Unused - removed
          // setAudioLevel(status.state?.latestAudioLevel || 0) // Unused - removed
          
          lastUpdateTime = currentTime
        } catch (error) {
          console.error('💋 Error updating mouth shape:', error)
        }
      }
      
      animationFrameId = requestAnimationFrame(updateMouthShape)
    }
    
    animationFrameId = requestAnimationFrame(updateMouthShape)
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [lipSyncManager])
  
  // Animation system integration - use real loaded animations instead of mock
  const [availableAnimations, setAvailableAnimations] = useState<AnimationClip[]>([])
  
  // Update available animations when loaded animations change
  useEffect(() => {
    if (loadedAnimations.length > 0) {
      console.log('🎭 Agent 3: Real animations loaded:', loadedAnimations.map(a => a.name))
      setAvailableAnimations(loadedAnimations)
      
      // Set default animation if none is currently selected
      if (!currentAnimation && loadedAnimations.length > 0) {
        const defaultAnim = loadedAnimations.find(a => a.name.toLowerCase().includes('idle')) || loadedAnimations[0]
        setCurrentAnimation(defaultAnim.name)
        console.log('🎭 Agent 3: Set default animation:', defaultAnim.name)
      }
    } else {
      console.warn('🎭 Agent 3: No animations loaded from model')
    }
  }, [loadedAnimations, setCurrentAnimation]) // Removed currentAnimation from dependencies to prevent infinite loop
  
  console.debug('Available animations:', availableAnimations.length)
  
  // GPU-optimized geometries with quality-adaptive LOD and instanced rendering support - REMOVED (unused)
  // const geometries = useMemo(() => {
  //   // Geometries removed to fix TypeScript errors
  // }, [currentQuality])
  
  // Material quality settings based on current quality level - REMOVED (unused)
  // const shouldUseHighQualityMaterials = currentQuality >= QualityLevel.HIGH

  // Enhanced facial model component with blend shape support - REMOVED (unused)
  // const FacialModel = ({ mouthShape, audioLevel }: { mouthShape?: any; audioLevel?: number }) => {
  //   // Component removed to fix TypeScript errors
  // }

  // Mock character system removed - replaced with CharacterLoader component

  // Advanced performance-optimized animation with adaptive frame skipping
  const animationFrameCount = useRef(0)
  const frameSkipCounter = useRef(0)
  
  // Ultra-lightweight performance monitoring and adaptive quality adjustment - Agent 5 optimization
  useFrame(() => {
    const currentTime = performance.now()
    
    // Ultra-reduced frequency: Performance monitoring every 20 seconds instead of 2
    if (currentTime - lastPerformanceCheck.current > 20000) {
      // Performance monitoring removed due to missing classes
      console.debug(`🔧 Performance: Frame ${animationFrameCount.current} processed`)
      
      // Simple adaptive quality adjustment
      if (frameSkipCounter.current < 30 && currentQuality !== QualityLevel.LOW) {
        setCurrentQuality(QualityLevel.LOW)
        console.log(`🔍 Agent 5: Ultra-light quality reduced to LOW (FPS: ${frameSkipCounter.current})`)
      } else if (frameSkipCounter.current >= 55 && currentQuality !== QualityLevel.HIGH) {
        setCurrentQuality(QualityLevel.HIGH)
        console.log(`🔍 Agent 5: Ultra-light quality increased to HIGH (FPS: ${frameSkipCounter.current})`)
      }
      
      lastPerformanceCheck.current = currentTime
    }
  })
  
  useFrame((state) => {
    animationFrameCount.current++
    frameSkipCounter.current++
    
         // Advanced performance monitoring and adaptive quality adjustment - simplified
     if (animationFrameCount.current % 600 === 0) { // Check every 10 seconds at 60fps (reduced from 2 seconds)
       // Performance monitoring removed due to missing classes
       console.debug(`🔧 Performance: Frame ${animationFrameCount.current} processed`)
     }
    
    // Dynamic frame skipping based on performance and quality
    const baseSkipFrames = currentLOD > 0 ? 2 : 1
    const qualitySkipFrames = currentQuality <= QualityLevel.LOW ? 2 : 
                             currentQuality <= QualityLevel.MEDIUM ? 1 : 0
    const skipFrames = baseSkipFrames + qualitySkipFrames
    
    if (animationFrameCount.current % Math.max(skipFrames, 1) !== 0) return
    
    // Update animation mixer if available
    if (loadedMixer) {
      const delta = state.clock.getDelta()
      loadedMixer.update(delta)
      
      // Debug animation state - reduced frequency for better performance
      if (frameSkipCounter.current % 300 === 0) { // Log every 5 seconds at 60fps (reduced from 1 second)
        console.debug('🎭 Agent 3: Animation mixer update:', {
          delta,
          currentAnimation,
          isPlaying: isPlaying,
          mixerTime: loadedMixer.time,
          hasActions: (loadedMixer as any)._actions?.length > 0
        })
      }
    }
    
    if (groupRef.current) {
      // Adaptive animation intensity based on performance
      const baseIntensity = currentLOD === 0 ? 1 : currentLOD === 1 ? 0.5 : 0.25
      const qualityIntensity = currentQuality >= QualityLevel.HIGH ? 1 : 
                              currentQuality >= QualityLevel.MEDIUM ? 0.75 : 0.5
      const animationIntensity = baseIntensity * qualityIntensity
      
      // Smooth, performance-adaptive animations
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 * animationIntensity
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02 * animationIntensity
    }
    
    // Enhanced distance-based LOD with hysteresis to prevent flickering
    if (groupRef.current && camera) {
      const distance = camera.position.distanceTo(groupRef.current.position)
      let newLOD = currentLOD
      
      // Hysteresis prevents constant LOD switching at boundaries
      const hysteresis = 1.0
      if (distance < 5 - hysteresis && currentLOD > 0) {
        newLOD = 0
      } else if (distance > 5 + hysteresis && distance < 15 - hysteresis && currentLOD !== 1) {
        newLOD = 1
      } else if (distance > 15 + hysteresis && currentLOD < 2) {
        newLOD = 2
      }
      
      if (newLOD !== currentLOD) {
        setCurrentLOD(newLOD)
        console.debug(`🔧 Performance: LOD changed to ${newLOD}`)
      }
    }
  })

  // Initialize animation mixer
  useEffect(() => {
    if (groupRef.current) {
      mixerRef.current = new AnimationMixer(groupRef.current)
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
        mixerRef.current = null
      }
    }
  }, [])

  // Lip sync initialization and management
  useEffect(() => {
    const initLipSync = async () => {
      if (lipSyncEnabled && microphoneEnabled && !isLipSyncInitialized) {
        try {
          console.log('💋 Initializing lip sync system...')
          const manager = await initializeLipSync({
            enabled: true,
            sensitivity: 0.7,
            smoothing: 0.3,
            exaggeration: 0.5
          })
          
          // Set the current model for facial animation
          if (groupRef.current) {
            const success = manager.setModel(groupRef.current)
            if (success) {
              console.log('💋 Model set for lip sync')
              setLipSyncManager(manager)
              await manager.startLipSync()
              setIsLipSyncInitialized(true)
            } else {
              console.warn('💋 Failed to set model for lip sync')
            }
          }
        } catch (error) {
          console.error('💋 Failed to initialize lip sync:', error)
        }
      } else if ((!lipSyncEnabled || !microphoneEnabled) && lipSyncManager) {
        // Stop lip sync if disabled
        console.log('💋 Stopping lip sync...')
        lipSyncManager.stopLipSync()
        setLipSyncManager(null)
        setIsLipSyncInitialized(false)
      }
    }

    initLipSync()
  }, [lipSyncEnabled, microphoneEnabled, isLipSyncInitialized, lipSyncManager])

  // Enhanced memory cleanup with performance tracking
  useEffect(() => {
    return () => {
      console.debug('🧹 ModelViewer: Starting cleanup...')
      
      // Cleanup lip sync
      if (lipSyncManager) {
        lipSyncManager.shutdown()
        console.debug('🧹 Lip sync manager cleaned up')
      }
      
             // Enhanced geometry and material cleanup - simplified
       if (groupRef.current) {
         groupRef.current.traverse((child) => {
           if (child instanceof Mesh) {
             // Clear references
             child.geometry = null as any
             child.material = null as any
           }
         })
         
         console.debug('🧹 ModelViewer: All resources cleaned up')
       }
    }
  }, [lipSyncManager])
  
     // Performance quality adjustment effect - simplified
   useEffect(() => {
     if (gl) {
       console.debug(`🎯 Performance: Quality level ${QualityLevel[currentQuality]} selected`)
     }
   }, [currentQuality, gl])

  return (
    <>
      <CharacterLoader 
        onModelLoaded={(_model, animations, mixer) => {
          console.log(`🎭 Agent 3: Model loaded with ${animations.length} animations:`, animations.map(a => a.name))
          setLoadedAnimations(animations)
          setLoadedMixer(mixer)
          
          // Debug: Check if animations are properly set
          console.log('🎭 Agent 3: Setting loaded animations:', animations)
          console.log('🎭 Agent 3: Setting loaded mixer:', mixer)
        }}
      />
      {/* Mixamo Animation System */}
      <MixamoAnimationSystem
        mixer={loadedMixer}
        animations={loadedAnimations} // Use loadedAnimations directly instead of availableAnimations
        onAnimationChange={(animationName: string) => {
          console.log(`🎭 Agent 3: Animation changed to: ${animationName}`)
          setCurrentAnimation(animationName)
        }}
      />
    </>
  )
}

export default ModelViewer
