'use client';

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

function LandscapeNetwork({ onSelectNode }: { onSelectNode: (name: string, type: string) => void }) {
  const groupRef = useRef<THREE.Group>(null);

  const categories: Array<{ name: string; pos: [number, number, number]; color: string }> = [
    { name: 'Technology', pos: [0, 2.2, 0], color: '#FF9F43' },
    { name: 'Food', pos: [-2.4, 0.5, 1.2], color: '#C8FF4D' },
    { name: 'Transport', pos: [2.4, 0.5, 1.2], color: '#00e5ff' },
    { name: 'Healthcare', pos: [-1.8, -1.8, -0.8], color: '#ff5252' },
    { name: 'Business', pos: [1.8, -1.8, -0.8], color: '#b388ff' },
  ];

  const clusters = [
    { name: 'Nutritious Meals Near Parks', catIndex: 1, offset: [-0.8, -0.9, 0.4] },
    { name: 'Late Night Transit Deficit', catIndex: 2, offset: [0.8, -0.9, 0.4] },
    { name: 'Medical Billing Discrepancies', catIndex: 3, offset: [-0.6, 0.8, 0.5] },
    { name: 'Freelance Invoicing Delay', catIndex: 4, offset: [0.6, 0.8, 0.5] },
    { name: 'Developer Toolchain Friction', catIndex: 0, offset: [0, -1.2, 0.5] },
  ];

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {categories.map((cat) => (
        <group key={cat.name} position={cat.pos}>
          <mesh onClick={() => onSelectNode(cat.name, 'Category')}>
            <sphereGeometry args={[0.42, 32, 32]} />
            <meshStandardMaterial
              color={cat.color}
              emissive={cat.color}
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
          <Text
            position={[0, 0.65, 0]}
            fontSize={0.24}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {cat.name.toUpperCase()}
          </Text>
        </group>
      ))}

      {clusters.map((cl) => {
        const cat = categories[cl.catIndex];
        const clPos: [number, number, number] = [
          cat.pos[0] + cl.offset[0],
          cat.pos[1] + cl.offset[1],
          cat.pos[2] + cl.offset[2],
        ];

        const points = [
          new THREE.Vector3(cat.pos[0], cat.pos[1], cat.pos[2]),
          new THREE.Vector3(clPos[0], clPos[1], clPos[2]),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <group key={cl.name}>
            <primitive
              object={
                new THREE.Line(
                  lineGeo,
                  new THREE.LineBasicMaterial({ color: '#C8FF4D', transparent: true, opacity: 0.4 })
                )
              }
            />
            <mesh position={clPos} onClick={() => onSelectNode(cl.name, 'Opportunity Cluster')}>
              <sphereGeometry args={[0.22, 24, 24]} />
              <meshStandardMaterial color="#ffffff" emissive="#C8FF4D" emissiveIntensity={0.5} />
            </mesh>
          </group>
        );
      })}

      <ambientLight intensity={0.9} />
      <pointLight position={[5, 8, 5]} intensity={1.5} color="#C8FF4D" />
      <pointLight position={[-5, -8, -5]} intensity={1.2} color="#ffffff" />
    </group>
  );
}

export function LandscapeScene({ onSelectNode }: { onSelectNode: (name: string, type: string) => void }) {
  return (
    <Canvas camera={{ position: [0, 1.2, 7.5], fov: 45 }}>
      <Suspense fallback={null}>
        <LandscapeNetwork onSelectNode={onSelectNode} />
        <OrbitControls enablePan={true} enableZoom={true} maxDistance={15} minDistance={3} />
      </Suspense>
    </Canvas>
  );
}
