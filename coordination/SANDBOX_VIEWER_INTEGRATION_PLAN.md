# Sandbox Viewer Integration Plan (Viewer Beta Route)

Purpose
- Embed `public/legacy/viewer_iframe.html` inside the main app behind a feature flag, with a minimal parent↔iframe bridge.

Route
- New route name: Viewer (Beta)
- Path: `/viewer-beta`
- Implementation: Parent page renders an `<iframe src="/legacy/viewer_iframe.html">`

Feature Flag
- Vite env: `VITE_ENABLE_VIEWER_BETA=true`
- Parent checks `import.meta.env.VITE_ENABLE_VIEWER_BETA === 'true'`

Bridge: PostMessage Schema
- Parent → Iframe messages
  - `{ scope:'sandbox', type:'loadModel', url, name, manifest? }`
  - `{ scope:'sandbox', type:'uiAction', action:'placeMarkers'|'autoWeights'|'playIdle'|'stop'|'saveGlb'|'clear'|'toggleSkeleton'|'resetMarkers' }`
  - `{ scope:'sandbox', type:'uiAction', action:'startGuided', labels:string[] }`
- Iframe → Parent messages
  - `{ scope:'sandbox', type:'iframeLog', message:string }`

Offline Vendorization
- All scripts loaded by the iframe must reside under `/legacy/vendor/`
- `three.module.js` and `examples/jsm/*` copied via `scripts/copy_three_examples.cjs`
- DRACO/KTX2/Meshopt support present under `/legacy/vendor/examples/jsm/libs/*`

Isolation
- No imports from `src/*` inside the iframe page
- No CDN usage; DevTools Offline mode must show zero failed third‑party requests

Acceptance
- Navigating to `/viewer-beta` displays the iframe and overlay logs
- Parent page buttons post messages and logs are received from iframe
- With DevTools Offline, no third‑party requests occur; default FBX autoload works
- Switching between main app routes and `/viewer-beta` shows no `THREE` identity conflicts

Notes
- Keep the parent route implementation minimal; all viewer logic remains within the iframe
- If any 404 appears (e.g., favicon), document the fix path in `SERVER_STATUS_TRACKER.md`


