'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { User, FileText, Lightbulb } from 'lucide-react';

// Precomputed deterministic particle coordinates outside render to ensure pure component execution
const PARTICLE_COUNT = 45;
const DETERMINISTIC_POSITIONS = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  // Deterministic pseudo-random distribution
  const seed1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  const seed2 = Math.sin(i * 39.346 + 11.135) * 43758.5453;
  const seed3 = Math.sin(i * 73.156 + 54.912) * 43758.5453;

  DETERMINISTIC_POSITIONS[i * 3] = ((seed1 - Math.floor(seed1)) - 0.5) * 5;
  DETERMINISTIC_POSITIONS[i * 3 + 1] = ((seed2 - Math.floor(seed2)) - 0.5) * 4;
  DETERMINISTIC_POSITIONS[i * 3 + 2] = ((seed3 - Math.floor(seed3)) - 0.5) * 3;
}

// 3D Model: Abstract Geometric 'A' with Lime Core & Orbiting Data Rings
function Artix3DGeometry({ mouse }: { mouse: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const targetRotationY = mouse.x * 0.45;
      const targetRotationX = -mouse.y * 0.25;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.05);
    }

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.4;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.25;
      ring1Ref.current.rotation.x += delta * 0.15;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.3;
      ring2Ref.current.rotation.z -= delta * 0.1;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Central Black Geometric A - Left Slanted Pillar */}
      <mesh position={[-0.55, 0, 0]} rotation={[0, 0, -0.32]}>
        <boxGeometry args={[0.38, 2.3, 0.42]} />
        <meshStandardMaterial
          color="#121316"
          metalness={0.85}
          roughness={0.25}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Central Black Geometric A - Right Slanted Pillar */}
      <mesh position={[0.55, 0, 0]} rotation={[0, 0, 0.32]}>
        <boxGeometry args={[0.38, 2.3, 0.42]} />
        <meshStandardMaterial
          color="#121316"
          metalness={0.85}
          roughness={0.25}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Apex Cap */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.48, 0.3, 0.42]} />
        <meshStandardMaterial
          color="#18191e"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Electric Lime Inner Wedge / Prism */}
      <mesh ref={coreRef} position={[0, -0.15, 0]}>
        <coneGeometry args={[0.42, 0.9, 4]} />
        <meshStandardMaterial
          color="#C8FF4D"
          emissive="#9ee810"
          emissiveIntensity={0.65}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Lime Crossbar Accent */}
      <mesh position={[0, -0.18, 0.08]}>
        <boxGeometry args={[0.65, 0.12, 0.25]} />
        <meshStandardMaterial
          color="#C8FF4D"
          emissive="#7bc400"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Cylindrical Platform */}
      <mesh position={[0, -1.35, 0]}>
        <cylinderGeometry args={[1.8, 2.1, 0.22, 48]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Neon Lime Ring */}
      <mesh position={[0, -1.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.75, 1.86, 48]} />
        <meshBasicMaterial color="#C8FF4D" side={THREE.DoubleSide} />
      </mesh>

      {/* Orbital Ring 1 with Teal Data Node */}
      <mesh ref={ring1Ref} rotation={[0.4, 0.2, 0]}>
        <torusGeometry args={[2.0, 0.012, 16, 64]} />
        <meshBasicMaterial color="#C8FF4D" transparent opacity={0.65} />
        <mesh position={[2.0, 0, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00bcd4" emissiveIntensity={0.8} />
        </mesh>
      </mesh>

      {/* Orbital Ring 2 with Orange Data Node */}
      <mesh ref={ring2Ref} rotation={[-0.3, 0.4, 0]}>
        <torusGeometry args={[2.3, 0.01, 16, 64]} />
        <meshBasicMaterial color="#FF9F43" transparent opacity={0.55} />
        <mesh position={[-2.3, 0, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#FF9F43" emissive="#e67e22" emissiveIntensity={0.8} />
        </mesh>
      </mesh>

      {/* Floating Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[DETERMINISTIC_POSITIONS, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color="#C8FF4D"
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>

      {/* Lights */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 6, 4]} intensity={1.4} />
      <pointLight position={[0, 0, 2]} color="#C8FF4D" intensity={1.2} distance={4} />
      <pointLight position={[0, -1, 0]} color="#C8FF4D" intensity={2.0} distance={3} />
    </group>
  );
}

export function ArtixScene() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hasWebGL] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      setMouse({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[460px] sm:h-[520px] lg:h-[560px] flex items-center justify-center overflow-visible"
    >
      {/* Radiant Background Ambiance Rings */}
      <div className="absolute w-[380px] h-[380px] rounded-full bg-[#C8FF4D]/15 blur-3xl pointer-events-none -z-10" />
      <div className="absolute w-[280px] h-[280px] rounded-full bg-[#FF9F43]/10 blur-2xl pointer-events-none -z-10 translate-x-12 translate-y-8" />

      {/* Interactive 3D Canvas */}
      {hasWebGL ? (
        <Canvas
          camera={{ position: [0, 0.4, 4.4], fov: 42 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <Suspense fallback={null}>
            <Artix3DGeometry mouse={mouse} />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              maxPolarAngle={Math.PI / 1.9}
              minPolarAngle={Math.PI / 2.3}
            />
          </Suspense>
        </Canvas>
      ) : (
        /* WebGL Fallback CSS Geometric Artwork */
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative w-48 h-56 flex items-center justify-center animate-pulse-ring">
            <svg viewBox="0 0 100 120" className="w-44 h-52 drop-shadow-2xl">
              <polygon points="50,10 15,100 35,100 50,60 65,100 85,100" fill="#121316" />
              <polygon points="50,55 38,90 62,90" fill="#C8FF4D" />
            </svg>
          </div>
          <div className="w-64 h-8 rounded-full bg-gradient-to-r from-neutral-200 via-white to-neutral-200 border-2 border-[#C8FF4D] shadow-[0_0_25px_rgba(200,255,77,0.4)]" />
        </div>
      )}

      {/* Floating Badge 1: Real People */}
      <div className="absolute top-12 left-4 sm:left-10 z-20 animate-float">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-neutral-200/80 hover:scale-105 transition-transform">
          <div className="w-5 h-5 rounded-full bg-[#C8FF4D]/25 flex items-center justify-center text-[#101114]">
            <User className="w-3.5 h-3.5 text-neutral-800" />
          </div>
          <span className="text-xs font-semibold text-neutral-800">Real People</span>
        </div>
      </div>

      {/* Floating Badge 2: Real Problems */}
      <div className="absolute top-16 right-4 sm:right-12 z-20 animate-float-delayed">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-neutral-200/80 hover:scale-105 transition-transform">
          <div className="w-5 h-5 rounded-full bg-[#C8FF4D]/25 flex items-center justify-center text-[#101114]">
            <FileText className="w-3.5 h-3.5 text-neutral-800" />
          </div>
          <span className="text-xs font-semibold text-neutral-800">Real Problems</span>
        </div>
      </div>

      {/* Floating Badge 3: Better Ideas */}
      <div className="absolute bottom-20 right-2 sm:right-8 z-20 animate-float">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-neutral-200/80 hover:scale-105 transition-transform">
          <div className="w-5 h-5 rounded-full bg-[#C8FF4D]/30 flex items-center justify-center text-[#101114]">
            <Lightbulb className="w-3.5 h-3.5 text-[#101114]" />
          </div>
          <span className="text-xs font-semibold text-neutral-800">Better Ideas</span>
        </div>
      </div>
    </div>
  );
}
