'use client';

import React from 'react';
import { Brain, Target, Wrench, Sparkles } from 'lucide-react';

export function WhyItMattersSection() {
  const pillars = [
    {
      title: 'Better Insights',
      description: 'Understand what people really need.',
      icon: <Brain className="w-5 h-5 text-[#C8FF3D]" />,
    },
    {
      title: 'Identify Opportunities',
      description: 'Find recurring problems worth solving.',
      icon: <Target className="w-5 h-5 text-[#C8FF3D]" />,
    },
    {
      title: 'Build Solutions',
      description: 'Turn real problems into useful products.',
      icon: <Wrench className="w-5 h-5 text-[#C8FF3D]" />,
    },
    {
      title: 'Create Impact',
      description: 'Solve meaningful problems.',
      icon: <Sparkles className="w-5 h-5 text-[#C8FF3D]" />,
    },
  ];

  return (
    <section id="why-it-matters" className="w-full bg-[#08131A] text-white py-16 lg:py-24 relative overflow-hidden">
      {/* Subtle topographic contour background effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <path d="M0,100 C150,200 350,0 500,100 C650,200 900,50 1000,100 L1000,400 L0,400 Z" fill="none" stroke="#C8FF3D" strokeWidth="1" />
          <path d="M0,200 C200,300 400,100 600,200 C800,300 900,150 1000,200 L1000,400 L0,400 Z" fill="none" stroke="#C8FF3D" strokeWidth="1" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Heading (Span 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-[#C8FF3D]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Why It Matters
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.15] tracking-tight">
              Real People. <br />
              Real Problems. <br />
              <span className="text-[#C8FF3D]">Real Impact.</span>
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 pt-1 leading-relaxed max-w-sm">
              Most solutions fail because they start with an assumption instead of real human friction. ARTIX is built to bridge that gap.
            </p>
          </div>

          {/* Right 4 Pillars Grid (Span 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-[#101820]/90 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-[#08131A] border border-neutral-800 flex items-center justify-center mb-3">
                  {pillar.icon}
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {pillar.title}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
