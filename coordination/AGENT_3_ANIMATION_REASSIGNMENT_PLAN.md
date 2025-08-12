# 🎭 Agent 3 – Animation System Re-Assignment Plan

Date: 2025-08-11T00:00:00Z
Status: 🔄 ACTIVE
Scope: Fix animations not playing and resolve "Animation not found in layers" errors without restarting the server.

---

## 🎯 Goals
- Ensure models animate when an animation is chosen from UI.
- Eliminate "Animation not found in layers" warnings by aligning selected names with registered layers.
- Verify mixer/action lifecycle and default animation selection.

---

## 🔎 Investigation Checklist
- Layer registration: Confirm every `AnimationClip` in `animations` becomes a layer in `MixamoAnimationSystem` and `AnimationBlender`.
- Name normalization: Verify selection compares normalized keys (lowercase, trimmed) and maps to real clip names.
- Default selection: When `loadedAnimations` changes, auto-select `idle` if present else first clip.
- Current animation lifecycle: Reset or re-map `currentAnimation` when the available set changes.
- Mixer/actions: Ensure actions are enabled, `fadeIn/fadeOut` used, and mixer updates in `useFrame`.

---

## ✅ Acceptance Criteria
- No console warnings like: `Animation not found in layers: <name>`.
- Selecting an animation in UI immediately blends and plays on the model.
- On model change, a valid default animation plays without manual selection.
- Console shows available animation names for loaded model.

---

## 🧪 Test Steps (Manual, No Server Restart)
1. Load default character (no upload) and open browser console.
2. Confirm logs from `MixamoAnimationSystem` list `animationNames` and created layers.
3. In console, run:
   - `(window as any).__MIXAMO_ANIMATION_SYSTEM__.getLayers()` → keys should include expected clips.
   - `(window as any).__MIXAMO_ANIMATION_SYSTEM__.blendToAnimation('<clipName>')` → model should move.
4. Switch animations from the UI and verify smooth crossfades with visible changes.
5. Change model (preset or uploaded) and verify a sensible default plays.

---

## 🛠️ Proposed Non-Invasive Edits (to be implemented in a follow-up PR)
- Name normalization utility used in both selection and layer registration:
  - `normalize(name) = name.toLowerCase().trim()`
  - Maintain a map `{ normalizedName -> actualName }` for quick resolution.
- Fallback selection guard:
  - If requested `currentAnimation` not found, pick first available and log a single concise warning.
- Re-selection on animations change:
  - When `animations` array changes, re-validate `currentAnimation` and auto-select default if invalid.
- Telemetry logs (debug level):
  - On registration: log layer keys and clip durations.
  - On selection failure: log available layer keys once.

---

## 📦 Files Under Review
- `src/core/MixamoAnimationSystem.tsx`
- `src/core/AnimationBlender.tsx`
- `src/core/ModelViewer.tsx`

---

## 🔁 Reporting
- Update `coordination/LIVE_ACTIVITY_TRACKER.md` on status changes.
- Provide console before/after snapshots in the completion report.


