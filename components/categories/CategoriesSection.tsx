'use client';

import React from 'react';
import {
  GraduationCap,
  Code2,
  Briefcase,
  Heart,
  Bus,
  Home,
  MoreHorizontal,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface CategoryItem {
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}

const CATEGORIES_DATA: CategoryItem[] = [
  {
    name: 'Education',
    description: 'Learning bottlenecks, academic friction, resources access, and student workflows.',
    icon: <GraduationCap className="w-4 h-4 text-emerald-700" />,
    iconBg: 'bg-emerald-100',
  },
  {
    name: 'Technology',
    description: 'Software usability issues, integration gaps, digital barriers, and technical friction.',
    icon: <Code2 className="w-4 h-4 text-amber-700" />,
    iconBg: 'bg-amber-100',
  },
  {
    name: 'Business',
    description: 'Operational roadblocks, small business challenges, commerce, and workplace inefficiencies.',
    icon: <Briefcase className="w-4 h-4 text-purple-700" />,
    iconBg: 'bg-purple-100',
  },
  {
    name: 'Healthcare',
    description: 'Patient experiences, wellness tracking, clinical navigation, and care accessibility.',
    icon: <Heart className="w-4 h-4 text-rose-600" />,
    iconBg: 'bg-rose-100',
  },
  {
    name: 'Transport',
    description: 'Commuting difficulties, logistics snags, urban mobility, and transit delays.',
    icon: <Bus className="w-4 h-4 text-sky-700" />,
    iconBg: 'bg-sky-100',
  },
  {
    name: 'Daily Life',
    description: 'Everyday household chores, personal productivity, communication, and routine hassles.',
    icon: <Home className="w-4 h-4 text-orange-700" />,
    iconBg: 'bg-orange-100',
  },
  {
    name: 'Other',
    description: 'Uncategorized challenges, niche struggles, environmental, or community needs.',
    icon: <MoreHorizontal className="w-4 h-4 text-neutral-600" />,
    iconBg: 'bg-neutral-100',
  },
];

export function CategoriesSection() {
  const scrollToForm = () => {
    const el = document.getElementById('submit-problem');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="categories" className="w-full bg-[#F7F4E8] py-14 sm:py-20 border-t border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-6 h-0.5 bg-[#C8FF3D]" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Problems Worth Solving
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#08131A] tracking-tight">
            Real Problems. Better Ideas.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
            Every everyday frustration, delay, or unsolved complexity offers valuable insight into what people genuinely need.
          </p>
        </div>

        {/* Categories Grid + Highlight Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {CATEGORIES_DATA.map((cat) => (
            <div
              key={cat.name}
              className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-sm transition-all duration-200 hover:shadow-md hover:border-neutral-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl ${cat.iconBg} flex items-center justify-center shrink-0`}>
                    {cat.icon}
                  </div>
                  <h3 className="text-sm font-bold text-[#08131A]">
                    {cat.name}
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 hover:text-[#08131A] transition-colors cursor-pointer"
                >
                  <span>Share an issue in {cat.name}</span>
                  <ArrowRight className="w-3 h-3 text-[#96cc14]" />
                </button>
              </div>
            </div>
          ))}

          {/* Featured Highlighted Card: "From Real Problems to Better Ideas" */}
          <div className="bg-[#08131A] text-white rounded-2xl p-6 border border-neutral-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient subtle lime glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8FF3D]/15 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="w-10 h-10 rounded-xl bg-[#C8FF3D]/20 border border-[#C8FF3D]/40 flex items-center justify-center mb-4 text-[#C8FF3D]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 leading-snug">
                From Real Problems to Better Ideas
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Every problem shared helps us understand what people actually need and discover opportunities to build useful solutions.
              </p>
            </div>

            <div className="pt-5 mt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={scrollToForm}
                className="w-full py-2.5 rounded-full bg-[#C8FF3D] hover:bg-[#DFFF73] text-[#08131A] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Share a Problem</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
