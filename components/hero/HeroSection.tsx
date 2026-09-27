'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Send, Play } from 'lucide-react';
import { FloatingProblemCard } from '../problem-form/FloatingProblemCard';

const ArtixScene = dynamic(
  () => import('../3d/ArtixScene').then((mod) => mod.ArtixScene),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[560px] flex flex-col items-center justify-center">
        <div className="relative w-44 h-52 flex items-center justify-center animate-pulse">
          <svg viewBox="0 0 100 120" className="w-40 h-48 drop-shadow-xl">
            <polygon points="50,10 15,100 35,100 50,60 65,100 85,100" fill="#08131A" />
            <polygon points="50,55 38,90 62,90" fill="#C8FF3D" />
          </svg>
        </div>
        <div className="w-56 h-7 rounded-full bg-gradient-to-r from-neutral-200 via-white to-neutral-200 border-2 border-[#C8FF3D] shadow-[0_0_25px_rgba(200,255,61,0.3)]" />
      </div>
    ),
  }
);

interface HeroSectionProps {
  onProblemSubmitted?: () => void;
}

export function HeroSection({ onProblemSubmitted }: HeroSectionProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative w-full bg-[#F7F4E8] pt-8 pb-16 lg:pt-14 lg:pb-20 overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#C8FF3D]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/10 w-[450px] h-[450px] bg-[#C8FF3D]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Subtle organic lime curved trails SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-25 -z-10"
        viewBox="0 0 1440 800"
        fill="none"
      >
        <path
          d="M-100 400C250 250 500 650 900 350C1200 150 1400 450 1600 300"
          stroke="#C8FF3D"
          strokeWidth="1.5"
          strokeDasharray="4 8"
        />
        <path
          d="M0 600C350 400 650 700 1050 450C1350 250 1500 550 1700 400"
          stroke="#C8FF3D"
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          
          {/* Left Column: Headline, Philosophy & CTAs (Span 4 cols on large screens) */}
          <div className="lg:col-span-4 z-20 space-y-6">
            {/* Small tracking label */}
            <div className="inline-flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-neutral-500">
                REAL PROBLEMS → BETTER IDEAS
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#08131A] leading-[1.08] tracking-tight">
              Every Problem Is <br />
              <span className="text-[#96cc14] drop-shadow-sm">an Opportunity.</span>
            </h1>

            {/* Supporting Philosophy Subtitle */}
            <p className="text-base sm:text-lg font-semibold text-neutral-800">
              &ldquo;Don&apos;t start with an idea. Start with a problem.&rdquo;
            </p>

            {/* Paragraph Description */}
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-md">
              Tell us a problem you face. ARTIX collects real-world problems to understand what people actually need and discover what should be built next.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => scrollTo('submit-problem')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C8FF3D] hover:bg-[#DFFF73] text-[#08131A] text-xs sm:text-sm font-bold shadow-md shadow-[#C8FF3D]/30 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                Share a Problem →
              </button>

              <button
                type="button"
                onClick={() => scrollTo('how-it-works')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/90 hover:bg-white text-neutral-800 text-xs sm:text-sm font-semibold border border-neutral-300 shadow-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                How It Works →
              </button>
            </div>

            {/* Bottom Brand Line in Hero Left */}
            <div className="pt-6 flex items-center gap-3 text-xs text-neutral-500 border-t border-neutral-300/60">
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 36 36" fill="none" className="w-4 h-4">
                  <path d="M18 4L4 32H12L18 19L24 32H32L18 4Z" fill="#C8FF3D" />
                  <path d="M18 13L11 28H15L18 21L21 28H25L18 13Z" fill="#08131A" />
                </svg>
                <span className="font-bold tracking-wider text-[#08131A]">ARTIX</span>
              </div>
              <span className="text-neutral-300">|</span>
              <span>An ARTIX Product by <strong className="text-neutral-700">CodeArtix</strong></span>
            </div>
          </div>

          {/* Center Column: Interactive 3D ARTIX Visual (Span 4 cols) */}
          <div className="lg:col-span-4 flex items-center justify-center z-10 order-last lg:order-none">
            <ArtixScene />
          </div>

          {/* Right Column: Floating Problem Submission Card (Span 4 cols) */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end z-20">
            <FloatingProblemCard onProblemSubmitted={onProblemSubmitted} />
          </div>

        </div>
      </div>
    </section>
  );
}
