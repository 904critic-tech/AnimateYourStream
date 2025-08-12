import { useCallback, useMemo, useRef, useState } from 'react'

function CharacterBuilderPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [characterName, setCharacterName] = useState('CRZ_9_Fortnite')
  const [notes, setNotes] = useState<string>('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setSelectedFile(f)
  }, [])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<string | null>(null)

  const command = useMemo(() => {
    const placeholderPath = selectedFile?.name ? `C:/path/to/${selectedFile.name}` : 'C:/path/to/your_concept.jpg'
    return `pwsh -File scripts/build_character_from_image.ps1 -ImagePath "${placeholderPath}" -CharacterName "${characterName}"`
  }, [selectedFile?.name, characterName])

  const onSubmit = useCallback(async () => {
    if (!selectedFile) {
      alert('Pick an image first')
      return
    }
    setIsSubmitting(true)
    setResultUrl(null)
    setLogs(null)
    try {
      const form = new FormData()
      form.append('characterName', characterName)
      form.append('image', selectedFile)
      const resp = await fetch('http://127.0.0.1:4001/api/build', { method: 'POST', body: form })
      const json = await resp.json()
      setLogs(json.logs || '')
      if (json.ok) {
        setResultUrl(json.outputUrl)
      } else {
        alert('Build failed. See logs below.')
      }
    } catch (e) {
      alert('Request failed. Ensure the local builder service is running (npm run builder:serve).')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedFile, characterName])

  const publicUrl = useMemo(() => `/Default_Characters/${characterName}/${characterName}.glb`, [characterName])

  return (
    <div className="w-full min-h-screen bg-zinc-900 text-white">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-semibold mb-2">Character Builder (Beta)</h1>
        <p className="text-sm text-zinc-300 mb-6">Generate a rigged GLB from a concept image using the local pipeline. This prepares the model for import into the viewer.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Character Name</label>
            <input value={characterName} onChange={e => setCharacterName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
            <p className="text-xs text-zinc-400 mt-1">Output will be placed under public/Default_Characters/{characterName}/ and served at {publicUrl}</p>
          </div>

          <div>
            <label className="block text-sm mb-2">Concept Image (JPG/PNG)</label>
            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png" onChange={onPick} className="block" />
            {selectedFile && (
              <div className="text-xs text-zinc-400 mt-2">Selected: {selectedFile.name}</div>
            )}
            <div className="flex gap-2 mt-3">
              <button disabled={!selectedFile || isSubmitting} onClick={onSubmit} className={`px-3 py-1.5 text-sm rounded ${isSubmitting? 'bg-zinc-700' : 'bg-green-600 hover:bg-green-700'}`}>{isSubmitting? 'Building...' : 'Build Character'}</button>
              {resultUrl && <a href={resultUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded">Open Result</a>}
            </div>
            {logs && (
              <pre className="mt-3 text-xs bg-zinc-800 border border-zinc-700 rounded p-2 overflow-auto max-h-56 whitespace-pre-wrap">{logs}</pre>
            )}
            <p className="text-xs text-zinc-400 mt-1">Or run manually using the command below.</p>
          </div>

          <div>
            <label className="block text-sm mb-2">Build Command</label>
            <textarea readOnly value={command} className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs font-mono" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => navigator.clipboard.writeText(command)} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded">Copy</button>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded">Open Output URL</a>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Run this in PowerShell from the project root. Edit the -ImagePath to your actual file path. When it finishes, refresh the app. The character appears in the Left Panel automatically.</p>
          </div>

          <div>
            <label className="block text-sm mb-2">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Pose/style notes for the modeler" className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharacterBuilderPage


