# Verold Runtime 0.7.15 – Evaluation and Integration Plan

## Executive summary
- The uploaded `verold-runtime-0.7.15.js` is a legacy AMD/almond-based build that bundles a custom "VeroldEngine" layer and an older Three.js/postprocessing stack.
- Our app is a modern Vite + React + TypeScript + Three.js codebase with ES modules. Directly integrating this runtime into the main bundle would likely introduce module system conflicts, duplicate Three.js globals, and regress performance and stability.
- Recommendation: Do not integrate into the main application. If we want to explore value, do so in an isolated sandbox path with strict guardrails and a feature flag. Extract learnings/utilities only if they are demonstrably beneficial and compatible.

## Why full integration is risky
- AMD vs ES Modules: `define/require` in the runtime conflicts with ESM used by Vite, leading to loader shims, global leaks, or build-time hacks.
- Duplicate Three.js: The runtime appears to carry its own Three.js; mixing with our `three` from npm can cause class identity mismatches (materials, geometries, loaders) and hard-to-debug runtime errors.
- Global pollution: The runtime defines `window.VAPI`, `window.verold`, and relies on globals; our app is designed for modular imports and tree-shaking.
- Maintenance: It is pinned to older APIs and shaders; upgrading to latest Three.js, R3F, and modern tooling is harder if the legacy runtime is in the critical path.

## Potential benefits (only via sandbox)
- Reference implementations: There are useful patterns (e.g., robust keyframe handling, material overrides, texture debugger hooks) that could inspire improvements in our own systems.
- Post-processing presets: Some classic effect passes could be cross-referenced with `three-stdlib` to see if they fill gaps.

## Decision gates
Only proceed beyond sandbox if ALL pass:
1. No global conflicts (no override of `THREE`, no pollution affecting main app routes).
2. No performance regressions (page weight, FPS, CPU/GPU time). Baseline vs with sandbox loaded must be within 1-2% on non-sandbox routes.
3. Compatibility: No TypeScript/bundler hacks in main app. Sandbox must be fully decoupled.
4. Demonstrated utility: At least one concrete improvement (e.g., better keyframe robustness) that we can port to our own code without dragging legacy runtime.

## Implementation approach (sandbox only)
- Primary: Create a static, isolated composite HTML page under `public/legacy/legacy_composite_sandbox.html` that loads both legacy scripts via `<script>` tags in this order:
  1) `/legacy/libs/verold-runtime-0.7.15.js`
  2) `/legacy/libs/mixamo.min.1295a6f5.js`
  This page must not import anything from `src/` and must not require bundler changes.
- Optionally, keep individual pages (`verold_sandbox.html`, `mixamo_sandbox.html`) for differential debugging, but ACCEPTANCE depends on the composite page functioning with both libraries loaded together.
- Composite checks:
  - Initialization without touching main app globals
  - Confirm `window.VAPI` is present and Mixamo globals function alongside it
  - Verify no duplicate/overwritten `THREE` causing class identity issues
- Collect measurements: added JS weight, load time, FPS under a trivial scene.
- Produce a short report and propose targeted extractions (documentation-first) compatible with our modern stack.

### Mixamo package inclusion (folder provided by user)
- Source folder at project root: `from mixamo/`
- Discovered contents (examples):
  - `verold-runtime-0.7.15.js`
  - `mixamo.min.1295a6f5.js`, `mixamo.min.383f19bc.css`
  - `satelliteLib-*.js`
  - Viewer/utility scripts: `Renderer.js`, `Render View.js`, `Orbit Camera Controller.js`, `Default Filters.js`, `Annotation.js`, `Curve.js`, `Cube-Map Capture.js`, `Reflection Capture Plane.js`, `Sphere-Map Capture.js`

### Asset placement and naming policy (no main-bundle impact)
- Mirror the folder into `public/legacy/mixamo/` to be web-served, but DO NOT import from `src/`.
- To avoid brittle URLs with spaces, copy and sanitize filenames to kebab-case for the mirrored copies only (originals remain untouched at project root). Example mappings:
  - `Render View.js` → `render-view.js`
  - `Orbit Camera Controller.js` → `orbit-camera-controller.js`
  - `Default Filters.js` → `default-filters.js`
  - `Cube-Map Capture.js` → `cube-map-capture.js`
  - `Sphere-Map Capture.js` → `sphere-map-capture.js`
  - `Reflection Capture Plane.js` → `reflection-capture-plane.js`
  - `Annotation.js` → `annotation.js`
  - `Curve.js` → `curve.js`
  - `Renderer.js` → `renderer.js`

### Composite load order (initial hypothesis)
1) `verold-runtime-0.7.15.js` (defines `window.VAPI`, AMD shim, Three, post-processing)
2) `satelliteLib-*.js` (if required by Mixamo script)
3) `mixamo.min.1295a6f5.js` (Mixamo minified runtime)
4) Mixamo viewer utilities (order may be adjusted after a quick dependency scan):
   - `renderer.js`
   - `render-view.js`
   - `orbit-camera-controller.js`
   - `default-filters.js`
   - `annotation.js`
   - `curve.js`
   - `cube-map-capture.js`
   - `reflection-capture-plane.js`
   - `sphere-map-capture.js`
5) CSS: `mixamo.min.383f19bc.css` via `<link>` in `<head>`

Note: Agent 2 should confirm dependencies with a quick pass; adjust ordering minimally to satisfy any runtime references. Keep all changes confined to the composite sandbox page.

### Composite sandbox goals (per user request)
- Use the provided Mixamo package together with Verold to stand up a working model viewer and auto‑rigger demonstration inside the sandbox page.
- Minimal demo acceptance:
  - Page initializes without console errors
  - A trivial scene renders (clear canvas, camera orbit works)
  - Load a test model (start with the bundled `public/models/Default_Model.fbx`) through the legacy stack if feasible
  - If auto‑rigging requires external services or assets not present, mock or document the limitation; show the viewer flow and any preparatory steps

## Tasking and ownership
- Agent 2 (Performance)
  - Build composite sandbox page: `public/legacy/legacy_composite_sandbox.html` that loads both scripts together (order above). Keep individual pages only if useful for debugging.
  - Ensure no main-bundle imports and no bundler config changes are required.
  - Acceptance: Main app routes unaffected; composite sandbox loads and initializes both scripts without errors; no `THREE` conflicts or global collisions.
- Agent 5 (Diagnostics)
  - Measure weight and runtime impact. Record FPS, CPU, memory. Compare against main app baseline.
  - Acceptance: Metrics documented; delta under 1-2% for non-sandbox routes; composite sandbox meets thresholds.
- Agent 3 (Animation)
  - Review Verold’s robust keyframe/layering and Mixamo script behavior when run together. Propose modern, minimal equivalents for our `MixamoAnimationSystem` and `AnimationBlender` without importing legacy code.
  - Acceptance: A design note listing specific, portable improvements with references to our `src/core/` files.
- Agent 1 (AI Behavior)
  - Confirm no dependency or integration is needed within `src/ai/` and document N/A. Stay within `src/ai/` scope.
  - Acceptance: Short note confirming no coupling points.

## Deliverables
1. `public/legacy/legacy_composite_sandbox.html` (isolated; loads both legacy scripts together; no imports from `src/`).
2. Optional: `public/legacy/verold_sandbox.html` and `public/legacy/mixamo_sandbox.html` (for debugging only).
3. `coordination/VEROLD_RUNTIME_EVALUATION.md` (this file) updated with findings and a decision.
4. Diagnostics report with performance metrics.
5. Optional design note for targeted, modernized extractions.

## Current status
- File present at project root: `verold-runtime-0.7.15.js`.
- No existing references inside our codebase to `VAPI`/Verold modules.
- Proceeding with sandbox-only evaluation; main app integration is out of scope unless decision gates pass.


