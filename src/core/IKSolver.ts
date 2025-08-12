/**
 * Inverse Kinematics (IK) Solver
 * 
 * Basic IK implementation for skeletal animation systems.
 * Provides foundational IK capabilities for character animation.
 */

import { Vector3, Bone } from 'three'

export interface IKConstraint {
  bone: Bone
  target: Vector3
  chainLength: number
  iterations: number
  precision: number
}

export interface IKChain {
  id: string
  bones: Bone[]
  target: Vector3
  poleTarget?: Vector3
  enabled: boolean
}

/**
 * Basic Two-Bone IK Solver (useful for arms and legs)
 */
export class TwoBoneIKSolver {
  /**
   * Solve two-bone IK chain (shoulder-elbow-wrist or hip-knee-ankle)
   */
  static solve(
    rootBone: Bone, 
    middleBone: Bone, 
    endBone: Bone, 
    target: Vector3, 
    poleTarget?: Vector3
  ): void {
    // Get bone lengths
    const upperLength = rootBone.position.distanceTo(middleBone.position)
    const lowerLength = middleBone.position.distanceTo(endBone.position)
    const totalLength = upperLength + lowerLength
    
    // Calculate target distance from root
    const rootPosition = rootBone.getWorldPosition(new Vector3())
    const targetDistance = rootPosition.distanceTo(target)
    
    // Check if target is reachable
    if (targetDistance > totalLength) {
      // Target too far - stretch towards it
      const direction = target.clone().sub(rootPosition).normalize()
      middleBone.position.copy(direction.clone().multiplyScalar(upperLength))
      endBone.position.copy(direction.clone().multiplyScalar(totalLength))
      return
    }
    
    if (targetDistance < Math.abs(upperLength - lowerLength)) {
      // Target too close - minimal bend
      const direction = target.clone().sub(rootPosition).normalize()
      const minimumReach = Math.abs(upperLength - lowerLength)
      middleBone.position.copy(direction.clone().multiplyScalar(upperLength))
      endBone.position.copy(direction.clone().multiplyScalar(minimumReach))
      return
    }
    
    // Calculate angles using law of cosines
    const cosineRule = (targetDistance * targetDistance + upperLength * upperLength - lowerLength * lowerLength) / 
                      (2 * targetDistance * upperLength)
    const angle1 = Math.acos(Math.max(-1, Math.min(1, cosineRule)))
    
    // Note: Full two-bone IK would calculate elbow/knee angles here for precise joint rotations
    
    // Apply rotations (simplified implementation)
    const direction = target.clone().sub(rootPosition).normalize()
    
    // Position middle bone
    const middlePosition = rootPosition.clone().add(
      direction.clone().multiplyScalar(upperLength * Math.cos(angle1))
    )
    
    // Apply pole target constraint if provided
    if (poleTarget) {
      const poleDirection = poleTarget.clone().sub(middlePosition).normalize()
      const bendDirection = poleDirection.clone().multiplyScalar(upperLength * Math.sin(angle1))
      middlePosition.add(bendDirection)
    }
    
    middleBone.position.copy(middlePosition.sub(rootPosition))
    
    // Position end bone
    const endDirection = target.clone().sub(middlePosition).normalize()
    endBone.position.copy(endDirection.multiplyScalar(lowerLength))
  }
}

/**
 * FABRIK (Forward And Backward Reaching Inverse Kinematics) Solver
 * More flexible for multi-joint chains
 */
export class FABRIKSolver {
  /**
   * Solve IK chain using FABRIK algorithm
   */
  static solve(chain: IKChain, maxIterations: number = 10, precision: number = 0.01): void {
    if (chain.bones.length < 2 || !chain.enabled) return
    
    const bones = chain.bones
    const target = chain.target
    const positions: Vector3[] = bones.map(bone => bone.getWorldPosition(new Vector3()))
    const distances: number[] = []
    
    // Calculate bone lengths
    for (let i = 0; i < bones.length - 1; i++) {
      distances[i] = positions[i].distanceTo(positions[i + 1])
    }
    
    const rootPosition = positions[0].clone()
    const totalLength = distances.reduce((sum, length) => sum + length, 0)
    const targetDistance = rootPosition.distanceTo(target)
    
    // Check if target is reachable
    if (targetDistance > totalLength) {
      // Stretch towards target
      const direction = target.clone().sub(rootPosition).normalize()
      let currentPos = rootPosition.clone()
      
      for (let i = 0; i < bones.length - 1; i++) {
        const nextPos = currentPos.clone().add(direction.clone().multiplyScalar(distances[i]))
        bones[i + 1].position.copy(nextPos.sub(bones[i].position))
        currentPos = nextPos
      }
      return
    }
    
    // FABRIK iterations
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Forward pass - start from end effector
      positions[positions.length - 1].copy(target)
      
      for (let i = positions.length - 2; i >= 0; i--) {
        const direction = positions[i].clone().sub(positions[i + 1]).normalize()
        positions[i].copy(positions[i + 1].clone().add(direction.multiplyScalar(distances[i])))
      }
      
      // Backward pass - start from root
      positions[0].copy(rootPosition)
      
      for (let i = 0; i < positions.length - 1; i++) {
        const direction = positions[i + 1].clone().sub(positions[i]).normalize()
        positions[i + 1].copy(positions[i].clone().add(direction.multiplyScalar(distances[i])))
      }
      
      // Check convergence
      const endEffectorDistance = positions[positions.length - 1].distanceTo(target)
      if (endEffectorDistance < precision) {
        break
      }
    }
    
    // Apply positions to bones
    for (let i = 1; i < bones.length; i++) {
      const localPosition = positions[i].clone().sub(positions[i - 1])
      bones[i].position.copy(localPosition)
    }
  }
}

/**
 * IK Manager for coordinating multiple IK chains
 */
export class IKManager {
  private chains: Map<string, IKChain> = new Map()
  
  /**
   * Add IK chain to management
   */
  addChain(chain: IKChain): void {
    this.chains.set(chain.id, chain)
  }
  
  /**
   * Remove IK chain
   */
  removeChain(chainId: string): void {
    this.chains.delete(chainId)
  }
  
  /**
   * Get IK chain by ID
   */
  getChain(chainId: string): IKChain | undefined {
    return this.chains.get(chainId)
  }
  
  /**
   * Update all enabled IK chains
   */
  update(): void {
    this.chains.forEach(chain => {
      if (chain.enabled && chain.bones.length >= 2) {
        if (chain.bones.length === 3) {
          // Use two-bone solver for three-bone chains
          TwoBoneIKSolver.solve(
            chain.bones[0],
            chain.bones[1], 
            chain.bones[2],
            chain.target,
            chain.poleTarget
          )
        } else {
          // Use FABRIK for longer chains
          FABRIKSolver.solve(chain)
        }
      }
    })
  }
  
  /**
   * Enable/disable IK chain
   */
  setChainEnabled(chainId: string, enabled: boolean): void {
    const chain = this.chains.get(chainId)
    if (chain) {
      chain.enabled = enabled
    }
  }
  
  /**
   * Set target position for IK chain
   */
  setChainTarget(chainId: string, target: Vector3): void {
    const chain = this.chains.get(chainId)
    if (chain) {
      chain.target.copy(target)
    }
  }
  
  /**
   * Get all chain IDs
   */
  getChainIds(): string[] {
    return Array.from(this.chains.keys())
  }
  
  /**
   * Clear all chains
   */
  clear(): void {
    this.chains.clear()
  }
}

export default IKManager
