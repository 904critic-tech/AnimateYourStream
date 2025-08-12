# Agent 6 — Image-to-3D Pipeline: Task Checklist

## Policy
- No manual rigging in the UI. Autorig must be fully automated.
- Any manual rigs are optional, collected offline for improving autorig heuristics only.

## Phase 0 — Enablement
- [x] Add feature flag: `VITE_ENABLE_IMAGE_TO_3D=true`
- [x] Right Panel: add a new section (behind flag) "Create 3D from Image" with disabled controls (stub)
- [x] Create directory structure: `public/uploads/images/`, `public/Default_Characters/generated/`
  - Notes: `.gitkeep` added; MVP script outputs under `generated/<slug>/`

## Phase 1 — MVP (Single Image → Quick Preview, Automated)
- [ ] Script: `scripts/image_to_3d/single_image_mvp.cjs` (Node CLI)
  - [ ] Accept input image path + slug
  - [ ] ONNXRuntime for Node: run MiDaS depth on input image
  - [ ] Generate displaced plane mesh from depth
  - [ ] Auto-generate minimal skeleton (root/spine/head) and skin weights
  - [ ] Write GLB + copy texture
  - [ ] Output to `public/Default_Characters/generated/<slug>/model.glb`
- [ ] README: `scripts/image_to_3d/README.md` with install steps and offline model download notes
- [ ] Manifest: reuse `generate_animation_manifest.cjs` or update `generate_character_manifest.cjs`
- [ ] Integration: auto-refresh character list in UI on completion

## Phase 2 — Multi-View Photogrammetry (Automated)
- [ ] PowerShell wrapper: `scripts/image_to_3d/photogrammetry.ps1`
- [ ] COLMAP+OpenMVS (or Meshroom) invocation, folder input support
- [ ] Headless Blender post-process (decimate/UV fix)
- [ ] Autorig: Blender script/SMPLify-X (humanoids) with zero user prompts
- [ ] Export GLB and integrate with retargeting

## Phase 3 — Single-Image Advanced (Automated, Local Preferenced)
- [ ] Integrate TripoSR (local) with optional GPU
- [ ] Optionally: Zero123 + Instant-NGP pipeline
- [ ] Quality presets (fast/medium/high) and time estimates in UI

## UI Integration
- [x] Right Panel uploader (single image or folder) — stubbed, disabled behind flag
- [x] Builder MVP hook (feature gated) — upload calls `POST /api/image3d/mvp` when flag is enabled
- [ ] Pipeline status UI (Queued → Processing → Rigging → Animating → Done)
- [ ] On success: add to characters, select and load automatically
- [ ] On failure: clear messages and logs; allow retry
- [ ] Do not expose any manual rigging controls

## Testing
- [ ] Scripted test: `scripts/test_image_to_3d_mvp.cjs` to simulate a run and verify outputs exist
- [ ] Sandbox load test: Ensure mixer initializes and procedural idle plays
- [ ] Retarget test: Attempt to play a library animation; ensure no errors

## Documentation
- [x] Update `coordination/SERVER_STATUS_TRACKER.md` when accessing server or running pipelines
- [ ] Add Image-to-3D section to main README (note: no manual rigging required)
- [ ] Add troubleshooting guide for ONNX Runtime and Blender installs on Windows
