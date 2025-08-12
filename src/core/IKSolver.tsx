/**
 * IK (Inverse Kinematics) Solver
 * 
 * Advanced IK system for realistic limb positioning and natural character movement.
 * Provides real-time IK solving for arms, legs, and spine with physics integration.
 * 
 * Phase 4 Priority 3 - Agent 1 Implementation
 */

import { useRef, useEffect, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Quaternion, Matrix4, Bone, Object3D, Euler } from 'three'

// IK chain configuration
export interface IKChain {
  id: string
  bones: Bone[]
  target: Vector3
  effector: Bone
  root: Bone
  constraints: IKConstraint[]
  solver: 'FABRIK' | 'CCD' | 'TwoBone'
  iterations: number
  tolerance: number
}

// IK constraint types
export interface IKConstraint {
  type: 'rotation' | 'distance' | 'angle'
  min: number
  max: number
  bone: Bone
  axis?: Vector3
}

// IK solver configuration
export interface IKSolverConfig {
  enablePhysics: boolean
  enableConstraints: boolean
  enableSmoothing: boolean
  maxIterations: number
  tolerance: number
  damping: number
  gravity: Vector3
}

// IK target interface
export interface IKTarget {
  id: string
  position: Vector3
  rotation?: Quaternion
  weight: number
  priority: number
}

/**
 * IK Solver Component
 * Advanced inverse kinematics system for realistic character movement
 */
export function IKSolver({ 
  chains = [],
  targets = [],
  config = {
    enablePhysics: true,
    enableConstraints: true,
    enableSmoothing: true,
    maxIterations: 10,
    tolerance: 0.01,
    damping: 0.1,
    gravity: new Vector3(0, -9.81, 0)
  }
}: {
  chains: IKChain[]
  targets: IKTarget[]
  config?: Partial<IKSolverConfig>
}) {
  console.log('🦴 Agent 1: IKSolver initialized with:', {
    chainsCount: chains.length,
    targetsCount: targets.length,
    config
  })

  // Refs for performance optimization
  const lastSolveTime = useRef(0)
  const solveCount = useRef(0)
  const performanceMetrics = useRef({
    averageSolveTime: 0,
    totalSolves: 0,
    constraintViolations: 0
  })

  // Store original bone transforms for reset
  const originalTransforms = useRef(new Map<Bone, { position: Vector3; rotation: Quaternion; scale: Vector3 }>())

  // Initialize bone transforms
  useEffect(() => {
    chains.forEach(chain => {
      chain.bones.forEach(bone => {
        if (!originalTransforms.current.has(bone)) {
          originalTransforms.current.set(bone, {
            position: bone.position.clone(),
            rotation: bone.rotation.clone(),
            scale: bone.scale.clone()
          })
        }
      })
    })
  }, [chains])

  // FABRIK (Forward And Backward Reaching Inverse Kinematics) solver
  const solveFABRIK = useCallback((chain: IKChain, target: Vector3) => {
    const bones = chain.bones
    const effector = chain.effector
    const root = chain.root
    
    if (bones.length < 2) return false

    // Store original positions
    const originalPositions = bones.map(bone => bone.getWorldPosition(new Vector3()))
    const boneLengths = []
    
    // Calculate bone lengths
    for (let i = 0; i < bones.length - 1; i++) {
      const current = bones[i].getWorldPosition(new Vector3())
      const next = bones[i + 1].getWorldPosition(new Vector3())
      boneLengths.push(current.distanceTo(next))
    }

    // Check if target is reachable
    const totalLength = boneLengths.reduce((sum, length) => sum + length, 0)
    const rootPos = root.getWorldPosition(new Vector3())
    const targetDistance = rootPos.distanceTo(target)
    
    if (targetDistance > totalLength) {
      // Target is unreachable, extend chain
      const direction = target.clone().sub(rootPos).normalize()
      for (let i = 0; i < bones.length - 1; i++) {
        const bone = bones[i]
        const nextBone = bones[i + 1]
        const boneLength = boneLengths[i]
        
        nextBone.position.copy(direction.clone().multiplyScalar(boneLength))
        bone.updateMatrixWorld()
      }
      return true
    }

    // FABRIK algorithm
    for (let iteration = 0; iteration < config.maxIterations || 10; iteration++) {
      // Forward reaching
      effector.position.copy(target)
      effector.updateMatrixWorld()
      
      for (let i = bones.length - 2; i >= 0; i--) {
        const current = bones[i]
        const next = bones[i + 1]
        const boneLength = boneLengths[i]
        
        const direction = current.getWorldPosition(new Vector3())
          .sub(next.getWorldPosition(new Vector3()))
          .normalize()
        
        next.position.copy(current.getWorldPosition(new Vector3())
          .add(direction.multiplyScalar(boneLength)))
        next.updateMatrixWorld()
      }

      // Backward reaching
      root.position.copy(originalPositions[0])
      root.updateMatrixWorld()
      
      for (let i = 0; i < bones.length - 1; i++) {
        const current = bones[i]
        const next = bones[i + 1]
        const boneLength = boneLengths[i]
        
        const direction = next.getWorldPosition(new Vector3())
          .sub(current.getWorldPosition(new Vector3()))
          .normalize()
        
        next.position.copy(current.getWorldPosition(new Vector3())
          .add(direction.multiplyScalar(boneLength)))
        next.updateMatrixWorld()
      }

      // Check convergence
      const effectorPos = effector.getWorldPosition(new Vector3())
      if (effectorPos.distanceTo(target) < (config.tolerance || 0.01)) {
        break
      }
    }

    return true
  }, [config.maxIterations, config.tolerance])

  // CCD (Cyclic Coordinate Descent) solver
  const solveCCD = useCallback((chain: IKChain, target: Vector3) => {
    const bones = chain.bones
    const effector = chain.effector
    
    for (let iteration = 0; iteration < (config.maxIterations || 10); iteration++) {
      for (let i = 0; i < bones.length - 1; i++) {
        const bone = bones[i]
        const boneWorldPos = bone.getWorldPosition(new Vector3())
        const effectorWorldPos = effector.getWorldPosition(new Vector3())
        
        // Calculate rotation to point towards target
        const toTarget = target.clone().sub(boneWorldPos).normalize()
        const toEffector = effectorWorldPos.clone().sub(boneWorldPos).normalize()
        
        const rotationAxis = new Vector3().crossVectors(toEffector, toTarget).normalize()
        const rotationAngle = Math.acos(Math.max(-1, Math.min(1, toEffector.dot(toTarget))))
        
        if (rotationAxis.length() > 0.001 && rotationAngle > 0.001) {
          const quaternion = new Quaternion().setFromAxisAngle(rotationAxis, rotationAngle * (config.damping || 0.1))
          bone.quaternion.multiply(quaternion)
          bone.updateMatrixWorld()
        }
      }
      
      // Check convergence
      const effectorPos = effector.getWorldPosition(new Vector3())
      if (effectorPos.distanceTo(target) < (config.tolerance || 0.01)) {
        break
      }
    }
  }, [config.maxIterations, config.tolerance, config.damping])

  // Two-bone IK solver (optimized for arms/legs)
  const solveTwoBone = useCallback((chain: IKChain, target: Vector3) => {
    if (chain.bones.length !== 3) return false
    
    const [root, middle, effector] = chain.bones
    const rootPos = root.getWorldPosition(new Vector3())
    const targetPos = target.clone()
    
    // Calculate bone lengths
    const rootMiddlePos = middle.getWorldPosition(new Vector3())
    const middleEffectorPos = effector.getWorldPosition(new Vector3())
    const rootMiddleLength = rootPos.distanceTo(rootMiddlePos)
    const middleEffectorLength = rootMiddlePos.distanceTo(middleEffectorPos)
    
    // Calculate target distance
    const targetDistance = rootPos.distanceTo(targetPos)
    const maxReach = rootMiddleLength + middleEffectorLength
    
    // Handle unreachable target
    if (targetDistance > maxReach) {
      const direction = targetPos.clone().sub(rootPos).normalize()
      const newMiddlePos = rootPos.clone().add(direction.clone().multiplyScalar(rootMiddleLength))
      const newEffectorPos = newMiddlePos.clone().add(direction.clone().multiplyScalar(middleEffectorLength))
      
      // Update bone positions
      middle.position.copy(newMiddlePos)
      effector.position.copy(newEffectorPos)
      middle.updateMatrixWorld()
      effector.updateMatrixWorld()
      return true
    }
    
    // Two-bone IK calculation
    const cosAngle = (rootMiddleLength * rootMiddleLength + middleEffectorLength * middleEffectorLength - targetDistance * targetDistance) / 
                    (2 * rootMiddleLength * middleEffectorLength)
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)))
    
    // Calculate rotation axis
    const rootToTarget = targetPos.clone().sub(rootPos).normalize()
    const rootToMiddle = rootMiddlePos.clone().sub(rootPos).normalize()
    const rotationAxis = new Vector3().crossVectors(rootToMiddle, rootToTarget).normalize()
    
    if (rotationAxis.length() > 0.001) {
      // Apply rotation to middle bone
      const quaternion = new Quaternion().setFromAxisAngle(rotationAxis, angle)
      middle.quaternion.multiply(quaternion)
      middle.updateMatrixWorld()
      
      // Update effector position
      const newMiddlePos = middle.getWorldPosition(new Vector3())
      const newEffectorPos = newMiddlePos.clone().add(
        targetPos.clone().sub(newMiddlePos).normalize().multiplyScalar(middleEffectorLength)
      )
      effector.position.copy(newEffectorPos)
      effector.updateMatrixWorld()
    }
    
    return true
  }, [])

  // Apply constraints
  const applyConstraints = useCallback((chain: IKChain) => {
    if (!config.enableConstraints) return
    
    chain.constraints.forEach(constraint => {
      const bone = constraint.bone
      
      switch (constraint.type) {
        case 'rotation':
          // Limit rotation around specified axis
          const euler = new Euler().setFromQuaternion(bone.quaternion)
          const axis = constraint.axis || new Vector3(1, 0, 0)
          
          if (axis.x > 0) {
            euler.x = Math.max(constraint.min, Math.min(constraint.max, euler.x))
          }
          if (axis.y > 0) {
            euler.y = Math.max(constraint.min, Math.min(constraint.max, euler.y))
          }
          if (axis.z > 0) {
            euler.z = Math.max(constraint.min, Math.min(constraint.max, euler.z))
          }
          
          bone.quaternion.setFromEuler(euler)
          break
          
        case 'distance':
          // Limit distance from parent
          const parent = bone.parent as Bone
          if (parent) {
            const distance = bone.position.length()
            if (distance > constraint.max) {
              bone.position.normalize().multiplyScalar(constraint.max)
            } else if (distance < constraint.min) {
              bone.position.normalize().multiplyScalar(constraint.min)
            }
          }
          break
          
        case 'angle':
          // Limit angle between bones
          const parentBone = bone.parent as Bone
          if (parentBone) {
            const parentDirection = parentBone.getWorldDirection(new Vector3())
            const boneDirection = bone.getWorldDirection(new Vector3())
            const angle = Math.acos(Math.max(-1, Math.min(1, parentDirection.dot(boneDirection))))
            
            if (angle > constraint.max) {
              // Apply angle constraint
              const rotationAxis = new Vector3().crossVectors(parentDirection, boneDirection).normalize()
              const correctionAngle = angle - constraint.max
              const correctionQuaternion = new Quaternion().setFromAxisAngle(rotationAxis, correctionAngle)
              bone.quaternion.multiply(correctionQuaternion)
            }
          }
          break
      }
      
      bone.updateMatrixWorld()
    })
  }, [config.enableConstraints])

  // Apply physics (simple gravity and damping)
  const applyPhysics = useCallback((chain: IKChain, deltaTime: number) => {
    if (!config.enablePhysics) return
    
    chain.bones.forEach(bone => {
      // Apply gravity
      const gravityForce = config.gravity?.clone().multiplyScalar(deltaTime) || new Vector3(0, -9.81 * deltaTime, 0)
      bone.position.add(gravityForce)
      
      // Apply damping
      const damping = config.damping || 0.1
      bone.position.multiplyScalar(1 - damping * deltaTime)
      
      bone.updateMatrixWorld()
    })
  }, [config.enablePhysics, config.gravity, config.damping])

  // Main IK solving function
  const solveIK = useCallback((deltaTime: number) => {
    const startTime = performance.now()
    
    chains.forEach(chain => {
      // Find target for this chain
      const target = targets.find(t => t.id === chain.id)
      if (!target) return
      
      // Apply physics
      applyPhysics(chain, deltaTime)
      
      // Solve IK based on solver type
      let solved = false
      switch (chain.solver) {
        case 'FABRIK':
          solved = solveFABRIK(chain, target.position)
          break
        case 'CCD':
          solveCCD(chain, target.position)
          solved = true
          break
        case 'TwoBone':
          solved = solveTwoBone(chain, target.position)
          break
      }
      
      // Apply constraints
      if (solved) {
        applyConstraints(chain)
      }
    })
    
    // Update performance metrics
    const solveTime = performance.now() - startTime
    solveCount.current++
    performanceMetrics.current.totalSolves = solveCount.current
    performanceMetrics.current.averageSolveTime = 
      (performanceMetrics.current.averageSolveTime * (solveCount.current - 1) + solveTime) / solveCount.current
    
    lastSolveTime.current = startTime
  }, [chains, targets, applyPhysics, solveFABRIK, solveCCD, solveTwoBone, applyConstraints])

  // Main update loop
  useFrame((state, delta) => {
    solveIK(delta)
  })

  // Expose IK solver methods globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__IK_SOLVER__ = {
        getPerformanceMetrics: () => performanceMetrics.current,
        resetBones: () => {
          originalTransforms.current.forEach((transform, bone) => {
            bone.position.copy(transform.position)
            bone.rotation.copy(transform.rotation)
            bone.scale.copy(transform.scale)
            bone.updateMatrixWorld()
          })
        },
        addChain: (chain: IKChain) => {
          chains.push(chain)
        },
        removeChain: (chainId: string) => {
          const index = chains.findIndex(c => c.id === chainId)
          if (index >= 0) {
            chains.splice(index, 1)
          }
        }
      }
    }
  }, [chains])

  // This component doesn't render anything visible
  return null
}

export default IKSolver
