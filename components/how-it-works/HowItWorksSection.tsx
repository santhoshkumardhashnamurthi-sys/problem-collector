'use client';

import React from 'react';
import { Send, Eye, Lightbulb, ArrowRight } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Share a Problem',
      description: 'Tell us about a real problem you face.',
      icon: <Send className="w-5 h-5 text-[#08131A]" />,
      accent: 'bg-[#C8FF3D]',
    },
    {
      num: '02',
      title: 'We Understand',
      description: 'Your submission helps us understand real-world needs.',
      icon: <Eye className="w-5 h-5 text-white" />,
      accent: 'bg-[#08131A]',
    },
    {
      num: '03',
      title: 'Discover Opportunities',
      description: 'Recurring problems can reveal opportunities for useful products and services.',
      icon: <Lightbulb className="w-5 h-5 text-[#08131A]" />,
      accent: 'bg-[#DFFF73]',
    },
  ];

  const scrollToForm = () => {
    const el = document.getElementById('submit-problem');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="how-it-works" className="w-full bg-[#F7F4E8] py-16 sm:py-24 border-t border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-6 h-0.5 bg-[#C8FF3D]" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              The Simple Process
            </span>
            <span className="w-6 h-0.5 bg-[#C8FF3D]" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#08131A] tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-2">
            A simple, one-way submission flow built for real people with authentic problems.
          </p>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-white rounded-3xl p-7 border border-neutral-200/90 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${step.accent} flex items-center justify-center shadow-sm`}>
                    {step.icon}
                  </div>
                  <span className="text-3xl font-extrabold font-mono text-neutral-200 group-hover:text-neutral-300 transition-colors">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#08131A] mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-neutral-500">
                <span>Step {step.num}</span>
                <span className="text-neutral-400">→</span>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action at bottom of How It Works */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#08131A] hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>Ready to Share a Problem?</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C8FF3D]" />
          </button>
        </div>

      </div>
    </section>
  );
}
