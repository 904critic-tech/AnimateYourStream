import { useEffect, useState, useMemo } from 'react'
import { Search, User, Users, Zap, Filter, Upload, Loader2, AlertCircle } from 'lucide-react'
import { useAppStore } from '@utils/store'

// Legacy presets (kept intact)
const legacyPresets = [
  { id: 'default_fbx', name: 'Default FBX (Animated)', category: 'Sample', thumbnail: null, modelPath: '/models/Default_Model.fbx' },
  { id: 'elmo', name: 'Elmo (Stuffed Animal)', category: 'Fantasy', thumbnail: null, modelPath: '/Default_Characters/elmo_rigged.glb' },
  { id: 'spiderman_chasm', name: 'Spider-Man Chasm', category: 'Superhero', thumbnail: null, modelPath: '/Default_Characters/mr_spiderman_chasm.glb' },
  { id: 'spiderman_suit', name: 'Spider-Man Suit', category: 'Superhero', thumbnail: null, modelPath: '/Default_Characters/New_spiderman_suit_we_0613175722_texture.fbx' },
  { id: 'spiderman', name: 'Spider-Man', category: 'Superhero', thumbnail: null, modelPath: '/Default_Characters/Spider-Man.fbx' },
  { id: 'spiderman_ps4', name: 'Spider-Man PS4', category: 'Superhero', thumbnail: null, modelPath: '/Default_Characters/SPIDERMAN PS4.fbx' },
  { id: 'spiderham', name: 'Spider-Ham', category: 'Superhero', thumbnail: null, modelPath: '/Default_Characters/uploads_files_4424020_SpiderHam_Current_LW.fbx' },
  { id: 'crz9_fortnite', name: 'CRZ_9 Fortnite (Idle)', category: 'Sample', thumbnail: null, modelPath: '/Default_Characters/CRZ_9_Fortnite/cyberpunk_idle.glb' },
]

const categories = ['All', 'Superhero', 'Fantasy']

// File validation and processing
const validateModelFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 200 * 1024 * 1024 // 200MB limit
  const allowedTypes = ['.fbx', '.glb', '.gltf', '.obj']
  
  // Check file size
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size exceeds 200MB limit' }
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().split('.').pop()
  if (!extension || !allowedTypes.includes(`.${extension}`)) {
    return { isValid: false, error: 'Unsupported file format. Please use .fbx, .glb, .gltf, or .obj files' }
  }
  
  return { isValid: true }
}

function LeftPanel() {
  const { 
    currentModel, 
    setCurrentModel, 
    uploadedModels, 
    addUploadedModel, 
    removeUploadedModel,
    currentUploadedModel,
    setCurrentUploadedModel,
    characters,
    loadCharactersManifest
  } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCharacterForLoad, setSelectedCharacterForLoad] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadCharactersManifest()
  }, [loadCharactersManifest])

  // Merge optional manifest characters with legacy presets (no duplicates by id)
  const allCharacters = useMemo(() => {
    const map = new Map(legacyPresets.map(c => [c.id, c]))
    for (const c of characters || []) {
      if (!map.has(c.id)) map.set(c.id, { ...c, thumbnail: null })
    }
    return Array.from(map.values())
  }, [characters])

  const filteredCharacters = allCharacters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || char.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const selectCharacter = (characterId: string) => {
    // Prevent rapid character switching
    if (characterId === currentModel) {
      console.log(`⚡ Agent 2: Character already selected: ${characterId}`)
      return
    }
    
    console.log(`⚡ Agent 2: Switching to character: ${characterId}`)
    setCurrentModel(characterId)
    setSelectedCharacterForLoad(characterId)
  }

  const loadSelectedModel = async () => {
    if (!selectedCharacterForLoad) {
      console.warn('⚡ Agent 2: No character selected for loading')
      return
    }

    // Prevent loading if already loading
    if (isLoading) {
      console.log('⚡ Agent 2: Already loading a model, skipping...')
      return
    }

    setIsLoading(true)
    console.log(`⚡ Agent 2: Loading model for character: ${selectedCharacterForLoad}`)
    
    try {
      // Find the selected character
      const selectedChar = allCharacters.find(char => char.id === selectedCharacterForLoad)
      if (!selectedChar) {
        throw new Error('Character not found')
      }

      // Trigger model loading in ModelViewer by updating the store
      setCurrentModel(selectedCharacterForLoad)
      
      // Wait a bit for the model loading to start
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log(`⚡ Agent 2: Model loading initiated for: ${selectedChar.name} (${selectedChar.modelPath})`)
      
    } catch (error) {
      console.error('⚡ Agent 2: Error loading model:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Import/Export functionality
  const handleImportModels = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedModels = JSON.parse(text)
      
      if (Array.isArray(importedModels)) {
        importedModels.forEach(model => {
          if (model.id && model.name && model.url) {
            addUploadedModel(model)
          }
        })
        setUploadSuccess(`Successfully imported ${importedModels.length} models`)
      } else {
        throw new Error('Invalid import file format')
      }
    } catch (error) {
      setUploadError('Failed to import models: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      event.target.value = ''
    }
  }

  const handleExportModels = () => {
    try {
      const dataStr = JSON.stringify(uploadedModels, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = 'uploaded-models.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setUploadSuccess(`Successfully exported ${uploadedModels.length} models`)
    } catch (error) {
      setUploadError('Failed to export models: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Clear previous messages
    setUploadError(null)
    setUploadSuccess(null)
    setIsUploading(true)

    console.log(`🎭 Agent 1: Processing uploaded file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    try {
      // Validate the file
      const validation = validateModelFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Create a blob URL for the uploaded file
      // Use a more robust blob URL creation method with error handling
      let blob: Blob
      let fileUrl: string
      
      try {
        blob = new Blob([file], { type: file.type || 'application/octet-stream' })
        fileUrl = URL.createObjectURL(blob)
        console.log(`🎭 Agent 1: Created blob URL: ${fileUrl}`)
      } catch (error) {
        console.error('🎭 Agent 1: Error creating blob URL:', error)
        throw new Error('Failed to create file URL. Please try again.')
      }
      
      // Store the uploaded file in the app store for ModelViewer to access
      const uploadedModel = {
        id: `uploaded-${Date.now()}`,
        name: file.name,
        url: fileUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
        // Removed blob reference - it cannot be serialized to JSON
      }

      // Clean up old blob URLs to prevent memory leaks
      uploadedModels.forEach((model: any) => {
        if (model.url && model.url.startsWith('blob:') && model.id !== uploadedModel.id) {
          try {
            URL.revokeObjectURL(model.url)
            console.log('🎭 Agent 1: Cleaned up old blob URL:', model.url)
          } catch (error) {
            console.warn('🎭 Agent 1: Error revoking old blob URL:', error)
          }
        }
      })
      
      // Limit the number of stored models to prevent memory bloat
      const maxStoredModels = 10
      if (uploadedModels.length >= maxStoredModels) {
        const oldestModel = uploadedModels.shift()
        if (oldestModel && oldestModel.url && oldestModel.url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(oldestModel.url)
            console.log('🎭 Agent 1: Cleaned up oldest blob URL due to storage limit:', oldestModel.url)
          } catch (error) {
            console.warn('🎭 Agent 1: Error revoking oldest blob URL:', error)
          }
        }
      }
      
      // Add to store
      addUploadedModel(uploadedModel)
      setCurrentUploadedModel(uploadedModel)
      setCurrentModel(uploadedModel.id)

      console.log(`🎭 Agent 1: Added uploaded model to store:`, uploadedModel)
      console.log(`🎭 Agent 1: Total uploaded models:`, uploadedModels.length + 1)
      
      setUploadSuccess(`Successfully uploaded ${file.name}`)
      console.log(`🎭 Agent 1: File uploaded successfully: ${file.name}`)
      
      // Clear the input
      event.target.value = ''

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setUploadError(errorMessage)
      console.error('🎭 Agent 1: File upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold text-white">Character Library</h3>
        </div>
      </div>

      {/* Load Model Section */}
      <div className="p-4 border-b border-secondary-700/50">
        <div className="space-y-3">
          {/* Load Selected Model Button */}
          <button
            onClick={loadSelectedModel}
            disabled={!selectedCharacterForLoad || isLoading}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCharacterForLoad && !isLoading
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-secondary-700 text-secondary-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Load Selected Model</span>
              </>
            )}
          </button>

          {/* Custom File Upload */}
          <div className="relative">
            <input
              type="file"
              accept=".fbx,.glb,.gltf,.obj"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="model-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="model-upload"
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isUploading
                  ? 'bg-secondary-700 text-secondary-400 cursor-not-allowed'
                  : 'bg-secondary-600 hover:bg-secondary-700 text-white'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Custom Model</span>
                </>
              )}
            </label>
          </div>

          {/* Upload Status Messages */}
          {uploadError && (
            <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-center space-x-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <Upload className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300">{uploadSuccess}</span>
            </div>
          )}

          {/* File Upload Info */}
          <div className="text-xs text-secondary-400 text-center">
            Supported formats: .fbx, .glb, .gltf, .obj (max 100MB)
          </div>

          {/* Import/Export Buttons */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleImportModels}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="model-import"
              />
              <label
                htmlFor="model-import"
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer bg-secondary-600 hover:bg-secondary-700 text-white"
              >
                <Upload className="w-3 h-3" />
                <span>Import</span>
              </label>
            </div>
            
            <button
              onClick={handleExportModels}
              disabled={uploadedModels.length === 0}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                uploadedModels.length > 0
                  ? 'bg-secondary-600 hover:bg-secondary-700 text-white'
                  : 'bg-secondary-700 text-secondary-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-secondary-700/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search characters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary-800 border border-secondary-600 
                       rounded-lg text-white placeholder-secondary-400 focus:outline-none 
                       focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-4 border-b border-secondary-700/50">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-secondary-400" />
          <span className="text-sm text-secondary-300">Category</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Character Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="model-grid">
          {/* Uploaded Models Section */}
          {uploadedModels.length > 0 && (
            <>
              <div className="col-span-full mb-3">
                <h4 className="text-sm font-medium text-secondary-300 mb-2">Uploaded Models</h4>
              </div>
              {uploadedModels.map(model => (
                <div
                  key={model.id}
                  onClick={() => {
                    setCurrentUploadedModel(model)
                    setCurrentModel(model.id)
                  }}
                  className={`model-item relative group cursor-pointer ${
                    currentModel === model.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  {/* Model thumbnail */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 
                                  flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-200 group-hover:text-white transition-colors" />
                  </div>
                  
                  {/* Model info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent 
                                  p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-medium truncate">
                      {model.name}
                    </p>
                    <p className="text-xs text-blue-300">
                      {(model.size / 1024 / 1024).toFixed(1)}MB
                    </p>
                  </div>

                  {/* Selection indicator */}
                  {currentModel === model.id && (
                    <div className="absolute top-2 right-2 bg-primary-500 rounded-full p-1">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeUploadedModel(model.id)
                      if (currentModel === model.id) {
                        setCurrentModel('char1')
                        setCurrentUploadedModel(null)
                      }
                    }}
                    className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="text-white text-xs">×</span>
                  </button>
                </div>
              ))}
            </>
          )}

          {/* Preset Characters Section */}
          {filteredCharacters.length > 0 && (
            <>
              <div className="col-span-full mb-3">
                <h4 className="text-sm font-medium text-secondary-300 mb-2">Preset Characters</h4>
              </div>
              {filteredCharacters.map(character => (
                <div
                  key={character.id}
                  onClick={() => selectCharacter(character.id)}
                  className={`model-item relative group cursor-pointer ${
                    currentModel === character.id ? 'ring-2 ring-primary-500' : ''
                  } ${selectedCharacterForLoad === character.id ? 'ring-2 ring-green-500' : ''}`}
                >
                  {/* Placeholder thumbnail */}
                  <div className="w-full h-full bg-gradient-to-br from-secondary-700 to-secondary-800 
                                  flex items-center justify-center">
                    <User className="w-8 h-8 text-secondary-400 group-hover:text-primary-400 transition-colors" />
                  </div>
                  
                  {/* Character info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent 
                                  p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-medium truncate">
                      {character.name}
                    </p>
                    <p className="text-xs text-secondary-300">
                      {character.category}
                    </p>
                  </div>

                  {/* Selection indicator */}
                  {currentModel === character.id && (
                    <div className="absolute top-2 right-2 bg-primary-500 rounded-full p-1">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Load indicator */}
                  {selectedCharacterForLoad === character.id && currentModel !== character.id && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <Upload className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Empty state */}
        {filteredCharacters.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-secondary-400">
            <Users className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No characters found</p>
            <p className="text-xs">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-secondary-700/50">
        <div className="text-xs text-secondary-500 text-center">
          {filteredCharacters.length} character{filteredCharacters.length !== 1 ? 's' : ''} available
        </div>
        {selectedCharacterForLoad && (
          <div className="text-xs text-green-400 text-center mt-1">
            Ready to load: {allCharacters.find(c => c.id === selectedCharacterForLoad)?.name}
          </div>
        )}
      </div>
    </div>
  )
}

export default LeftPanel
