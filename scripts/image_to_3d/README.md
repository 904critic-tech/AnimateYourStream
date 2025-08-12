# Agent 6 - Image-to-3D MVP (Stub)

This MVP stub simulates the image-to-3D pipeline by creating a generated character from an input image and a base GLB.

## Prerequisites
- Node.js 18+

## Usage
```bash
node scripts/image_to_3d/single_image_mvp.cjs --input public/favicon.ico --slug sample
```

Outputs:
- `public/Default_Characters/generated/<slug>/model.glb` (copied from base GLB)
- `public/Default_Characters/generated/<slug>/input.<ext>` (copied input)
- Regenerates `public/Default_Characters/character_manifest.json`

## Notes
- This is a stub. The full pipeline will integrate ONNX Runtime (MiDaS) for depth, mesh generation, autorig, and GLB export.
- UI is feature-gated via `VITE_ENABLE_IMAGE_TO_3D=true` and currently disabled (stub only).