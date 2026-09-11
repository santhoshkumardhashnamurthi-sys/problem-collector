'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Code2,
  Briefcase,
  Heart,
  Bus,
  Home,
  MoreHorizontal,
  CircleDollarSign,
  Utensils,
  Leaf,
  Building2,
  ArrowRight,
  Database,
  Sparkles,
} from 'lucide-react';
import { ProblemCategory, DatabaseStats } from '@/lib/db/schema';

// Icon mapping helper with specific styling matching reference image
function getCategoryIcon(name: string) {
  switch (name.toLowerCase()) {
    case 'education':
      return {
        icon: <GraduationCap className="w-4 h-4 text-emerald-700" />,
        bg: 'bg-emerald-100/90',
      };
    case 'technology':
      return {
        icon: <Code2 className="w-4 h-4 text-amber-700" />,
        bg: 'bg-amber-100/90',
      };
    case 'business':
      return {
        icon: <Briefcase className="w-4 h-4 text-purple-700" />,
        bg: 'bg-purple-100/90',
      };
    case 'healthcare':
      return {
        icon: <Heart className="w-4 h-4 text-rose-600" />,
        bg: 'bg-rose-100/90',
      };
    case 'transport':
      return {
        icon: <Bus className="w-4 h-4 text-sky-700" />,
        bg: 'bg-sky-100/90',
      };
    case 'daily life':
      return {
        icon: <Home className="w-4 h-4 text-amber-700" />,
        bg: 'bg-amber-100/90',
      };
    case 'finance':
      return {
        icon: <CircleDollarSign className="w-4 h-4 text-teal-700" />,
        bg: 'bg-teal-100/90',
      };
    case 'food':
      return {
        icon: <Utensils className="w-4 h-4 text-orange-600" />,
        bg: 'bg-orange-100/90',
      };
    case 'environment':
      return {
        icon: <Leaf className="w-4 h-4 text-lime-700" />,
        bg: 'bg-lime-100/90',
      };
    case 'government':
      return {
        icon: <Building2 className="w-4 h-4 text-blue-700" />,
        bg: 'bg-blue-100/90',
      };
    default:
      return {
        icon: <MoreHorizontal className="w-4 h-4 text-neutral-600" />,
        bg: 'bg-neutral-200/90',
      };
  }
}

interface CategoriesSectionProps {
  categories: ProblemCategory[];
  stats: DatabaseStats | null;
}

export function CategoriesSection({ categories, stats }: CategoriesSectionProps) {
  const totalCount = stats?.totalProblems ?? 0;

  // Filter the primary 7 visible categories matching reference layout
  const primaryCategories = categories.filter(c =>
    ['Education', 'Technology', 'Business', 'Healthcare', 'Transport', 'Daily Life', 'Other'].includes(c.name)
  );

  return (
    <section className="w-full bg-[#F7F4EA] py-12 lg:py-16 border-t border-neutral-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Title on Left, Dynamic Live Counter on Right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-1 bg-[#C8FF4D] rounded-full" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#101114] tracking-tight">
              Problems We&apos;re Collecting
            </h2>
          </div>

          {/* Dynamic Database Statistics Counter */}
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3.5 py-1.5 rounded-full border border-neutral-200/90 shadow-sm">
            <Database className="w-4 h-4 text-neutral-700" />
            <span className="text-xs font-semibold text-neutral-900">
              {totalCount.toLocaleString()} Problems Collected
            </span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        </div>

        {/* Two-Column Grid: Left is Categories Grid (8 cols), Right is Database Info Card (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Categories Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {primaryCategories.map(cat => {
              const style = getCategoryIcon(cat.name);
              const count = cat.count || stats?.categoryCounts?.[cat.name] || 0;

              return (
                <Link
                  key={cat.id}
                  href={`/problems/category/${cat.slug}`}
                  className="group bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-[0_2px_8px_rgba(16,17,20,0.04)] hover:shadow-md hover:border-neutral-300 transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                      {style.icon}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#101114] group-hover:text-emerald-700 transition-colors">
                        {cat.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 font-medium">
                        {count} {count === 1 ? 'problem' : 'problems'}
                      </p>
                    </div>
                  </div>

                  <div className="w-6 h-6 rounded-full bg-neutral-50 group-hover:bg-[#C8FF4D] flex items-center justify-center text-neutral-400 group-hover:text-[#101114] transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right Highlighted Database Card */}
          <div className="lg:col-span-4 flex">
            <div className="w-full bg-[#eef7db]/80 rounded-3xl p-6 border border-[#C8FF4D]/60 shadow-[0_4px_20px_-4px_rgba(200,255,77,0.3)] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8FF4D]/25 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/90 border border-[#C8FF4D] flex items-center justify-center shadow-sm">
                  <Database className="w-5 h-5 text-emerald-800" />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#101114] leading-snug">
                  From Real Problems <br />
                  <span className="text-emerald-800">to a Smarter Database</span>
                </h3>

                <p className="text-xs text-neutral-700 leading-relaxed">
                  Every submission is stored in a structured database, categorized for deeper insights, better analysis, and bigger opportunities.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-emerald-200/50 mt-4 relative z-10">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Realtime PostgreSQL + AI</span>
                </div>

                <Link
                  href="/explore"
                  className="text-xs font-bold text-[#101114] hover:text-emerald-800 flex items-center gap-1 transition-colors"
                >
                  Explore DB <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* View all categories link */}
        <div className="mt-6 text-center">
          <Link
            href="/categories"
            className="text-xs font-semibold text-neutral-600 hover:text-[#101114] inline-flex items-center gap-1 transition-colors"
          >
            View all 11 problem categories & trends →
          </Link>
        </div>

      </div>
    </section>
  );
}
