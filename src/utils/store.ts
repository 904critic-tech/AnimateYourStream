import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Type definitions for the app state
export interface AppState {
  // Core state
  isLoading: boolean
  currentModel: string | null
  currentAnimation: string | null
  isPlaying: boolean
  animationSpeed: number
  
  // Uploaded models support
  uploadedModels: UploadedModel[]
  currentUploadedModel: UploadedModel | null
  
  // Animation info
  animationInfo: {
    availableAnimations: string[]
    currentTime: number
    duration: number
  }
  
  // UI state
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  bottomPanelOpen: boolean
  performanceDashboardOpen: boolean
  settingsPanelOpen: boolean
  
  // Audio state
  microphoneEnabled: boolean
  audioLevel: number
  lipSyncEnabled: boolean
  
  // AI behavior state
  aiBehaviorEnabled: boolean
  lastInteraction: number
  aiPersonalityPreset: string
  aiResponsiveness: number
  aiCreativity: number
  aiSuggestionHistory: string[]
  
  // Error reporting state
  errors: ErrorReport[]
  
  // Actions
  setIsLoading: (loading: boolean) => void
  setCurrentModel: (model: string | null) => void
  setCurrentAnimation: (animation: string | null) => void
  setIsPlaying: (playing: boolean) => void
  setAnimationSpeed: (speed: number) => void
  setAnimationInfo: (info: Partial<AppState['animationInfo']>) => void
  
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  toggleBottomPanel: () => void
  togglePerformanceDashboard: () => void
  toggleSettingsPanel: () => void
  
  setMicrophoneEnabled: (enabled: boolean) => void
  setAudioLevel: (level: number) => void
  setLipSyncEnabled: (enabled: boolean) => void
  
  setAiBehaviorEnabled: (enabled: boolean) => void
  updateLastInteraction: () => void
  setAiPersonalityPreset: (preset: string) => void
  setAiResponsiveness: (responsiveness: number) => void
  setAiCreativity: (creativity: number) => void
  addAiSuggestion: (animationId: string) => void
  
  addError: (error: Omit<ErrorReport, 'id' | 'timestamp'>) => void
  removeError: (id: string) => void
  clearErrors: () => void
  
  // Uploaded models actions
  addUploadedModel: (model: UploadedModel) => void
  removeUploadedModel: (id: string) => void
  setCurrentUploadedModel: (model: UploadedModel | null) => void
  clearUploadedModels: () => void

  // Procedural idle per-model settings
  proceduralIdleSettings: Record<string, { enabled: boolean; amplitude: number; speed: number }>
  setProceduralIdleSettings: (modelId: string, settings: Partial<{ enabled: boolean; amplitude: number; speed: number }>) => void

  // Persist last selected animation per model
  lastSelectedAnimationByModel: Record<string, string>
  setLastSelectedAnimationForModel: (modelId: string, animationName: string) => void

  // Character manifest (optional)
  characters: { id: string; name: string; category: string; modelPath: string }[]
  setCharacters: (chars: { id: string; name: string; category: string; modelPath: string }[]) => void
  loadCharactersManifest: () => Promise<void>
}

export interface UploadedModel {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt: string
}

export interface ErrorReport {
  id: string
  timestamp: number
  type: 'error' | 'warning' | 'info'
  component: string
  message: string
  stack?: string
  userAgent?: string
  url?: string
}

// Create the store with devtools for debugging
export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Initial state
      isLoading: true,
      currentModel: 'elmo', // Default to Elmo character
      currentAnimation: null,
      isPlaying: true,
      animationSpeed: 1.0,
      
      // Uploaded models state
      uploadedModels: [],
      currentUploadedModel: null,
      
      animationInfo: {
        availableAnimations: [],
        currentTime: 0,
        duration: 1
      },
      
      leftPanelOpen: true,
      rightPanelOpen: true,
      bottomPanelOpen: true,
      performanceDashboardOpen: false,
      settingsPanelOpen: false,
      
      microphoneEnabled: false,
      audioLevel: 0,
      lipSyncEnabled: false,
      
      aiBehaviorEnabled: false,
      lastInteraction: Date.now(),
      aiPersonalityPreset: 'balanced',
      aiResponsiveness: 0.7,
      aiCreativity: 0.5,
      aiSuggestionHistory: [],

      // Procedural idle settings (per-model)
      proceduralIdleSettings: {},

      // Last selected animation per model
      lastSelectedAnimationByModel: {},
      
      // Character manifest (optional)
      characters: [],
      
      errors: [],
      
      // Actions
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      setCurrentModel: (model) => {
        console.log('⚡ Agent 2: Setting current model:', model)
        set({ currentModel: model })
      },
      
      setCurrentAnimation: (animation) => set({ 
        currentAnimation: animation,
        isPlaying: animation !== null 
      }),
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      
      setAnimationSpeed: (speed) => set({ 
        animationSpeed: Math.max(0.1, Math.min(3.0, speed)) 
      }),
      
      setAnimationInfo: (info) => set((state) => ({
        animationInfo: { ...state.animationInfo, ...info }
      })),
      
      toggleLeftPanel: () => set((state) => ({ 
        leftPanelOpen: !state.leftPanelOpen 
      })),
      
      toggleRightPanel: () => set((state) => ({ 
        rightPanelOpen: !state.rightPanelOpen 
      })),
      
      toggleBottomPanel: () => set((state) => ({ 
        bottomPanelOpen: !state.bottomPanelOpen 
      })),
      
      togglePerformanceDashboard: () => set((state) => ({ 
        performanceDashboardOpen: !state.performanceDashboardOpen 
      })),
      
      toggleSettingsPanel: () => set((state) => ({ 
        settingsPanelOpen: !state.settingsPanelOpen 
      })),
      
      setMicrophoneEnabled: (enabled) => set({ microphoneEnabled: enabled }),
      setAudioLevel: (level) => set({ audioLevel: level }),
      setLipSyncEnabled: (enabled) => set({ lipSyncEnabled: enabled }),
      
      setAiBehaviorEnabled: (enabled) => set({ aiBehaviorEnabled: enabled }),
      updateLastInteraction: () => set({ lastInteraction: Date.now() }),
      setAiPersonalityPreset: (preset) => set({ aiPersonalityPreset: preset }),
      setAiResponsiveness: (responsiveness) => set({ 
        aiResponsiveness: Math.max(0.1, Math.min(1.0, responsiveness)) 
      }),
      setAiCreativity: (creativity) => set({ 
        aiCreativity: Math.max(0.0, Math.min(1.0, creativity)) 
      }),
      addAiSuggestion: (animationId) => set((state) => ({
        aiSuggestionHistory: [...state.aiSuggestionHistory, animationId].slice(-20) // Keep last 20
      })),
      
      addError: (error) => {
        const newError: ErrorReport = {
          ...error,
          id: Date.now().toString(),
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
        
        set((state) => ({
          errors: [...state.errors, newError].slice(-50) // Keep last 50 errors
        }))
      },
      
      removeError: (id) => set((state) => ({
        errors: state.errors.filter(error => error.id !== id)
      })),
      
      clearErrors: () => set({ errors: [] }),
      
      // Uploaded models actions
      addUploadedModel: (model) => set((state) => ({
        uploadedModels: [...state.uploadedModels, model]
      })),
      
      removeUploadedModel: (id) => set((state) => ({
        uploadedModels: state.uploadedModels.filter(model => model.id !== id),
        currentUploadedModel: state.currentUploadedModel?.id === id ? null : state.currentUploadedModel
      })),
      
      setCurrentUploadedModel: (model) => set({ currentUploadedModel: model }),
      
      clearUploadedModels: () => set({ 
        uploadedModels: [], 
        currentUploadedModel: null 
      }),

      setProceduralIdleSettings: (modelId, settings) => set((state) => ({
        proceduralIdleSettings: {
          ...state.proceduralIdleSettings,
          [modelId]: {
            enabled: settings.enabled ?? state.proceduralIdleSettings[modelId]?.enabled ?? true,
            amplitude: settings.amplitude ?? state.proceduralIdleSettings[modelId]?.amplitude ?? 0.01,
            speed: settings.speed ?? state.proceduralIdleSettings[modelId]?.speed ?? 1.0
          }
        }
      })),

      setLastSelectedAnimationForModel: (modelId, animationName) => set((state) => ({
        lastSelectedAnimationByModel: {
          ...state.lastSelectedAnimationByModel,
          [modelId]: animationName
        }
      })),

      setCharacters: (chars) => set({ characters: chars }),
      loadCharactersManifest: async () => {
        try {
          const res = await fetch('/Default_Characters/character_manifest.json', { cache: 'no-store' })
          if (!res.ok) return
          const data = await res.json()
          const list = Array.isArray(data?.characters) ? data.characters : []
          set({ characters: list })
        } catch {
          // no-op; manifest is optional
        }
      }
    }),
    {
      name: 'mixamo-model-viewer-store'
    }
  )
)
