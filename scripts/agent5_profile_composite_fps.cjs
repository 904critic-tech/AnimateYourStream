/**
 * Agent 5 - Composite Iframe FPS Profiler
 * Measures FPS and WebGL stats inside the iframe of legacy_composite_sandbox.html
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const origin = 'http://localhost:3001';
  const url = origin + '/legacy/legacy_composite_sandbox.html';

  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const start = Date.now();
  const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  const loadTime = Date.now() - start;
  console.log('HTTP_STATUS', resp && resp.status());
  console.log('LOAD_TIME_MS', loadTime);

  // Wait briefly for iframe to initialize
  await page.waitForSelector('#viewer-frame', { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1500));

  const frameEl = await page.$('#viewer-frame');
  const frame = frameEl ? await frameEl.contentFrame() : null;
  if (!frame) {
    console.log('ERROR', 'Iframe not available');
    await browser.close();
    process.exit(2);
  }

  // Measure FPS and install GL hooks inside the iframe
  const metrics = await frame.evaluate(() => {
    return new Promise((resolve) => {
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

          // Expose stats
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
          resolve(out);
        }
      };
      requestAnimationFrame(loop);
      setTimeout(() => resolve(out), 15000);
    });
  });

  console.log('COMPOSITE_IFRAME_METRICS', JSON.stringify(metrics));

  try {
    const outPath = path.join(process.cwd(), 'coordination', 'AGENT_5_COMPOSITE_IFRAME_PROFILE.md');
    const content = `# Agent 5 – Composite Iframe Profile\n\n` +
      `**Date**: ${new Date().toISOString()}\n\n` +
      `- Load Time: ${loadTime} ms\n` +
      `- FPS: ${metrics.fps} (frame time ${metrics.frameTime} ms, ${metrics.qualityLevel})\n` +
      `- Render Calls: ${metrics.renderCalls}\n` +
      `- Triangles: ${metrics.triangles.toLocaleString()}\n` +
      `- Memory: ${metrics.memoryMB} MB\n`;
    fs.writeFileSync(outPath, content);
    console.log('📄 Iframe profile saved to:', outPath);
  } catch (_) {}

  await browser.close();
})();


