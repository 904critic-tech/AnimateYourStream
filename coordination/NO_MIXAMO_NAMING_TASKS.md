# No-Mixamo-Naming: Task Checklist

## Phase 1 — User-visible and metadata (our code only)
- [ ] package.json: rename `name`, `description`, keywords; remove Mixamo mentions
- [ ] UI logs in `RightPanel.tsx`: remove `Mixamo` text and variables
- [ ] `ModelViewer.tsx`: replace Mixamo references in logs and comments
- [ ] Coordination docs: prepend LEGACY tag where the term is historical; avoid new mentions

## Phase 2 — Files and modules (our code only)
- [ ] Rename `src/utils/mixamoCharacterLoader.ts` → `src/utils/standardCharacterLoader.ts`
- [ ] Rename `src/core/MixamoAnimationSystem.tsx` → `src/core/StandardAnimationSystem.tsx`
- [ ] Update all imports and exported type names accordingly
- [ ] Replace test files: `scripts/test_mixamo_character_loading.cjs` → `scripts/test_standard_character_loading.cjs`

## Phase 3 — Legacy sandbox isolation
- [ ] Move `public/legacy/mixamo/` → `public/legacy/standard_legacy/`
- [ ] Update `public/legacy/legacy_composite_sandbox.html` paths and labels

## Phase 4 — Guardrails
- [ ] Add `scripts/enforce_no_mixamo_terms.cjs` to scan sources/docs
  - [ ] Exclude `public/uploads/**` (user uploads)
  - [ ] Exclude binary models: `**/*.glb`, `**/*.gltf`, `**/*.fbx`
  - [ ] Allow LEGACY-coordinated docs blocks
- [ ] Document policy in `coordination/NO_MIXAMO_NAMING_POLICY.md`
- [ ] Add pre-commit/CI notes to run enforcement script
