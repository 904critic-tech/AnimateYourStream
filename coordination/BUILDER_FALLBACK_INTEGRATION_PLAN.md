# Builder Fallback Integration Plan

Owner: Coordinator
Status: Planned
Scope: Use `/builder` as a guided fallback when an uploaded/imported model fails autorigging or has low confidence, and surface links to the Character Rigging Hub for manual mapping and lip sync rigging.
Constraint: Fully offline; vendor-agnostic (see `coordination/NO_MIXAMO_NAMING_POLICY.md`).

## Trigger Points
- Autorig failure (exception) or low confidence reported by autorig API
- Missing animations or zero valid clips after load
- Lip sync auto-detection fails (no blendshapes and no jaw bone identified)

## Routing & UX
- Inline CTA in viewer: “Rig not detected. Fix options:”
  - Option A: “Open Rigging Hub” (manual mapping + lip sync wizard)
  - Option B: “Open Builder” (image-to-3D pipeline generates a fresh, minimal rig)
- Preserve context: pre-fill character name; if applicable, capture failure reason
- No references to vendor names in UI; neutral language

## Service Readiness Checks
- Detect builder service availability via HEAD/GET `http://127.0.0.1:4001/health` (add endpoint in builder service)
- If unavailable, show instructions to start: `npm run builder:serve`

## Data & Artifacts
- Builder output: `public/Default_Characters/<name>/<name>.glb` (+ optional `.gltf`, `.blend`)
- Auto-refresh manifest: `public/Default_Characters/character_manifest.json`
- Rigging Hub outputs: `rig_map.json`, `lipsync_map.json`, `viseme_config.json` under character folder

## Acceptance Criteria
- When autorig low-confidence/fails, viewer shows CTA with links to Rigging Hub and Builder
- Builder produces GLB that loads in viewer and animates (procedural idle present)
- Lip sync fallback works (jaw bone mapping or manual mapping in hub)
- Entire flow remains offline; no external requests triggered

## Risks & Mitigations
- User confusion between options → concise copy and “When to choose” tooltips
- Builder unavailable → health check + one-click instructions
- Learning loop drift → store versioned examples; allow reset

## Next Steps
- Wire detection surface from viewer to show fallback CTA
- Add `/health` endpoint to builder service
- Update docs and tests for end-to-end fallback path
