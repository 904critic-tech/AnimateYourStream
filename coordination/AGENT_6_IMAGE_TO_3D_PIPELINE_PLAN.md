# 🎨 JPEG/PNG → 3D Model with Animations: Implementation Plan (Agent 6)

## Principle
- No manual rigging required for users. The pipeline must fully automate rig creation and animation.
- Any manual rigs are optional, internal data used only to improve future auto-rig heuristics (not exposed in UI).

## Goal
Enable importing a single image (JPEG/PNG) or a set of images and automatically generate a rigged, animated 3D model that can be used immediately in the Sandbox and Animation systems.

## Non-Goals (for MVP)
- Photoreal movie-quality assets
- Perfect autorigging for arbitrary non-humanoid shapes
- Full-body motion capture generation

---

## User Experience (MVP)
1. Open Right Panel → "Create 3D from Image".
2. Upload one image (or a folder of 10–40 images for higher quality).
3. UI shows pipeline status (Queued → Processing → Rigging → Animating → Done).
4. Result is added to the character list and auto-loaded into the scene.
5. A basic idle animation plays instantly; optional library animations can be retargeted.

- Output model path: `public/Default_Characters/generated/<slug>/model.glb`
- Output animation manifest: `public/Default_Characters/generated/<slug>/animation_manifest.json`

---

## Architecture Overview
- Frontend (React): Upload UI, progress UI, post-process model load (`SandboxModelViewer`).
- Worker/CLI (Node/PowerShell): Reconstruction → meshing → decimation → autorig (automated) → export.
- Blender (headless, optional Phase 2+): For higher-quality autorig and mesh cleanup.
- ML components: Depth estimation, photogrammetry, or single-image 3D methods.

---

## Pipeline Options

### Track A — MVP (Single Image, Fast, Local)
- Monocular depth (MiDaS via ONNX Runtime in Node).
- Displaced plane heightfield mesh with planar texture projection.
- Auto-rig: generate minimal skeleton (root/spine/head) automatically; no user input.
- Export GLB; load and animate via procedural idle or retargeted base clips.

### Track B — Multi-View Photogrammetry (Higher Quality, Offline)
- Input: 10–40 photos → COLMAP/OpenMVS (or Meshroom) → textured mesh.
- Headless Blender post-process (optional): decimate/remesh, UV cleanup.
- Auto-rig: Blender script or SMPLify-X (humanoids) with zero user intervention.
- Export GLB; integrate with retargeting.

### Track C — Single-Image 3D via Generative Models (Advanced)
- TripoSR (local) or Zero123 + Instant-NGP/NeuS; commercial APIs gated by flags.
- After mesh extraction: automated autorig → export → retarget.

---

## MVP Scope (2–4 days)
- Single-image pipeline: Depth → Displaced mesh → Auto minimal rig → Procedural idle.
- Offline, Windows-compatible (PowerShell + Node scripts; Blender optional).
- Output loads in viewer and animates via existing systems.

### Deliverables (MVP)
- `scripts/image_to_3d/single_image_mvp.cjs` (Node CLI using ONNX Runtime for MiDaS).
- `scripts/image_to_3d/README.md` (install/run instructions).
- Right Panel UI section (feature-flagged) to trigger pipeline and show progress.
- Asset placement + manifest generation (reuse `generate_animation_manifest.cjs`).

---

## Detailed Steps (MVP)
1. Upload image to `public/uploads/images/<slug>/input.jpg`.
2. Run `single_image_mvp.cjs`:
   - Run MiDaS depth on the image.
   - Convert depth to normalized heightfield; generate displaced plane mesh.
   - Auto-generate tiny skeleton; assign skin weights automatically.
   - Export `.glb` and copy texture.
3. Move outputs to `public/Default_Characters/generated/<slug>/`.
4. Update character manifest; notify UI to refresh list.
5. Load model; procedural idle plays; optional retarget to library animations.

---

## Phase 2 (1–2 weeks)
- Photogrammetry path with COLMAP/OpenMVS or Meshroom.
- Headless Blender autorig (humanoids), generic autorig for props/quadrupeds.
- LOD/decimation; quality presets.

## Phase 3 (2–3 weeks)
- TripoSR or Zero123 + Instant-NGP integration.
- Category-aware autorig templates (SMPL, jaw/hinge rigs).
- Optional facial rig and lip sync when face detected.

---

## Integration Points
- `SandboxModelViewer`: model loading, procedural idle, retargeting, global APIs.
- `Retargeting.ts`: name-based remapping.
- `RightPanel.tsx`: feature-flagged UI section (no manual rig UI).

---

## Risks & Mitigations
- Single-image quality limits → clearly labeled "Quick Preview".
- Compute requirements → presets and optional queueing.
- Licensing → prioritize local/open-source; gate APIs.
- Autorig for arbitrary shapes → use category templates and skeletal inference; manual rigs used only for internal training data.

---

## Acceptance Criteria
- User never performs manual rigging in the UI.
- Given a single JPEG, generate a `.glb` that loads and animates (procedural idle) within 60–120 seconds on a mid-range PC.
- Given 20 photos, generate a `.glb` that retargets at least one library animation.
- Entire MVP and Track B run offline; Track C is feature-flagged.

---

## Agent Assignments
- Coordinator: Sequencing and docs updates.
- Agent 6 (NEW): Image-to-3D pipeline scripts and automated autorig toolchain.
- Agent 2: Right Panel UI and progress.
- Agent 3: Autorig templates, skeleton binding, retargeting integration.
- Agent 4: Optional face detection → lip sync mapping.
- Agent 5: Performance profiles and dependency checks (Windows).

---

## Next Steps (this repo)
- Keep manual rigging out of the UI; collect any manual data only offline for improving autorig heuristics.
- Add tasks checklist (`AGENT_6_IMAGE_TO_3D_TASKS.md`).
- Add script stubs and README under `scripts/image_to_3d/`.
- Add feature flag `VITE_ENABLE_IMAGE_TO_3D=true`.
- Add Right Panel UI section behind feature flag (stub initially).
