'use client';

import React from 'react';
import { Brain, Target, Users, TrendingUp } from 'lucide-react';

export function WhyItMattersSection() {
  const pillars = [
    {
      title: 'Better Insights',
      description: 'Understand what people really need.',
      icon: <Brain className="w-5 h-5 text-[#C8FF4D]" />,
    },
    {
      title: 'Identify Opportunities',
      description: 'Find high-potential problem areas for the next big thing.',
      icon: <Target className="w-5 h-5 text-[#C8FF4D]" />,
    },
    {
      title: 'Build Solutions',
      description: 'Turn validated problems into meaningful products.',
      icon: <Users className="w-5 h-5 text-[#C8FF4D]" />,
    },
    {
      title: 'Create Impact',
      description: 'Solve real problems and make a difference.',
      icon: <TrendingUp className="w-5 h-5 text-[#C8FF4D]" />,
    },
  ];

  return (
    <section className="w-full bg-[#101114] text-white py-16 lg:py-20 relative overflow-hidden">
      {/* Subtle topographic contour background effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <path d="M0,100 C150,200 350,0 500,100 C650,200 900,50 1000,100 L1000,400 L0,400 Z" fill="none" stroke="#C8FF4D" strokeWidth="1" />
          <path d="M0,200 C200,300 400,100 600,200 C800,300 900,150 1000,200 L1000,400 L0,400 Z" fill="none" stroke="#C8FF4D" strokeWidth="1" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Heading (Span 5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-[#C8FF4D]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Why It Matters
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.12] tracking-tight">
              Real People. <br />
              Real Problems. <br />
              <span className="text-[#C8FF4D]">Real Impact.</span>
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 pt-2 leading-relaxed max-w-sm">
              Traditional innovation relies on guesswork. ARTIX grounds discovery in actual friction experienced by everyday individuals.
            </p>
          </div>

          {/* Right Columns: Four Pillars (Span 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="group p-3 sm:p-2 rounded-2xl transition-all duration-300 hover:bg-neutral-900/60"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 group-hover:border-[#C8FF4D]/50 transition-colors">
                  {pillar.icon}
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-[#C8FF4D] transition-colors">
                  {pillar.title}
                </h4>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
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
