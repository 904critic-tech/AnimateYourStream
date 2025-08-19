# No-Mixamo-Naming Policy

## Policy
- The term "Mixamo" (any case) must not appear in our code, UI labels, package metadata, or documentation intended for users.
- It is acceptable if USER-UPLOADED asset filenames or folders include the term. We will not alter user uploads.
- Internal bone names inside third-party assets (e.g., `mixamorig...`) are tolerated inside GLTF/FBX payloads and are not exposed in the UI.

## Banned patterns (in our code/docs/UI only)
- `mixamo`, `Mixamo`, `MIXAMO`, `mixamorig`

## Allowed exceptions
- User uploads: any files under `public/uploads/**` (or other user-managed upload dirs)
- Binary model contents and baked text inside `.glb/.gltf/.fbx` files
- Historical coordination notes may retain the term but should be marked as legacy

## Enforcement
- Replace with neutral terms: "Standard Rig", "Legacy Animation System", "Library Animation".
- Phase 1: User-visible strings and package metadata
- Phase 2: File and directory renames (code references updated)
- Phase 3: Legacy sandbox isolation under neutral names
- Add a script to fail on banned patterns in source/coordination, excluding:
  - `public/uploads/**`
  - `public/**/*.glb`, `public/**/*.gltf`, `public/**/*.fbx`
  - `coordination/**` entries explicitly marked LEGACY

## Notes
- Aligns with offline-first, vendor-agnostic goals. User uploads remain untouched and can include any naming.
