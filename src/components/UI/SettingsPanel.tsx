import { useAppStore } from '@utils/store'
import { 
  Monitor, 
  Volume2, 
  Palette, 
  Zap, 
  Eye, 
  EyeOff,
  Save,
  RotateCcw,
  X,
  Bot
} from 'lucide-react'

function SettingsPanel() {
  const { 
    aiResponsiveness,
    aiCreativity,
    aiPersonalityPreset,
    setAiResponsiveness,
    setAiCreativity,
    setAiPersonalityPreset,
    toggleSettingsPanel,
    aiSuggestionsEnabled,
    aiSuggestionIntervalMs,
    setAiSuggestionsEnabled,
    setAiSuggestionIntervalMs
  } = useAppStore()

  const personalityPresets = [
    { id: 'balanced', name: 'Balanced', description: 'Standard AI behavior' },
    { id: 'creative', name: 'Creative', description: 'More experimental animations' },
    { id: 'conservative', name: 'Conservative', description: 'Safe, predictable animations' },
    { id: 'energetic', name: 'Energetic', description: 'High-energy, dynamic animations' }
  ]

  const handleResetSettings = () => {
    setAiResponsiveness(0.7)
    setAiCreativity(0.5)
    setAiPersonalityPreset('balanced')
    setAiSuggestionsEnabled(true)
    setAiSuggestionIntervalMs(4000)
    console.log('💋 Agent 4: Settings reset to defaults')
  }

  const handleSaveSettings = () => {
    // Save settings to localStorage
    const settings = {
      aiResponsiveness,
      aiCreativity,
      aiPersonalityPreset,
      aiSuggestionsEnabled,
      aiSuggestionIntervalMs,
      timestamp: Date.now()
    }
    localStorage.setItem('mixamo-viewer-settings', JSON.stringify(settings))
    console.log('💋 Agent 4: Settings saved to localStorage')
  }

  return (
    <div className="h-full flex flex-col bg-secondary-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-700">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
        <button
          onClick={toggleSettingsPanel}
          className="p-1 hover:bg-secondary-700 rounded transition-colors"
          title="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* AI Behavior Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-blue-400" />
            <h3 className="font-medium">AI Behavior</h3>
          </div>
          
          {/* Personality Preset */}
          <div className="space-y-2">
            <label className="text-sm text-secondary-300">Personality Preset</label>
            <select
              value={aiPersonalityPreset}
              onChange={(e) => setAiPersonalityPreset(e.target.value)}
              className="w-full bg-secondary-800 border border-secondary-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            >
              {personalityPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} - {preset.description}
                </option>
              ))}
            </select>
          </div>

          {/* Responsiveness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary-300">Responsiveness</label>
              <span className="text-xs text-secondary-400">{Math.round(aiResponsiveness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={aiResponsiveness}
              onChange={(e) => setAiResponsiveness(parseFloat(e.target.value))}
              className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-secondary-400">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Creativity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-secondary-300">Creativity</label>
              <span className="text-xs text-secondary-400">{Math.round(aiCreativity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={aiCreativity}
              onChange={(e) => setAiCreativity(parseFloat(e.target.value))}
              className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-secondary-400">
              <span>Predictable</span>
              <span>Experimental</span>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="space-y-2">
            <label className="text-sm text-secondary-300">AI Suggestions</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={aiSuggestionsEnabled} onChange={(e) => setAiSuggestionsEnabled(e.target.checked)} />
                <span>Enable</span>
              </label>
              <label className="flex items-center gap-2">
                <span>Interval</span>
                <input
                  type="number"
                  min={1000}
                  max={30000}
                  step={500}
                  value={aiSuggestionIntervalMs}
                  onChange={(e) => setAiSuggestionIntervalMs(Number(e.target.value) || 4000)}
                  className="w-24 bg-secondary-800 text-secondary-100 px-2 py-1 rounded border border-secondary-600"
                />
                <span>ms</span>
              </label>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="font-medium">Performance</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-300">Auto Quality Adjustment</span>
              <div className="w-10 h-6 bg-secondary-700 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-300">Show Performance Stats</span>
              <div className="w-10 h-6 bg-secondary-700 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-green-400" />
            <h3 className="font-medium">Audio</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-300">Microphone Auto-Start</span>
              <div className="w-10 h-6 bg-secondary-700 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-300">Lip Sync Auto-Enable</span>
              <div className="w-10 h-6 bg-secondary-700 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
              </div>
            </div>
          </div>
        </div>

        {/* UI Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-purple-400" />
            <h3 className="font-medium">Interface</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-300">Dark Theme</span>
              <div className="w-10 h-6 bg-primary-600 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-300">Show Tooltips</span>
              <div className="w-10 h-6 bg-primary-600 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-secondary-700 space-y-3">
        <div className="flex space-x-2">
          <button
            onClick={handleSaveSettings}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
          
          <button
            onClick={handleResetSettings}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded text-sm transition-colors"
            title="Reset to Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-xs text-secondary-400 text-center">
          Settings are automatically saved to your browser
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
