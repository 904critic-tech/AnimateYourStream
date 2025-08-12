# Character Models Directory

This directory is for storing 3D character model files.

## Supported Formats
- `.glb` - GLTF Binary (recommended)
- `.gltf` - GLTF JSON
- `.fbx` - Autodesk FBX
- `.obj` - Wavefront OBJ

## Expected Files
The application will automatically look for character files in this order:
1. `Default_Model.fbx` - **PRIMARY DEFAULT CHARACTER** (53MB)
2. `character.glb` - Main character file
3. `character.gltf` - GLTF format character
4. `character.fbx` - FBX format character
5. `default-character.glb` - Default character file

## File Requirements
- Character should be humanoid with standard skeleton
- Include animations if possible (idle, walk, run, etc.)
- Optimized for web (compressed textures, reasonable polygon count)
- Proper UV mapping for textures

## Integration
Character files placed here will be automatically loaded by the CharacterLoader component in `src/core/ModelViewer.tsx`.

**Note**: Currently using enhanced placeholder character until actual character files are provided.
