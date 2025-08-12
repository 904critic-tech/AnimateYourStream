/*
 * Agent 2 - GPU Capabilities Collector (Puppeteer)
 * Non-invasive script to collect WebGL GPU capabilities in-browser
 * against the already running dev server (no server restarts).
 */

const puppeteer = require('puppeteer')

const TARGET = {
  MAX_COMBINED_TEXTURE_IMAGE_UNITS: 64,
  MAX_TEXTURE_IMAGE_UNITS: 32,
  MAX_VERTEX_TEXTURE_IMAGE_UNITS: 32,
  MAX_TEXTURE_SIZE: 8192,
  MAX_CUBE_MAP_TEXTURE_SIZE: 16384,
  MAX_VERTEX_UNIFORM_VECTORS: 4096,
  MAX_FRAGMENT_UNIFORM_VECTORS: 4096,
  MAX_VARYING_VECTORS: 31,
  MAX_VERTEX_ATTRIBS: 16,
  MAX_RENDERBUFFER_SIZE: 8192,
  MAX_VIEWPORT_DIMS: [8192, 8192],
  ALIASED_POINT_SIZE_RANGE: [1, 1023],
  ALIASED_LINE_WIDTH_RANGE: [1, 1],
  SAMPLE_BUFFERS: 1,
  RED_BITS: 8,
  GREEN_BITS: 8,
  BLUE_BITS: 8,
  ALPHA_BITS: 8,
  DEPTH_BITS: 24,
}

function diffCaps(current) {
  const differences = []
  let matches = 0
  let total = 0
  for (const key of Object.keys(TARGET)) {
    total++
    const target = TARGET[key]
    const value = current[key]
    const isArray = Array.isArray(target)
    const equal = isArray
      ? Array.isArray(value) && value.length === target.length && target.every((v, i) => v === value[i])
      : target === value
    if (!equal) differences.push({ parameter: key, current: value, target })
    else matches++
  }
  const score = total > 0 ? Number(((matches / total) * 100).toFixed(1)) : 0
  return { differences, score, matches, total }
}

async function run() {
  console.log('🔧 Agent 2: Starting GPU capabilities collection...')
  let browser
  try {
    browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()

    // Pipe browser console to Node console
    page.on('console', msg => console.log(`📱 Browser: ${msg.type()} - ${msg.text()}`))

    const url = 'http://localhost:3001/'
    await page.goto(url, { waitUntil: 'domcontentloaded' })

    const result = await page.evaluate(() => {
      function collect(gl) {
        if (!gl) return null
        const caps = {
          MAX_COMBINED_TEXTURE_IMAGE_UNITS: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
          MAX_TEXTURE_IMAGE_UNITS: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
          MAX_VERTEX_TEXTURE_IMAGE_UNITS: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
          MAX_TEXTURE_SIZE: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          MAX_CUBE_MAP_TEXTURE_SIZE: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
          MAX_VERTEX_UNIFORM_VECTORS: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
          MAX_FRAGMENT_UNIFORM_VECTORS: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
          MAX_VARYING_VECTORS: gl.getParameter(gl.MAX_VARYING_VECTORS),
          MAX_VERTEX_ATTRIBS: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
          MAX_RENDERBUFFER_SIZE: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
          MAX_VIEWPORT_DIMS: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
          ALIASED_POINT_SIZE_RANGE: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
          ALIASED_LINE_WIDTH_RANGE: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
          SAMPLE_BUFFERS: gl.getParameter(gl.SAMPLE_BUFFERS),
          RED_BITS: gl.getParameter(gl.RED_BITS),
          GREEN_BITS: gl.getParameter(gl.GREEN_BITS),
          BLUE_BITS: gl.getParameter(gl.BLUE_BITS),
          ALPHA_BITS: gl.getParameter(gl.ALPHA_BITS),
          DEPTH_BITS: gl.getParameter(gl.DEPTH_BITS),
          EXTENSIONS: gl.getSupportedExtensions() || [],
          DEBUG_INFO: null,
        }
        const dbg = gl.getExtension('WEBGL_debug_renderer_info')
        if (dbg) {
          caps.DEBUG_INFO = {
            UNMASKED_RENDERER_WEBGL: gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL),
            UNMASKED_VENDOR_WEBGL: gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL),
          }
        }
        return caps
      }

      // Use an offscreen canvas to avoid relying on app internals
      const canvas = document.createElement('canvas')
      const gl2 = canvas.getContext('webgl2')
      const gl1 = gl2 ? null : canvas.getContext('webgl')
      const gl = gl2 || gl1
      const contextType = gl2 ? 'webgl2' : (gl1 ? 'webgl' : 'none')
      const caps = collect(gl)
      return { contextType, caps }
    })

    if (!result || !result.caps) {
      console.log('❌ Agent 2: Failed to obtain WebGL context/capabilities')
      process.exit(1)
    }

    const { differences, score } = diffCaps(result.caps)

    console.log('\n🔧 GPU Capabilities Analysis:')
    console.log(`Context: ${result.contextType}`)
    if (result.caps.DEBUG_INFO) console.log('GPU:', result.caps.DEBUG_INFO)
    console.log(`Compatibility Score: ${score}%`)
    if (differences.length) {
      console.log('⚠️ Differences:')
      for (const d of differences) console.log(`  ${d.parameter}: ${d.current} (current) vs ${d.target} (target)`) 
    } else {
      console.log('✅ All target parameters matched')
    }

    // Basic signals for downstream parsing
    console.log('\n✅ Agent 2: GPU capabilities collection complete')
    await browser.close()
    process.exit(0)
  } catch (err) {
    if (browser) try { await browser.close() } catch {}
    console.error('❌ Agent 2: GPU capabilities collection failed:', err.message)
    process.exit(1)
  }
}

run()


