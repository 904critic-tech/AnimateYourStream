/**
 * Agent 5 - Composite Iframe FPS Profiler (Toggles)
 * Scenarios: baseline, after autoWeights (helper on), helper hidden (toggleSkeleton)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function measureInFrame(frame) {
  return frame.evaluate(() => {
    return new Promise((resolve) => {
      const out = { fps: 0, frameTime: 0, renderCalls: 0, triangles: 0, memoryMB: 0, minFPS: 999, samples: [] };

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
          // eslint-disable-next-line no-underscore-dangle
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
          if (fps < out.minFPS) out.minFPS = fps;
          if (history.length > 10) history.shift();
          last = t;
        }
        if (frameCount < 300) {
          requestAnimationFrame(loop);
        } else {
          const avg = history.length ? (history.reduce((a,b)=>a+b,0)/history.length) : 0;
          out.fps = Math.round(avg);
          out.frameTime = avg > 0 ? Math.round(1000 / avg) : 0;
          try {
            // eslint-disable-next-line no-underscore-dangle
            const s = window.__AGENT5_RENDER_STATS__ || { drawCalls: 0, triangles: 0 };
            out.renderCalls = s.drawCalls || 0;
            out.triangles = s.triangles || 0;
          } catch (e) {}
          try {
            if ('memory' in performance) {
              // @ts-ignore
              out.memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            }
          } catch (e) {}
          out.samples = history.slice(0);
          resolve(out);
        }
      };
      requestAnimationFrame(loop);
      setTimeout(() => resolve(out), 15000);
    });
  });
}

(async () => {
  const origin = 'http://localhost:3001';
  const url = origin + '/legacy/legacy_composite_sandbox.html';

  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const start = Date.now();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  const loadTime = Date.now() - start;

  await page.waitForSelector('#viewer-frame', { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1200));
  const frameEl = await page.$('#viewer-frame');
  const frame = frameEl ? await frameEl.contentFrame() : null;
  if (!frame) throw new Error('iframe not available');

  // Scenario A: Baseline (no explicit helper)
  const A = await measureInFrame(frame);

  // Scenario B: Build skeleton + autoWeights (helper visible)
  await page.evaluate(() => {
    const frame = document.getElementById('viewer-frame');
    frame?.contentWindow?.postMessage({ scope: 'sandbox', type: 'uiAction', action: 'autoWeights' }, '*');
  });
  await new Promise(r => setTimeout(r, 600));
  const B = await measureInFrame(frame);

  // Scenario C: Helper hidden (toggleSkeleton)
  await page.evaluate(() => {
    const frame = document.getElementById('viewer-frame');
    frame?.contentWindow?.postMessage({ scope: 'sandbox', type: 'uiAction', action: 'toggleSkeleton' }, '*');
  });
  await new Promise(r => setTimeout(r, 300));
  const C = await measureInFrame(frame);

  const results = { loadTime, baseline: A, helperOn: B, helperHidden: C };
  console.log('COMPOSITE_TOGGLE_RESULTS', JSON.stringify(results));

  const outPath = path.join(process.cwd(), 'coordination', 'AGENT_5_COMPOSITE_TOGGLE_PROFILE.md');
  const table = `# Agent 5 – Composite Iframe Toggle Profile\n\n` +
`**Date**: ${new Date().toISOString()}\n\n` +
`| Scenario | FPS | Frame Time (ms) | Render Calls | Triangles | Memory (MB) | Min FPS | Samples |\n` +
`|---|---:|---:|---:|---:|---:|---:|---|\n` +
`| Baseline | ${A.fps} | ${A.frameTime} | ${A.renderCalls} | ${A.triangles.toLocaleString()} | ${A.memoryMB} | ${A.minFPS} | ${A.samples.join(', ')} |\n` +
`| Helper On | ${B.fps} | ${B.frameTime} | ${B.renderCalls} | ${B.triangles.toLocaleString()} | ${B.memoryMB} | ${B.minFPS} | ${B.samples.join(', ')} |\n` +
`| Helper Hidden | ${C.fps} | ${C.frameTime} | ${C.renderCalls} | ${C.triangles.toLocaleString()} | ${C.memoryMB} | ${C.minFPS} | ${C.samples.join(', ')} |\n`;
  fs.writeFileSync(outPath, table);
  console.log('📄 Toggle profile saved to:', outPath);

  await browser.close();
})();


