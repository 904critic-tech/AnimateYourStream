# Character Rigging Hub (Offline)

Owner: Coordinator
Status: Planned
Purpose: Standalone page to onboard characters: upload -> autorig -> manual assist (if needed) -> verification -> lip sync rigging (if needed) -> save to library -> incremental local learning.
Constraint: Fully offline; no third-party services. Follow coordination/NO_MIXAMO_NAMING_POLICY.md.

## Goals
- Guided, recoverable workflow for adding/uploading characters.
- If autorig fails or confidence is low, guide through Manual Rig Wizard; ask user "Is this correct?" with per-limb checks.
- If lip sync cannot be auto-detected, guide through Lip Sync Rigging Wizard.
- Save reusable rig and lip sync configs in a local library.
- Learn from manual rigs locally to improve future autorigging.

## UX Flow (High-Level)
1) Upload: accept .fbx/.glb/.gltf; validate; preview.
2) Autorig (Offline): run local autorigger; compute confidence; high -> Verification; else -> Manual Rig Wizard.
3) Manual Rig Wizard: map hips/spine/neck/head, arms/hands (optional fingers), legs/feet; test poses; per-limb confirmation; save rig_map.json.
4) Verification: preview idle/walk/jump; capture final confirmation.
5) Lip Sync Rigging: auto-detect blendshapes/jaw/head; if missing, manual mapping + mic calibration; save lipsync_map.json + viseme_config.json.
6) Save to Library: persist under public/User_Characters/<id>/ (model, metadata.json, rig/lipsync maps, thumbnails).
7) Learning Loop (Local): record autorig features + approved mapping; improve confidence for similar skeletons.

## Data Model (Draft)
- metadata.json: { id, name, source, importDate, fileTypes, thumbnails }
- rig_map.json: { hips, spine[], neck, head, leftArm, rightArm, leftLeg, rightLeg, fingers?, toes? }
- lipsync_map.json: { jawBone?, blendshapes?: { viseme->morphTarget }, fallback?: { jawAngleRange, headNodRange } }
- learning_examples.jsonl: { features, predictedMap, approvedMap, outcome }

## Learning Strategy (Local)
- Phase 1: Heuristics (tokenization, hierarchy patterns, symmetry) + confidence.
- Phase 2: Lightweight classifier for ranking; active prompt to collect labels.
- Local storage only; no uploads/telemetry.

## Accessibility & UX
- Keyboard-first; color-blind safe highlighting; undo/redo; auto-save.

## Integration
- Preview via SandboxModelViewer; test clips shared with animation system.
- Lip sync integrates with LipSync or EnhancedAudioProcessor when present.

## Feature Flag & Route (Design)
- Flag: VITE_FEATURE_RIGGING_HUB=true
- Route: /rigging-hub

## Acceptance Criteria
- End-to-end flow works offline.
- Manual wizard covers core mapping; deformations look plausible.
- Lip sync wizard binds either blendshapes or jaw fallback with live preview.
- Library save emits expected files; character appears in picker and animates.
- Learning store updates; similar future models get higher confidence.

## Risks & Mitigations
- Diverse bone naming -> rely on hierarchy + user confirmation; conservative thresholds.
- Performance -> lightweight previews; defer heavy steps.
- Learning drift -> versioned examples; allow reset.

## Next Steps
- See coordination/CHARACTER_RIGGING_HUB_TASKS.md for per-agent tasks and milestones.
