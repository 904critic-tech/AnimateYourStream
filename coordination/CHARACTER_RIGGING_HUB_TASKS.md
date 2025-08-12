# Character Rigging Hub — Per-Agent Tasks

Status: Planned
Owner: Coordinator

## Phase 0 — Wiring & Flags
- Define feature flag VITE_FEATURE_RIGGING_HUB=true (docs/env only)
- Plan route stub /rigging-hub
- Directory layout under public/User_Characters/<id>/
- Acceptance: Docs merged; no server changes

## Phase 1 — Upload & Autorig Attempt
- Agent 3: Autorig API surface + confidence scoring schema
- Agent 2: Large file handling and preview memory budget
- Agent 5: Tests for upload validation and autorig invocation contracts
- Acceptance: Upload preview works; autorig callable; confidence recorded

## Phase 2 — Manual Rig Wizard
- Agent 3: Bone mapping UI spec, symmetry helpers, test poses, deformation preview
- Agent 5: Schema for rig_map.json and validation
- Agent 2: Ensure 60fps interactivity
- Acceptance: User maps core bones; per-limb confirm; rig_map.json saved

## Phase 3 — Verification
- Agent 3: Hook test clips via SandboxModelViewer
- Agent 5: Assertions for mixer active, clip plays, smooth transitions
- Acceptance: Preview plays; confirmation stored

## Phase 4 — Lip Sync Rigging Wizard
- Agent 4: Auto-detect blendshapes & jaw/head; manual mapping + mic calibration
- Agent 5: Tests for lipsync_map.json and basic motion
- Acceptance: Lip sync bound (blendshapes or jaw fallback) with live preview

## Phase 5 — Save to Library & Learning Loop
- Agent 3: Persist model + maps + thumbnails under public/User_Characters/<id>/
- Agent 1: Local learning store (heuristics now; lightweight classifier later)
- Agent 5: Reload tests; smoke tests for improved confidence on similar imports
- Acceptance: Character appears in picker and animates; improved confidence for similar imports

## Cross-Cutting
- Follow coordination/NO_MIXAMO_NAMING_POLICY.md
- Offline only; log any server access in coordination/SERVER_STATUS_TRACKER.md
- Maintain >=200 FPS; avoid console spam
