/**
 * Facial Expression System
 *
 * Provides facial expressions via blend shapes and bone transforms.
 * Exposes a small debug API on window.__FACIAL_EXPRESSIONS__.
 */

import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Euler, Bone, SkinnedMesh } from 'three'
import { useAppStore } from '../utils/store'

export enum ExpressionType {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  SURPRISED = 'surprised',
  WINK = 'wink',
  BLINK = 'blink'
}

export interface FacialBone {
  bone: Bone
  name: string
  type: 'jaw' | 'eye' | 'brow' | 'mouth' | 'cheek' | 'nose'
  influence: number
  constraints: {
    minRotation: Euler
    maxRotation: Euler
    minPosition: Vector3
    maxPosition: Vector3
  }
}

export interface BlendShape {
  name: string
  index?: number
  weight?: number
  influence?: number
  category: 'mouth' | 'eye' | 'brow' | 'cheek' | 'jaw'
}

export interface Expression {
  type: ExpressionType
  intensity: number
  durationMs: number
  blendShapes: Map<string, number>
  boneRotations: Map<string, Euler>
  bonePositions: Map<string, Vector3>
  inMs: number
  outMs: number
}

export interface FacialExpressionConfig {
  enableBlendShapes: boolean
  enableBoneAnimation: boolean
  enableLipSync: boolean
  enableEyeMovement: boolean
  enableBlinking: boolean
  blendShapeSmoothing: number
  boneAnimationSmoothing: number
  maxSimultaneousExpressions: number
}

interface BoneTransform {
  rotation: Euler
  position: Vector3
}

interface FacialExpressionState {
  currentExpressions: Expression[]
  blendShapeWeights: Map<string, number>
  boneTransforms: Map<string, BoneTransform>
  blinkTimer: number
  performance: {
    activeExpressions: number
    activeBlendShapes: number
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export default function FacialExpressionSystem({
  facialBones = [],
  blendShapes = [],
  config = {
    enableBlendShapes: true,
    enableBoneAnimation: true,
    enableLipSync: true,
    enableEyeMovement: true,
    enableBlinking: true,
    blendShapeSmoothing: 0.15,
    boneAnimationSmoothing: 0.15,
    maxSimultaneousExpressions: 3
  }
}: {
  facialBones: FacialBone[]
  blendShapes: BlendShape[]
  config?: Partial<FacialExpressionConfig>
}) {
  const finalConfig: FacialExpressionConfig = {
    enableBlendShapes: config.enableBlendShapes ?? true,
    enableBoneAnimation: config.enableBoneAnimation ?? true,
    enableLipSync: config.enableLipSync ?? true,
    enableEyeMovement: config.enableEyeMovement ?? true,
    enableBlinking: config.enableBlinking ?? true,
    blendShapeSmoothing: config.blendShapeSmoothing ?? 0.15,
    boneAnimationSmoothing: config.boneAnimationSmoothing ?? 0.15,
    maxSimultaneousExpressions: config.maxSimultaneousExpressions ?? 3
  }

  const [state, setState] = useState<FacialExpressionState>({
    currentExpressions: [],
    blendShapeWeights: new Map(),
    boneTransforms: new Map(),
    blinkTimer: 0,
    performance: {
      activeExpressions: 0,
      activeBlendShapes: 0
    }
  })

  const skinnedMeshRef = useRef<SkinnedMesh | null>(null)
  const lastTick = useRef<number>(performance.now())

  const { audioLevel, lipSyncEnabled } = useAppStore()

  const presets = useMemo(() => new Map<ExpressionType, Expression>([
    [ExpressionType.NEUTRAL, {
      type: ExpressionType.NEUTRAL,
      intensity: 1,
      durationMs: 0,
      blendShapes: new Map(),
      boneRotations: new Map(),
      bonePositions: new Map(),
      inMs: 200,
      outMs: 200
    }],
    [ExpressionType.HAPPY, {
      type: ExpressionType.HAPPY,
      intensity: 1,
      durationMs: 2000,
      blendShapes: new Map([
        ['smile', 0.8],
        ['cheek_raise', 0.6]
      ]),
      boneRotations: new Map([
        ['mouth_corner_l', new Euler(0, 0, 0.25)],
        ['mouth_corner_r', new Euler(0, 0, -0.25)]
      ]),
      bonePositions: new Map(),
      inMs: 250,
      outMs: 400
    }],
    [ExpressionType.SAD, {
      type: ExpressionType.SAD,
      intensity: 1,
      durationMs: 2500,
      blendShapes: new Map([
        ['frown', 0.7]
      ]),
      boneRotations: new Map([
        ['mouth_corner_l', new Euler(0, 0, -0.2)],
        ['mouth_corner_r', new Euler(0, 0, 0.2)]
      ]),
      bonePositions: new Map(),
      inMs: 300,
      outMs: 500
    }],
    [ExpressionType.ANGRY, {
      type: ExpressionType.ANGRY,
      intensity: 1,
      durationMs: 1200,
      blendShapes: new Map([
        ['brow_furrow', 0.8]
      ]),
      boneRotations: new Map([
        ['jaw', new Euler(0, 0, 0.1)]
      ]),
      bonePositions: new Map(),
      inMs: 100,
      outMs: 250
    }],
    [ExpressionType.SURPRISED, {
      type: ExpressionType.SURPRISED,
      intensity: 1,
      durationMs: 800,
      blendShapes: new Map([
        ['brow_raise', 0.9],
        ['mouth_open', 0.6]
      ]),
      boneRotations: new Map([
        ['jaw', new Euler(0, 0, -0.25)]
      ]),
      bonePositions: new Map(),
      inMs: 80,
      outMs: 200
    }],
    [ExpressionType.WINK, {
      type: ExpressionType.WINK,
      intensity: 1,
      durationMs: 350,
      blendShapes: new Map([
        ['eye_close_r', 0.95]
      ]),
      boneRotations: new Map(),
      bonePositions: new Map(),
      inMs: 60,
      outMs: 120
    }],
    [ExpressionType.BLINK, {
      type: ExpressionType.BLINK,
      intensity: 1,
      durationMs: 180,
      blendShapes: new Map([
        ['eye_close_l', 0.95],
        ['eye_close_r', 0.95]
      ]),
      boneRotations: new Map(),
      bonePositions: new Map(),
      inMs: 40,
      outMs: 80
    }]
  ]), [])

  // Initialize maps for provided bones and blendshapes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      blendShapeWeights: new Map(blendShapes.map(bs => [bs.name, 0])),
      boneTransforms: new Map(
        facialBones.map(b => [
          b.name,
          { rotation: b.bone.rotation.clone(), position: b.bone.position.clone() }
        ])
      )
    }))
  }, [facialBones, blendShapes])

  const addExpression = useCallback((type: ExpressionType, intensity = 1, durationOverrideMs?: number) => {
    const preset = presets.get(type)
    if (!preset) return

    setState(prev => {
      const next = { ...prev }
      const list = [...next.currentExpressions]
      if (list.length >= finalConfig.maxSimultaneousExpressions) list.shift()
      list.push({
        ...preset,
        intensity,
        durationMs: durationOverrideMs ?? preset.durationMs
      })
      next.currentExpressions = list
      return next
    })
  }, [presets, finalConfig.maxSimultaneousExpressions])

  const removeExpression = useCallback((type: ExpressionType) => {
    setState(prev => ({
      ...prev,
      currentExpressions: prev.currentExpressions.filter(e => e.type !== type)
    }))
  }, [])

  const applyBlendShapes = useCallback(() => {
    if (!finalConfig.enableBlendShapes) return

    const target = new Map<string, number>()
    blendShapes.forEach(bs => target.set(bs.name, 0))

    state.currentExpressions.forEach(exp => {
      exp.blendShapes.forEach((weight, name) => {
        target.set(name, Math.max(target.get(name) ?? 0, weight * exp.intensity))
      })
    })

    const smoothing = finalConfig.blendShapeSmoothing
    const nextWeights = new Map(state.blendShapeWeights)

    target.forEach((tWeight, name) => {
      const c = nextWeights.get(name) ?? 0
      const n = lerp(c, tWeight, smoothing)
      nextWeights.set(name, n)

      if (skinnedMeshRef.current && skinnedMeshRef.current.morphTargetDictionary) {
        const idx = (skinnedMeshRef.current.morphTargetDictionary as Record<string, number>)[name]
        if (idx !== undefined && skinnedMeshRef.current.morphTargetInfluences) {
          skinnedMeshRef.current.morphTargetInfluences[idx] = n
        }
      }
    })

    setState(prev => ({ ...prev, blendShapeWeights: nextWeights }))
  }, [state.blendShapeWeights, state.currentExpressions, blendShapes, finalConfig.blendShapeSmoothing, finalConfig.enableBlendShapes])

  const applyBoneTransforms = useCallback(() => {
    if (!finalConfig.enableBoneAnimation) return

    const targetRot = new Map<string, Euler>()
    const targetPos = new Map<string, Vector3>()
    facialBones.forEach(b => {
      targetRot.set(b.name, new Euler(0, 0, 0))
      targetPos.set(b.name, new Vector3(0, 0, 0))
    })

    state.currentExpressions.forEach(exp => {
      exp.boneRotations.forEach((rot, name) => {
        const e = targetRot.get(name) ?? new Euler(0, 0, 0)
        targetRot.set(name, new Euler(e.x + rot.x * exp.intensity, e.y + rot.y * exp.intensity, e.z + rot.z * exp.intensity))
      })
      exp.bonePositions.forEach((pos, name) => {
        const v = targetPos.get(name) ?? new Vector3(0, 0, 0)
        targetPos.set(name, v.clone().add(pos.clone().multiplyScalar(exp.intensity)))
      })
    })

    const smoothing = finalConfig.boneAnimationSmoothing
    const nextTransforms = new Map(state.boneTransforms)

    facialBones.forEach(b => {
      const cur = nextTransforms.get(b.name) || { rotation: new Euler(), position: new Vector3() }
      const tR = targetRot.get(b.name) ?? new Euler(0, 0, 0)
      const tP = targetPos.get(b.name) ?? new Vector3(0, 0, 0)

      const newRot = new Euler(
        lerp(cur.rotation.x, tR.x, smoothing),
        lerp(cur.rotation.y, tR.y, smoothing),
        lerp(cur.rotation.z, tR.z, smoothing)
      )
      const newPos = new Vector3(
        lerp(cur.position.x, tP.x, smoothing),
        lerp(cur.position.y, tP.y, smoothing),
        lerp(cur.position.z, tP.z, smoothing)
      )

      const c = b.constraints
      newRot.x = Math.max(c.minRotation.x, Math.min(c.maxRotation.x, newRot.x))
      newRot.y = Math.max(c.minRotation.y, Math.min(c.maxRotation.y, newRot.y))
      newRot.z = Math.max(c.minRotation.z, Math.min(c.maxRotation.z, newRot.z))

      newPos.x = Math.max(c.minPosition.x, Math.min(c.maxPosition.x, newPos.x))
      newPos.y = Math.max(c.minPosition.y, Math.min(c.maxPosition.y, newPos.y))
      newPos.z = Math.max(c.minPosition.z, Math.min(c.maxPosition.z, newPos.z))

      b.bone.rotation.copy(newRot)
      b.bone.position.copy(newPos)
      b.bone.updateMatrixWorld()

      nextTransforms.set(b.name, { rotation: newRot, position: newPos })
    })

    setState(prev => ({ ...prev, boneTransforms: nextTransforms }))
  }, [state.boneTransforms, state.currentExpressions, facialBones, finalConfig.boneAnimationSmoothing, finalConfig.enableBoneAnimation])

  const tickBlink = useCallback((dt: number) => {
    if (!finalConfig.enableBlinking) return
    setState(prev => ({ ...prev, blinkTimer: prev.blinkTimer + dt }))
    if (state.blinkTimer > 2000 + Math.random() * 2000) {
      addExpression(ExpressionType.BLINK)
      setState(prev => ({ ...prev, blinkTimer: 0 }))
    }
  }, [state.blinkTimer, finalConfig.enableBlinking, addExpression])

  const tickLipSync = useCallback(() => {
    if (!finalConfig.enableLipSync || !lipSyncEnabled) return
    // Simple jaw rotation from audio level
    const jawBones = facialBones.filter(b => b.type === 'jaw')
    const amount = Math.min(1, Math.max(0, audioLevel / 0.15)) * 0.35
    jawBones.forEach(b => {
      const r = b.bone.rotation
      b.bone.rotation.set(r.x, r.y, -amount)
      b.bone.updateMatrixWorld()
    })
  }, [finalConfig.enableLipSync, lipSyncEnabled, audioLevel, facialBones])

  useFrame(() => {
    const now = performance.now()
    const dtMs = Math.min(100, now - lastTick.current)
    lastTick.current = now

    // Cull expired expressions
    if (state.currentExpressions.length) {
      setState(prev => ({
        ...prev,
        currentExpressions: prev.currentExpressions.filter(e => e.durationMs <= 0 || now - lastTick.current < e.durationMs),
        performance: {
          activeExpressions: prev.currentExpressions.length,
          activeBlendShapes: prev.blendShapeWeights.size
        }
      }))
    }

    applyBlendShapes()
    applyBoneTransforms()
    tickBlink(dtMs)
    tickLipSync()
  })

  useEffect(() => {
    ;(window as any).__FACIAL_EXPRESSIONS__ = {
      getState: () => state,
      addExpression: (type: ExpressionType, intensity?: number, durationMs?: number) => addExpression(type, intensity, durationMs),
      removeExpression: (type: ExpressionType) => removeExpression(type),
      clear: () => setState(prev => ({ ...prev, currentExpressions: [] })),
      setSkinnedMesh: (mesh: SkinnedMesh) => { skinnedMeshRef.current = mesh }
    }
  }, [state, addExpression, removeExpression])

  return null
}
