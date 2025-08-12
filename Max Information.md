## Animation, Model Loading, Performance, Auto-Repair AI, and Voice-Driven Behaviors (Good → Better → Best)

### Scope
- Ensure all model formats load reliably (FBX, GLB/GLTF, OBJ) and animations play correctly
- Deliver actionable performance improvements across devices (desktop, mobile, tablet)
- Design and integrate a smart AI auto-repair error processing system
- Drive character behavior from user voice: lip sync, emotion → gestures, sing/dance, random micro-animations

---

### 1) Model Loading Reliability (Good → Better → Best)

- Good
  - Use existing multi-format pipeline in `src/core/ModelViewer.tsx` and `src/utils/mixamoCharacterLoader.ts`.
  - Keep the fetch-context binding already implemented for Blob URLs and Mixamo-compatible paths.
  - Validate uploaded model metadata from `useAppStore`, guard nulls, and always fallback to the Enhanced Placeholder.
  - Normalize post-load transforms (scale, origin, shadow flags) via `processLoadedModel`.

- Better
  - Centralize a single loader facade exposing `load(url | blob, type) → { model, animations, mixer }` with uniform progress events.
  - Add preflight checks: content-type sniffing, size threshold, heuristic on extension vs magic bytes.
  - Cache last-successful path per `modelId` to skip repeating failing attempts in a session.
  - Persist success/fail counts by format in `localStorage` to bias future attempts.
  - Add watchdog timeout per load and surface user-facing retry CTA with reason.

- Best
  - Add a compatibility matrix per GPU/Browser: if `WEBGL_debug_renderer_info` matches a known problematic combo, select a safer loader/material preset.
  - Implement background warmup: when app is idle, pre-create loader instances and prime caches (GLTF parser, shader compilation via a tiny dummy scene).
  - Provide a streaming/partial display path for very large FBX/GLTF (progressively reveal loaded subtrees), with backpressure on textures.
  - Record structured load telemetry (success rate by format, avg ms, errors by message) and feed to auto-repair and UI diagnostics.

---

### 2) Animation System Integrity (Good → Better → Best)

- Good
  - Use `MixamoAnimationSystem` with automatic creation of actions per clip.
  - Default to an `idle`-like clip when present; otherwise the first clip.
  - Log available clip names at load; surface in UI for manual selection.

- Better
  - Add validation after load: ensure at least one clip mapped to a default state; if not, inject a procedural idle (subtle breathing/weight shift) at the mixer level.
  - Maintain an index of semantic labels → clip names (idle, walk, run, clap, wave, point). Fuzzy-match unknown clip names to the nearest label for behavior engine.
  - Provide an additive gesture lane for short overlays (wave/point/head-nod) with auto fade timings.

- Best
  - Introduce a small animation database with per-clip metadata (intensity, duration, recommended blend). Persist learned mappings per model.
  - Implement state machine presets (idle → walk → run; talk overlays during conversation) with hysteresis and cooldown control.
  - Coordinate facial animator and body blend timings via a synchronization API (already scaffolded in `AnimationBlender` and `FacialAnimator`).

---

### 3) Performance Improvements (Good → Better → Best)

- Good
  - Keep ultra-light monitoring cadence (20s) in Scene, ModelViewer, and diagnostics.
  - Limit pixel ratio to min(devicePixelRatio, 2); prefer PCFSoftShadowMap; disable DITHER and SAMPLE_COVERAGE.
  - Use LOW quality when FPS < 30; HIGH when ≥ 55. Shorten log frequency.
  - Ensure cleanup on unmount: traverse meshes, null geometry/material refs, revoke Blob URLs.

- Better
  - Adaptive Resolution Manager: scale renderer pixel ratio between 0.5–1.0 based on FPS window; persist last good scale per device.
  - Batch draw-call optimizer (instance grouping by geometry+material key) for static props; frustum culling stats to gate instancing.
  - Texture policy: prefer KTX2/ASTC where available; cap max texture size (e.g., 2048) on mobile via pre-process or runtime scaling.
  - LOD policy per distance with hysteresis; for characters, swap to lower-poly proxy beyond threshold while keeping skeleton for far animations.

- Best
  - Precompile common shaders on boot; lazy-create expensive post-process only when toggled.
  - Streaming textures with priority: face → torso → other; cancel in-flight fetches when model changes.
  - Frame budgeter: split heavy tasks across frames (parsers, skeleton map, bounds calc) using `requestIdleCallback`/yields.
  - Record per-device performance fingerprints (GPU, FPS median, spikes) to auto-pick initial quality and skip known heavy features.

Concrete quick wins
- Reduce shadow map size on mobile (e.g., 512–1024).
- Disable environment HDR on devices reporting Intel iGPU older gens.
- Clamp morph target updates to 30 FPS.
- Avoid `material.needsUpdate` churn; batch edits.

---

### 4) Smart AI Auto-Repair System (Design and Implementation)

Architecture
- Detector: `SmartErrorDetector` samples global errors, queues, performs fast AI categorization, and triggers auto-repair for high/critical.
- Auto-Repair: `AutoRepairSystem` holds repair actions with ML scoring (EMA success rates, context correlations) and runs bounded attempts/min.
- Telemetry: Breadcrumbs via `utils/errorReporting`, repair stats, pattern learning persisted.

Good
- Wire detector hooks in app boot (already done) and ensure categories map: audio/rendering/model/animation/ui/performance/system.
- Add minimal context capture: fps, memory, active features, current model id.
- Enable safe actions: permission re-request, WebGL context restore, memory cleanup, component restart suggestion, animation reset suggestion.

Better
- Integrate model reload action: if load fails for current `modelId`, retry with safer loader path and lower quality; then fallback to placeholder with actionable UI.
- Add “progressive disable” strategy: on repeated rendering failures, auto-disable environment/shadows/contact-shadows and retry.
- Correlate error patterns to prior successful fixes per device; bias action order by learned success.

Best
- Closed-loop verification: after repair, run a micro health check (render a frame, validate mixer state, memory deltas) and roll back if worse.
- Cross-session learning: persist pattern→bestAction map in local storage with TTL; sync to diagnostics export for sharing.
- Coordinator hooks: surface repair events in Diagnostics UI and `coordination/*` logs, with quick toggle to disable auto-repair.

Implementation notes for this codebase
- Use existing `SmartErrorDetector` and `AutoRepairSystem` classes; add model-reload integration by exposing a global callback from `ModelViewer` to replace its current model safely.
- Add a lightweight “repair mode” banner in UI when actions are active; throttle to avoid loops.
- Expand `ErrorCategory.model` actions with: switch loader (FBX↔GLTF path), reduce texture quality, force `DoubleSide` only when needed, retry with lower pixel ratio.

---

### 5) Voice-Driven Behaviors: Lip Sync → Emotion → Actions

Pipeline
- Mic → `LipSyncManager` (AnalyserNode) → `VisemeDetector` (frequency/hybrid) → `FacialAnimator` (jaw + blendshapes).
- Audio features → `ContextAnalyzer.analyzeAudioContext` → emotional tone → `AIBehaviorSystem` → `AnimationDecisionEngine`.

Good
- Map visemes to blendshapes via `FacialAnimator` (already scaffolded). Keep 60 FPS ceiling, throttle to 30 FPS for facial updates.
- Feed `audioLevel` to AI via `useAppStore.setAudioLevel` and `AIBehaviorSystem.addAudioContext`.
- Provide a minimal action map for emotions to animations: excited → `dance_short`, positive → `clap`/`wave`, calm → subtle idle overlay.

Better
- Emotion heuristics: use rising/falling/stable trends, variability, band energies already exposed by `ContextAnalyzer` to modulate intensity and pick additive gestures.
- Add gesture scheduler: randomly trigger micro-gestures every 3–7s during active speech; avoid overlaps with interrupt priorities.
- Singing mode: when `rms` and mid-band are elevated for N seconds, crossfade to looping dance and enable wider mouth exaggeration.

Best
- Learn per-user preferences: store which gestures get positive follow-ups (clicks/engagement) and bias towards them.
- Rhythm sync: quantize gesture onsets to peaks in energy envelope; expose beat estimation from running average of spectral centroid changes.
- Expression co-articulation: coordinate facial expressions from `FacialAnimator.createMouthShapeForExpression` with gesture overlays using `AnimationBlender.addCoordinatedGesture`.

Suggested hooks
- Expose `(window).__VOICE_BEHAVIOR__` API: start/stop listening, set behavior profile, force emotion, trigger gesture.
- Add “Voice Drive” toggles in Settings: Auto gestures, Singing mode, Random animations frequency.

---

### 6) Testing and Validation

- Functional
  - Upload FBX/GLB/OBJ → confirm: loads, scaled, shadows enabled, at least one animation present or procedural idle applied.
  - Switch characters (`char1`…): ensure no placeholder appears after success.
  - Trigger animations via UI and via AI decisions; verify additive gestures layer and fade.

- Performance
  - Desktop dGPU: target 60+ FPS with HIGH quality.
  - Mobile/tablet: target ≥30 FPS with adaptive resolution; confirm shadow/env toggles switch by metrics.
  - Memory: verify cleanup on model change/unmount (no steady heap growth over 5 minutes idle).

- Auto-Repair
  - Simulate WebGL context loss → system restores and logs recovery.
  - Inject fake model load error → repair tries safer path and logs outcome.
  - Confirm learning stats update (successRate, patterns).

- Voice behaviors
  - Mic test page (`?test=microphone`) → visemes and mouth movement responsive with ~50–100ms latency.
  - Emotion-to-gesture: talk excitedly → `dance_short` within 1–2s; calm speech → idle overlays only.

---

### 7) Coordinator Checklist (Good → Better → Best)

- Good
  - Keep `coordination/LIVE_ACTIVITY_TRACKER.md` and `coordination/SERVER_STATUS_TRACKER.md` updated when work is performed.
  - Verify server at `http://localhost:3001/` before tests.

- Better
  - Capture before/after logs for each major fix (model load, animation play, voice gestures) and link to code refs.
  - Store test matrices and outcomes per device class.

- Best
  - Automate a headless smoke suite (Puppeteer) to load default model, validate an animation plays, and run a mock viseme sequence.
  - Export diagnostics bundle (error patterns, repair stats, performance fingerprints) for regression tracking.

---

### 8) Concrete Task Queue (Recommended Order)
1) Model loading hardening: unify loader facade, add preflight and retries, log telemetry.
2) Animation defaulting and mapping: ensure a safe idle, gesture lane, and semantic labels.
3) Performance layer: adaptive resolution + texture/LOD policy for mobile.
4) Auto-repair integrations: model reload action, progressive disable, closed-loop checks.
5) Voice behaviors: wire audio trend→gesture mapping, micro-gesture scheduler, singing mode toggle.

This plan aligns with current modules: `ModelViewer`, `MixamoAnimationSystem`, `VisemeDetector`/`FacialAnimator`, `SmartErrorDetector`/`AutoRepairSystem`, and Scene quality controls. It provides immediate wins, medium-term stability, and long-term adaptability.


