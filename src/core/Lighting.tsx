import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DirectionalLight } from 'three'

// Professional lighting setup matching Mixamo's studio lighting
function Lighting() {
  const directionalRef = useRef<DirectionalLight>(null!)
  const rimLightRef = useRef<DirectionalLight>(null!)

  useFrame(({ clock }) => {
    // Subtle light movement for dynamic feel
    if (directionalRef.current) {
      directionalRef.current.position.x = Math.sin(clock.elapsedTime * 0.1) * 0.5
    }
  })

  return (
    <>
      {/* Key Light - Main directional light */}
      <directionalLight
        ref={directionalRef}
        position={[5, 8, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />

      {/* Fill Light - Softer secondary light */}
      <directionalLight
        position={[-3, 4, 2]}
        intensity={0.6}
        color="#e6f3ff"
        castShadow={false}
      />

      {/* Rim Light - Backlight for edge definition */}
      <directionalLight
        ref={rimLightRef}
        position={[0, 3, -5]}
        intensity={0.8}
        color="#fff2e6"
        castShadow={false}
      />

      {/* Ambient Light - Overall scene illumination */}
      <ambientLight intensity={0.3} color="#404040" />

      {/* Point lights for character detail */}
      <pointLight
        position={[2, 2, 2]}
        intensity={0.5}
        color="#ffffff"
        distance={10}
        decay={2}
      />

      <pointLight
        position={[-2, 1, 3]}
        intensity={0.3}
        color="#e6f3ff"
        distance={8}
        decay={2}
      />

      {/* Hemisphere light for natural feel */}
      <hemisphereLight
        args={["#87ceeb", "#362d1f", 0.4]}
      />
    </>
  )
}

export default Lighting
