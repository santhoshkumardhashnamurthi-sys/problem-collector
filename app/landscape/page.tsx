'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { Compass, Loader2 } from 'lucide-react';

const LandscapeScene = dynamic(
  () => import('@/components/3d/LandscapeScene').then((m) => m.LandscapeScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-[#101114]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8FF4D]" />
        <p className="text-xs text-neutral-400 font-mono">Rendering 3D Semantic Graph...</p>
      </div>
    ),
  }
);

export default function LandscapePage() {
  const [selectedInfo, setSelectedInfo] = useState<{ name: string; type: string } | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#101114] text-white">
      <Navbar />

      <main className="flex-1 flex flex-col relative w-full h-[85vh]">
        {/* Top Controls Overlay */}
        <div className="absolute top-6 left-6 z-20 space-y-2 pointer-events-auto max-w-sm">
          <div className="inline-flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 px-3.5 py-1.5 rounded-full text-xs font-mono text-[#C8FF4D]">
            <Compass className="w-3.5 h-3.5" />
            <span>3D PROBLEM LANDSCAPE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Semantic Cluster Topology
          </h1>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Drag to rotate, scroll to zoom, click any node to inspect relationships between macro categories and emerging problem clusters.
          </p>
        </div>

        {/* Selected Node Panel Overlay */}
        {selectedInfo && (
          <div className="absolute bottom-8 left-6 z-20 bg-neutral-900/95 backdrop-blur border border-neutral-700 p-5 rounded-3xl shadow-xl max-w-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#C8FF4D]">
                {selectedInfo.type}
              </span>
              <button
                onClick={() => setSelectedInfo(null)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <h3 className="text-base font-bold text-white">{selectedInfo.name}</h3>
            <p className="text-xs text-neutral-400">
              Active node in ARTIX semantic opportunity graph with multi-contributor telemetry.
            </p>
            <Link
              href={`/explore?search=${encodeURIComponent(selectedInfo.name)}`}
              className="inline-block text-xs font-bold text-[#C8FF4D] hover:underline pt-1"
            >
              Explore Related Reports →
            </Link>
          </div>
        )}

        {/* 3D Canvas */}
        <div className="w-full h-full cursor-grab active:cursor-grabbing">
          <LandscapeScene onSelectNode={(name, type) => setSelectedInfo({ name, type })} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
