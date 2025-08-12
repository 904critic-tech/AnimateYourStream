# Composite Sandbox – Verold + Mixamo (Implementation Task List)

Purpose: Build a working composite sandbox that loads the full `from mixamo` package together with Verold for a legacy model viewer/auto‑rigger demonstration, without impacting the main app.

Constraints
- Do not import from `src/` and do not modify bundler config.
- All legacy assets must be served from `public/legacy/mixamo/` (mirrored copies). Originals in `from mixamo/` remain untouched.
- Use kebab‑case filenames for mirrored copies when originals contain spaces.

Assigned implementer
- Agent 2 (Performance) only. No other agents receive implementation tasks at this stage [[memory:5734692]].

Directory structure to create
- `public/legacy/`
- `public/legacy/mixamo/`

Asset mirroring (create kebab‑case copies in `public/legacy/mixamo/`)
- Copy these files as‑is:
  - `verold-runtime-0.7.15.js`
  - `mixamo.min.1295a6f5.js`
  - `mixamo.min.383f19bc.css`
  - `satelliteLib-5c269fd83f94b310937d9e19eb1661440562b559.js` (exact filename may vary; use the one in `from mixamo/`)
- Sanitize filenames with spaces to kebab‑case:
  - `Renderer.js` → `renderer.js`
  - `Render View.js` → `render-view.js`
  - `Orbit Camera Controller.js` → `orbit-camera-controller.js`
  - `Default Filters.js` → `default-filters.js`
  - `Annotation.js` → `annotation.js`
  - `Curve.js` → `curve.js`
  - `Cube-Map Capture.js` → `cube-map-capture.js`
  - `Reflection Capture Plane.js` → `reflection-capture-plane.js`
  - `Sphere-Map Capture.js` → `sphere-map-capture.js`

Composite sandbox page to create
- File: `public/legacy/legacy_composite_sandbox.html`
- Requirements:
  - Include CSS in `<head>`:
    - `<link rel="stylesheet" href="/legacy/mixamo/mixamo.min.383f19bc.css">`
  - Minimal body:
    - `<canvas id="viewer" style="width:100vw;height:100vh;display:block;background:#000"></canvas>`
    - `<div id="logs" style="position:fixed;left:8px;bottom:8px;color:#0f0;font:12px monospace"></div>`
  - Script tags in this exact order (adjust the satellite file name to match the mirrored copy):
    1) `/legacy/mixamo/verold-runtime-0.7.15.js`
    2) `/legacy/mixamo/satelliteLib-5c269fd83f94b310937d9e19eb1661440562b559.js`
    3) `/legacy/mixamo/mixamo.min.1295a6f5.js`
    4) `/legacy/mixamo/renderer.js`
    5) `/legacy/mixamo/render-view.js`
    6) `/legacy/mixamo/orbit-camera-controller.js`
    7) `/legacy/mixamo/default-filters.js`
    8) `/legacy/mixamo/annotation.js`
    9) `/legacy/mixamo/curve.js`
    10) `/legacy/mixamo/cube-map-capture.js`
    11) `/legacy/mixamo/reflection-capture-plane.js`
    12) `/legacy/mixamo/sphere-map-capture.js`
  - Inline init script (implementation required):
    - Log presence of globals: `window.VAPI`, `window.THREE`.
    - Assert no overwrite of our app’s `THREE` when navigating between routes.
    - Attempt minimal scene init using whatever viewer entrypoints are exposed by the mirrored scripts.
    - If a documented viewer constructor exists (e.g., `RenderView`/`Renderer`), instantiate with the `<canvas id="viewer">` handle.
    - If a loader hook exists, attempt to load `public/models/Default_Model.fbx`. Otherwise, render a colored clear and orbit control camera if available.
    - Write high‑level status messages to the `#logs` div (e.g., "initialized", "viewer ready", "model load attempted/succeeded/failed").

Dependency ordering validation (implementation required)
- If consoles show unresolved symbols from viewer utilities, adjust the order minimally to satisfy the dependency (keep Verold first, Mixamo core next).
- If `satelliteLib-*.js` is unused, you may comment out its tag in the sandbox page (but document the change at the top of the HTML as a comment).

Acceptance checklist (must all pass)
- Page loads with zero console errors and shows log messages in `#logs`.
- `window.VAPI` exists; no runtime exceptions from Mixamo scripts.
- No `THREE` conflicts with the main app when switching between main routes and the sandbox.
- A visible rendered output exists (solid clear color at minimum). Bonus: the default FBX model loads in the sandbox.
- No modifications to any `src/*` files.

Deliverables
- `public/legacy/legacy_composite_sandbox.html` (with inline init and logs).
- Mirrored assets in `public/legacy/mixamo/` with kebab‑case names.
- A short note at the top of the HTML (<!- - comment - ->) documenting final load order and any deviations.

Notes
- Keep the sandbox strictly isolated. Do not add imports into the main bundle. Use only `<script>` tags referencing files in `public/legacy/mixamo/`.
- If any asset is missing or fails to load due to pathing, fix the path using the mirrored directory only; do not reference the originals in `from mixamo/` at runtime.

---

# Agent 3 – Sandbox Autorigger & Viewer Readiness (Implementation Tasks)

Scope
- Files only: `public/legacy/legacy_composite_sandbox.html`, `public/legacy/viewer_iframe.html`
- No changes to `src/*`; no network calls (offline only)

1) Add missing viewer libs (iframe)
- In `public/legacy/viewer_iframe.html`, add:
  - GLTFExporter: `https://unpkg.com/three@0.150.1/examples/js/exporters/GLTFExporter.js`
  - OrbitControls (optional): `https://unpkg.com/three@0.150.1/examples/js/controls/OrbitControls.js`
- Acceptance: `THREE.GLTFLoader`, `THREE.FBXLoader`, `THREE.GLTFExporter` (and optionally `THREE.OrbitControls`) exist

2) UI actions from main page → iframe
- In `legacy_composite_sandbox.html` add buttons: Place Markers, Auto Weights, Play Idle, Stop, Save GLB, Clear (next to Select Model)
- On click, postMessage to iframe: `{ type: 'uiAction', action: 'placeMarkers'|'autoWeights'|'playIdle'|'stop'|'saveGlb'|'clear' }`
- Acceptance: iframe logs receipt of each action

3) Camera controls (iframe)
- In `viewer_iframe.html`, instantiate OrbitControls with camera+canvas and update in render loop

4) Marker placement mode (iframe)
- Implement ‘placeMarkers’ with required order:
  head, neck, left_shoulder, right_shoulder, left_elbow, right_elbow, left_wrist, right_wrist, spine_mid, hips, left_knee, right_knee, left_ankle, right_ankle
- Raycast clicks → place small sphere markers; store world positions
- Backspace = undo last marker; ‘clear’ removes all
- Acceptance: all landmarks can be placed with visual feedback

5) Skeleton generation (offline) (iframe)
- Build bones:
  Hips → Spine → Chest → Neck → Head
  Chest → Shoulder(L/R) → Elbow(L/R) → Wrist(L/R)
  Hips → UpperLeg(L/R) → Knee(L/R) → Ankle(L/R)
- Position from markers (world→local); create `THREE.Skeleton`; add `THREE.SkeletonHelper`
- Acceptance: helper aligns to markers

6) Lightweight skin binding (offline) (iframe)
- If mesh not skinned: convert to `SkinnedMesh`
- Compute ≤4 bone weights/vertex via nearest bone segments (inverse-distance), normalize; clamp cross-limb bleed
- Bind: `skinnedMesh.bind(new THREE.Skeleton(bones), bindMatrix)`
- Acceptance: rotating limb bones deforms mesh plausibly

7) Retargeting / motion test (offline) (iframe)
- Detect existing rig (SkinnedMesh) and map bone names to canonical set
- Provide motions:
  - Idle (procedural sway or small keyframed clip)
  - Walk-in-place (minimal procedural swing acceptable)
- Actions: ‘playIdle’ starts loop, ‘stop’ halts mixer/procedural
- Acceptance: motions play without errors; lip/jaw unaffected (if present)

8) Save GLB (offline) (iframe)
- ‘saveGlb’: export current rigged object to GLB using GLTFExporter (binary:true), exclude helpers/markers
- Download `<name>-rigged.glb`; verify reload via Select Model preserves rig and idle

9) Robustness and cleanup
- Large files: use blob URLs; revoke on ‘clear’/unload
- ‘clear’: remove markers/helpers/currentRoot; dispose geometries/materials; log “cleared”
- Errors: concise overlay + console messages; never crash

10) Ready-for-test criteria (all must pass)
- Upload GLB/FBX → renders instantly; no console errors
- Unrigged mesh: Place Markers → Auto Weights → Play Idle works
- Save GLB → reload → rig + idle persist
- Rigged models: Play Idle works without markers
- Offline only; FPS stable



---

# Agent 2 – Offline Vendorization & Iframe Route Integration (Implementation Tasks)

Scope
- Ensure viewer and autorigger function with zero third‑party network calls (offline) and prepare main‑app iframe route integration. No legacy AMD code may be imported into `src/*`.

0) Create vendor directories
- Create `public/legacy/vendor/`
- Create `public/legacy/vendor/examples/js/` and `public/legacy/vendor/examples/jsm/`

1) Vendorize external libs used by `viewer_iframe.html`
- Replace all unpkg CDN `<script>` tags with local files:
  - three.min.js (or three.module.js for ESM contexts)
  - examples/js/loaders/GLTFLoader.js
  - examples/js/loaders/FBXLoader.js
  - examples/js/exporters/GLTFExporter.js
  - examples/js/controls/OrbitControls.js
  - Any decoders used (DRACO/Meshopt): vendor their JS/WASM into `public/legacy/vendor/` and update paths
- Use `scripts/copy_three_examples.cjs` as needed to bulk copy `three/examples/jsm` into `public/legacy/vendor/examples/jsm/` and place non‑module `.js` shims under `examples/js/` if required by the iframe
- Acceptance: `viewer_iframe.html` loads with DevTools set to “Offline”; no failed network requests

2) Update `viewer_iframe.html` script tags to local paths
- Example replacements:
  - `/legacy/vendor/three.min.js`
  - `/legacy/vendor/examples/js/loaders/GLTFLoader.js`
  - `/legacy/vendor/examples/js/loaders/FBXLoader.js`
  - `/legacy/vendor/examples/js/exporters/GLTFExporter.js`
  - `/legacy/vendor/examples/js/controls/OrbitControls.js`
- Acceptance: Selecting a local GLB renders; console shows 0 external fetches

3) Verify composite sandbox page still isolates legacy libs
- Ensure `public/legacy/legacy_composite_sandbox.html` continues to load Verold + Mixamo + viewer utilities without pulling from CDNs
- Navigate between main app and `/legacy/legacy_composite_sandbox.html` to confirm no `THREE` identity conflicts (log checks already present)

4) Prepare main‑app iframe integration (no code yet, just scaffolding plan)
- Create a new document `coordination/SANDBOX_VIEWER_INTEGRATION_PLAN.md` if missing, and confirm tasks for:
  - New route `Viewer (Beta)` that embeds `/legacy/viewer_iframe.html`
  - Parent↔iframe postMessage bridge outline
  - Feature flag `VITE_ENABLE_VIEWER_BETA`
- Acceptance: Plan file exists and is referenced in `LIVE_ACTIVITY_TRACKER.md`

5) Ready‑for‑test (offline) criteria
- With DevTools Network throttling set to “Offline”:
  - Upload GLB/FBX → renders
  - Place Markers → Auto Weights → Bind (if implemented by Agent 3) show status updates, no crashes
  - Save GLB → downloads locally
  - No network requests shown in the Network panel

---

## Agent 2 – Follow‑Up Tasks (Coordinator Expansion)

Scope
- Triage residual 404 on `viewer_iframe.html`; formalize route integration plan; harden vendorization

Tasks
- 404 audit and fix
  - Open DevTools on `http://localhost:3001/legacy/viewer_iframe.html` and identify the exact missing URL (likely `favicon.ico` or a source map)
  - Remedy by either
    - adding a minimal placeholder asset in `public/` (e.g., `/favicon.ico`), or
    - removing the reference from HTML if unnecessary, or
    - correcting an import path to `/legacy/vendor/...`
  - Document the resolved path in `SERVER_STATUS_TRACKER.md` notes and in a brief comment in the HTML head
- Vendor path integrity check
  - Verify all `import()` and `importmap` entries point to `/legacy/vendor/` and not to `node_modules` or external CDNs
  - Confirm presence of: `examples/jsm/loaders/{GLTFLoader,FBXLoader}.js`, `exporters/GLTFExporter.js`, `controls/OrbitControls.js`, `libs/{draco,meshopt_decoder,basis}`
  - Ensure DRACO/KTX2/Meshopt transcoder paths match the mirrored directories
- Integration plan file
  - Create `coordination/SANDBOX_VIEWER_INTEGRATION_PLAN.md` (see outline below) and link it from `LIVE_ACTIVITY_TRACKER.md`
  - Include feature flag `VITE_ENABLE_VIEWER_BETA` and parent↔iframe bridge message schema
- Offline validation
  - Re‑run `scripts/test_offline_vendorization.cjs` → expect `OK_NO_THIRD_PARTY`
  - Confirm zero red requests with DevTools set to Offline

Acceptance
- The previously observed 404 is gone on reload; Network panel clean in Offline mode
- Plan file exists, committed, and referenced in trackers
- All viewer functionality works without third‑party fetches

Artifacts
- Update notes at top of `public/legacy/viewer_iframe.html` if any path order changes were required
- `coordination/SANDBOX_VIEWER_INTEGRATION_PLAN.md`

---

## Agent 3 – Follow‑Up Tasks (Coordinator Expansion)

Scope
- Strengthen autorigger workflow robustness and UX confirmations inside iframe

Tasks
- Marker UX
  - Ensure Backspace removes last marker; `Reset Markers` clears markers without deleting current model
  - Keep overlay guidance messages in sync with guided labels
- Skeleton + weights
  - Confirm `toggleSkeleton` works post‑bind and after model reload
  - Verify auto‑weights produces plausible deformation on limb rotations
- Save + reload
  - Export GLB via `saveGlb`, then reload exported file via Select Model
  - Confirm rig + idle persist after reload
- Logs & resilience
  - Maintain concise overlay messages; ensure no crashes on repeated Clear/Place/Bind waves

Acceptance
- Scripted tests pass:
  - `node scripts/test_iframe_marker_skeleton.cjs` → PASS
  - `node scripts/test_iframe_marker_skeleton_full.cjs` → PASS
- Manual flow works: Place → Auto Weights → Play Idle → Save GLB → Clear → Reload saved GLB

Artifacts
- Append acceptance results to `coordination/AGENT_3_ANIMATION_TESTING_REPORT.md`

### Coordinator Note (2025-08-11T14:05Z)
- Save GLB roundtrip under headless harness captured 0 bytes; ACTION: validate in non‑headless or enable CDP download capture to confirm exported GLB (>100KB) reloads successfully.

---

## Agent 5 – Follow‑Up Tasks (Coordinator Expansion)

Scope
- Investigate composite FPS (≈205) vs baseline (≈240) delta without changing functionality

Tasks
- Isolate contributors
  - Measure with `skeletonHelper.visible=false` and record FPS
  - Temporarily skip `controls.update()` and record FPS
  - Test render loop with fixed delta vs current to ensure stable mixer cost estimates
- Scene graph/overdraw probes
  - Count objects and materials before/after model load; diff from baseline
  - Evaluate placeholder removal timing; confirm no duplicate roots remain
- Reporting
  - Extend comparator to include “helpers off” and “controls off” toggles (no code changes to app; use in‑page eval if harness supports)

Acceptance
- Root cause candidate identified and documented (e.g., controls tick, helper overhead)
- Proposed low‑risk optimization set documented (behind a toggle/flag; no behavior change)
- Updated `coordination/AGENT_5_COMPOSITE_METRICS.md` with comparative table

Artifacts
- `coordination/AGENT_5_COMPOSITE_METRICS.md` (updated)

---

## References
- Completion protocol: See `coordination/AGENT_COMPLETION_PROTOCOL.md` for required doc updates upon task completion

