/**
 * Agent 5 - Composite vs Baseline Metrics Comparator
 *
 * Usage:
 *   node scripts/agent5_compare_composite_metrics.cjs \
 *     --base http://localhost:3001/ \
 *     --composite http://localhost:3001/legacy/legacy_composite_sandbox.html \
 *     [--watch 30] [--timeout 900]
 *
 * - If --watch is provided, the script will poll the composite URL every N seconds
 *   until it becomes available (HTTP 200) or until --timeout seconds elapse.
 * - Once available, it will measure both pages and write a report to
 *   coordination/AGENT_5_COMPOSITE_METRICS.md
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { base: 'http://localhost:3001/', composite: 'http://localhost:3001/legacy/legacy_composite_sandbox.html', watch: 0, timeout: 0 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const v = argv[i + 1];
    if (a === '--base' && v) { args.base = v; i++; }
    else if (a === '--composite' && v) { args.composite = v; i++; }
    else if (a === '--watch' && v) { args.watch = parseInt(v, 10) || 0; i++; }
    else if (a === '--timeout' && v) { args.timeout = parseInt(v, 10) || 0; i++; }
  }
  return args;
}

async function checkAvailable(url) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function measurePage(url) {
  console.log(`\n🔍 Measuring: ${url}`);
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Capture console errors/warnings
  let errorCount = 0;
  let warnCount = 0;
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') errorCount++;
    if (type === 'warning') warnCount++;
  });
  page.on('pageerror', () => { errorCount++; });

  const start = Date.now();
  await page.goto(url, { waitUntil: 'networkidle2' });
  const loadTime = Date.now() - start;

  // Measure with WebGL hooks + rAF FPS (5s)
  const metrics = await page.evaluate(() => {
    return new Promise(resolve => {
      const out = {
        fps: 0,
        frameTime: 0,
        renderCalls: 0,
        triangles: 0,
        memoryMB: 0,
        qualityLevel: 'unknown'
      };

      (function installGLHooks() {
        try {
          const stats = { drawCalls: 0, triangles: 0 };
          function hookContext(gl) {
            if (!gl || gl.__agent5Hooked) return;
            const origDrawElements = gl.drawElements?.bind(gl);
            const origDrawArrays = gl.drawArrays?.bind(gl);
            if (origDrawElements) {
              gl.drawElements = function(mode, count, type, offset) {
                stats.drawCalls++;
                if (mode === gl.TRIANGLES && typeof count === 'number') {
                  stats.triangles += Math.floor(count / 3);
                }
                return origDrawElements(mode, count, type, offset);
              };
            }
            if (origDrawArrays) {
              gl.drawArrays = function(mode, first, count) {
                stats.drawCalls++;
                if (mode === gl.TRIANGLES && typeof count === 'number') {
                  stats.triangles += Math.floor(count / 3);
                }
                return origDrawArrays(mode, first, count);
              };
            }
            gl.__agent5Hooked = true;
          }

          const canvases = Array.from(document.querySelectorAll('canvas'));
          canvases.forEach(c => {
            try {
              const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
              if (gl) hookContext(gl);
            } catch (e) {}
          });

          const origGetContext = HTMLCanvasElement.prototype.getContext;
          if (!HTMLCanvasElement.prototype.__agent5Patched) {
            HTMLCanvasElement.prototype.getContext = function(type, attrs) {
              const ctx = origGetContext.call(this, type, attrs);
              if (ctx && type && String(type).includes('webgl')) {
                try { hookContext(ctx); } catch (e) {}
              }
              return ctx;
            };
            HTMLCanvasElement.prototype.__agent5Patched = true;
          }

          window.__AGENT5_RENDER_STATS__ = stats;
        } catch (e) {}
      })();

      let frameCount = 0;
      let last = performance.now();
      const history = [];
      const loop = (t) => {
        frameCount++;
        const dt = t - last;
        if (frameCount % 60 === 0) {
          const fps = Math.round(1000 / (dt / 60));
          history.push(fps);
          if (history.length > 10) history.shift();
          last = t;
        }
        if (frameCount < 300) {
          requestAnimationFrame(loop);
        } else {
          const avg = history.length ? (history.reduce((a,b)=>a+b,0)/history.length) : 0;
          out.fps = Math.round(avg);
          out.frameTime = avg > 0 ? Math.round(1000 / avg) : 0;
          if (avg >= 55) out.qualityLevel = 'ULTRA';
          else if (avg >= 45) out.qualityLevel = 'HIGH';
          else if (avg >= 30) out.qualityLevel = 'MEDIUM';
          else out.qualityLevel = 'LOW';
          try {
            const s = window.__AGENT5_RENDER_STATS__ || { drawCalls: 0, triangles: 0 };
            out.renderCalls = s.drawCalls || 0;
            out.triangles = s.triangles || 0;
          } catch (e) {}
          try {
            if ('memory' in performance) {
              out.memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            }
          } catch (e) {}
          resolve(out);
        }
      };
      requestAnimationFrame(loop);
      setTimeout(() => resolve(out), 15000);
    });
  });

  await browser.close();

  return {
    url,
    loadTimeMs: loadTime,
    fps: metrics.fps,
    frameTimeMs: metrics.frameTime,
    renderCalls: metrics.renderCalls,
    triangles: metrics.triangles,
    memoryMB: metrics.memoryMB,
    qualityLevel: metrics.qualityLevel,
    consoleErrors: errorCount,
    consoleWarnings: warnCount
  };
}

function writeReport(base, comp, outPath) {
  const delta = (a, b) => (b - a);
  const report = `# Agent 5 Composite vs Baseline Metrics\n\n` +
`**Generated**: ${new Date().toISOString()}\n\n` +
`## Baseline (${base.url})\n` +
`- Load Time: ${base.loadTimeMs} ms\n` +
`- FPS: ${base.fps} (frame time ${base.frameTimeMs} ms, ${base.qualityLevel})\n` +
`- Render Calls: ${base.renderCalls}\n` +
`- Triangles: ${base.triangles.toLocaleString()}\n` +
`- Memory: ${base.memoryMB} MB\n` +
`- Console: ${base.consoleErrors} errors, ${base.consoleWarnings} warnings\n\n` +
`## Composite (${comp.url})\n` +
`- Load Time: ${comp.loadTimeMs} ms\n` +
`- FPS: ${comp.fps} (frame time ${comp.frameTimeMs} ms, ${comp.qualityLevel})\n` +
`- Render Calls: ${comp.renderCalls}\n` +
`- Triangles: ${comp.triangles.toLocaleString()}\n` +
`- Memory: ${comp.memoryMB} MB\n` +
`- Console: ${comp.consoleErrors} errors, ${comp.consoleWarnings} warnings\n\n` +
`## Delta (Composite - Baseline)\n` +
`- Load Time Δ: ${delta(base.loadTimeMs, comp.loadTimeMs)} ms\n` +
`- FPS Δ: ${delta(base.fps, comp.fps)}\n` +
`- Render Calls Δ: ${delta(base.renderCalls, comp.renderCalls)}\n` +
`- Triangles Δ: ${delta(base.triangles, comp.triangles).toLocaleString()}\n` +
`- Memory Δ: ${delta(base.memoryMB, comp.memoryMB)} MB\n`;

  fs.writeFileSync(outPath, report);
  console.log(`\n📄 Metrics report saved to: ${outPath}`);
}

async function main() {
  const args = parseArgs(process.argv);
  console.log('🚀 Agent 5: Composite vs Baseline Metrics Comparator');
  console.log(`Base URL: ${args.base}`);
  console.log(`Composite URL: ${args.composite}`);

  if (args.watch > 0) {
    console.log(`⏳ Watch mode enabled: checking composite every ${args.watch}s (timeout ${args.timeout || 'none'}s)`);
    const start = Date.now();
    while (true) {
      const available = await checkAvailable(args.composite);
      if (available) break;
      const elapsed = (Date.now() - start) / 1000;
      if (args.timeout && elapsed >= args.timeout) {
        console.log('⌛ Timeout waiting for composite page to become available. Exiting.');
        process.exit(2);
      }
      console.log('… Composite not yet available; will retry');
      await new Promise(r => setTimeout(r, args.watch * 1000));
    }
  }

  // Measure baseline and composite
  const base = await measurePage(args.base);
  const comp = await measurePage(args.composite);

  // Write report
  const outPath = path.join(process.cwd(), 'coordination', 'AGENT_5_COMPOSITE_METRICS.md');
  writeReport(base, comp, outPath);

  // Print concise summary
  console.log(`\n📊 Summary:`);
  console.log(`Baseline FPS ${base.fps}, Composite FPS ${comp.fps}`);
  console.log(`Baseline Load ${base.loadTimeMs}ms, Composite Load ${comp.loadTimeMs}ms`);
}

main().catch(err => {
  console.error('❌ Comparator failed:', err?.message || err);
  process.exit(1);
});


