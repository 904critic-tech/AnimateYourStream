const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const origin = 'http://localhost:3001';
  const url = origin + '/legacy/legacy_composite_sandbox.html';
  // Use headed mode to allow real file download
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 820 });
  
  const artifactsDir = path.join(process.cwd(), 'coordination', 'artifacts');
  try { fs.mkdirSync(artifactsDir, { recursive: true }); } catch {}

  const pageLogs = [];
  page.on('console', (msg) => pageLogs.push(msg.text()));
  page.on('pageerror', (err) => pageLogs.push('[pageerror] ' + err.message));

  // Intercept downloads to capture GLB bytes via CDP
  const client = await page.target().createCDPSession();
  try {
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: artifactsDir });
  } catch (_) {
    try { await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: artifactsDir }); } catch(_) {}
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('HTTP_STATUS', resp && resp.status());

  // Load default model
  await page.click('#load-default').catch(()=>{});
  await sleep(3200);

  // Inject hook in iframe to capture exported Blob and size (best-effort)
  const frameEl = await page.$('#viewer-frame');
  const frame = await frameEl.contentFrame();
  await frame.evaluate(() => {
    try {
      const orig = URL.createObjectURL;
      // @ts-ignore
      window.__lastGLBBlob = null;
      // @ts-ignore
      URL.createObjectURL = function(blob) {
        try { /* @ts-ignore */ window.__lastGLBBlob = blob; } catch(_) {}
        return orig.call(this, blob);
      };
      // Hook anchor clicks to fetch blob URL bytes
      try {
        const origClick = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function() {
          try {
            const href = this && this.href;
            if (href && href.startsWith('blob:')) {
              fetch(href).then(r=>r.arrayBuffer()).then(buf => {
                const bytes = new Uint8Array(buf);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                // @ts-ignore
                window.__glbBase64 = btoa(binary);
                // @ts-ignore
                window.__glbSize = bytes.length;
              }).catch(()=>{});
            }
          } catch(_) {}
          return origClick.apply(this, arguments);
        };
      } catch(_){ }
    } catch (_) {}
  });

  // Trigger Save GLB in iframe via postMessage from parent page
  await page.evaluate(() => {
    const frame = document.getElementById('viewer-frame');
    frame.contentWindow.postMessage({ scope: 'sandbox', type: 'uiAction', action: 'saveGlb' }, '*');
  });
  // Wait for download/capture to complete (poll for up to 15s)
  for (let i = 0; i < 30; i++) {
    // Check iframe-captured size
    try {
      const sz = await frame.evaluate(() => {
        // @ts-ignore
        return (window.__glbSize || (window.__lastGLBBlob && window.__lastGLBBlob.size) || 0);
      });
      if (sz && sz > 1024) break;
    } catch(_) {}
    // Check filesystem downloaded size
    try {
      const entries = fs.readdirSync(artifactsDir)
        .filter(f => /\.(glb|crdownload)$/i.test(f))
        .map(f => ({ f, p: path.join(artifactsDir, f), s: fs.statSync(path.join(artifactsDir, f)).size }))
        .sort((a,b)=>b.s-a.s);
      const top = entries[0];
      if (top && /\.glb$/i.test(top.f) && top.s > 1024) break;
    } catch(_) {}
    await sleep(500);
  }

  // Read captured blob from iframe and persist as artifact (if available)
  let blobInfo = { size: 0, name: 'rigged.glb', base64: '' };
  try {
    blobInfo = await frame.evaluate(async () => {
      // Prefer captured bytes from anchor click
      // @ts-ignore
      if (window.__glbSize && window.__glbBase64) {
        // @ts-ignore
        return { size: window.__glbSize || 0, name: 'rigged.glb', base64: window.__glbBase64 || '' };
      }
      // Fallback to captured Blob
      // @ts-ignore
      const b = window.__lastGLBBlob;
      if (!b) return { size: 0, name: 'rigged.glb', base64: '' };
      const buf = await b.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      return { size: bytes.length, name: 'rigged.glb', base64 };
    });
  } catch (_) {}
  console.log('GLB_CAPTURED', blobInfo.size);
  if (blobInfo && blobInfo.base64) {
    try {
      const bin = Buffer.from(blobInfo.base64, 'base64');
      const outPath = path.join(artifactsDir, blobInfo.name);
      fs.writeFileSync(outPath, bin);
      console.log('ARTIFACT', outPath);
    } catch (e) { console.log('ARTIFACT_ERROR', e && e.message); }
  }

  // If no blob captured via hooks, look for a downloaded .glb in artifactsDir
  let downloaded = null;
  try {
    const before = Date.now() - 60_000;
    const entries = fs.readdirSync(artifactsDir)
      .filter(f => /\.glb$/i.test(f))
      .map(f => ({ f, p: path.join(artifactsDir, f), s: fs.statSync(path.join(artifactsDir, f)).size, t: fs.statSync(path.join(artifactsDir, f)).mtimeMs }))
      .filter(x => x.t >= before)
      .sort((a,b)=>b.t-a.t);
    if (entries.length) downloaded = entries[0];
  } catch(_) {}
  if (downloaded) console.log('GLB_DOWNLOADED', downloaded.p, downloaded.s);

  // Round-trip reload using captured base64
  let roundtrip = false;
  let parseErrors = false;
  try {
    if (blobInfo && blobInfo.size > 0 && blobInfo.base64) {
      await page.evaluate(async ({ base64, name }) => {
        const bin = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const blob = new Blob([bin], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const frame = document.getElementById('viewer-frame');
        frame.contentWindow.postMessage({ scope: 'sandbox', type: 'loadModel', url, name }, '*');
      }, { base64: blobInfo.base64, name: 'roundtrip.glb' });
      await sleep(1600);
      // Confirm load via logs
      roundtrip = pageLogs.some((l)=>/\[iframe\] load begin: blob:/i.test(l));
    } else if (downloaded && downloaded.s > 0) {
      // Round-trip using downloaded file
      const buf = fs.readFileSync(downloaded.p);
      const base64 = buf.toString('base64');
      // Use Select Model flow (file input) on parent page to mirror real UX
      await page.waitForSelector('#file-input');
      // Prefer modern API
      try { await page.setInputFiles('#file-input', downloaded.p); }
      catch { const input = await page.$('#file-input'); await input.uploadFile(downloaded.p); }
      // Wait for iframe load logs up to 10s
      for (let i=0;i<20;i++) {
        if (pageLogs.some((l)=>/\[iframe\] load begin: blob:/i.test(l) || /\[iframe\] gltf stats:/i.test(l) || /\[iframe\] model loaded/i.test(l))) { roundtrip = true; break; }
        await sleep(500);
      }
    }
  } catch (_) {}

  // Detect parse/load errors in logs
  parseErrors = pageLogs.some((l) => /glb load error|load failed/i.test(l));
  console.log('ROUNDTRIP', roundtrip);
  console.log('NO_PARSE_ERRORS', !parseErrors);
  console.log('SIZE_OK', (downloaded && downloaded.s > 100000) || (blobInfo && blobInfo.size > 100000));
  console.log('PAGE_LOGS_START');
  pageLogs.forEach(l => console.log(l));
  console.log('PAGE_LOGS_END');

  await browser.close();
  const sizeOk = (downloaded && downloaded.s > 100000) || (blobInfo && blobInfo.size > 100000);
  const ok = roundtrip && !parseErrors && sizeOk;
  process.exit(ok ? 0 : 2);
})();


