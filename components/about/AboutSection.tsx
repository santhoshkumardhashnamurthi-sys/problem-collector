'use client';

import React from 'react';

export function AboutSection() {
  return (
    <section id="about" className="w-full bg-[#F7F4E8] py-16 sm:py-24 border-t border-neutral-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2">
          <span className="w-6 h-0.5 bg-[#C8FF3D]" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            About The Mission
          </span>
          <span className="w-6 h-0.5 bg-[#C8FF3D]" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#08131A] tracking-tight">
          Why ARTIX?
        </h2>

        <div className="space-y-4 max-w-2xl mx-auto pt-2">
          <p className="text-base sm:text-lg font-semibold text-neutral-800 leading-relaxed">
            Most products start with an idea. <br />
            <span className="text-[#08131A] font-extrabold">ARTIX starts with a problem.</span>
          </p>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            We collect real-world problems from real people so recurring needs can be understood and meaningful solutions can be discovered.
          </p>
        </div>
      </div>
    </section>
  );
}
