/* Simple local build service to generate and rig a character from an image.
 * POST /api/build  (multipart/form-data)
 *   - field: characterName (string)
 *   - file: image (jpg/png)
 * Spawns PowerShell to run scripts/build_character_from_image.ps1
 */

const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const app = express()
app.use(cors())

const uploadRoot = path.join(process.cwd(), '.tmp', 'uploads')
fs.mkdirSync(uploadRoot, { recursive: true })

// Lightweight readiness endpoint for background agents/monitors
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'builder', uploadRoot, cwd: process.cwd(), pid: process.pid })
})

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const safe = Date.now() + '_' + String(file.originalname || 'image').replace(/[^a-zA-Z0-9_.-]/g, '_')
    cb(null, safe)
  }
})
const upload = multer({ storage })

app.post('/api/build', upload.single('image'), async (req, res) => {
  try {
    const file = req.file
    const characterName = String(req.body.characterName || '').trim() || 'NewCharacter'
    if (!file) return res.status(400).json({ ok: false, error: 'No image uploaded' })

    const imagePath = path.resolve(file.path)
    const scriptPath = path.join(process.cwd(), 'scripts', 'build_character_from_image.ps1')
    const args = ['-File', scriptPath, '-ImagePath', imagePath, '-CharacterName', characterName]

    const logs = []
    const child = spawn('pwsh', args, { cwd: process.cwd(), windowsHide: true })
    child.stdout.on('data', (d) => logs.push(String(d)))
    child.stderr.on('data', (d) => logs.push(String(d)))

    child.on('close', (code) => {
      const outputUrl = `/Default_Characters/${characterName}/${characterName}.glb`
      res.json({ ok: code === 0, code, outputUrl, logs: logs.join('') })
    })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message || e) })
  }
})

// --- Agent 6: MVP route using Node script (Linux/macOS-friendly) ---
app.post('/api/image3d/mvp', upload.single('image'), async (req, res) => {
  try {
    const file = req.file
    const slug = String(req.body.slug || '').trim() || 'sample'
    if (!file) return res.status(400).json({ ok: false, error: 'No image uploaded' })

    const imagePath = path.resolve(file.path)
    const nodeArgs = ['scripts/image_to_3d/single_image_mvp.cjs', '--input', imagePath, '--slug', slug]

    const logs = []
    const child = spawn(process.execPath, nodeArgs, { cwd: process.cwd(), windowsHide: true })
    child.stdout.on('data', (d) => logs.push(String(d)))
    child.stderr.on('data', (d) => logs.push(String(d)))
    child.on('close', (code) => {
      const outputUrl = `/Default_Characters/generated/${slug}/model.glb`
      res.json({ ok: code === 0, code, outputUrl, logs: logs.join('') })
    })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message || e) })
  }
})

const port = process.env.BUILDER_PORT ? Number(process.env.BUILDER_PORT) : 4001
app.listen(port, () => {
  console.log(`[builder] listening on http://127.0.0.1:${port}`)
})


