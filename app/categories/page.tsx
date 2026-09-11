import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { repository } from '@/lib/db/repository';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await repository.getCategories();
  const stats = await repository.getDatabaseStats();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-18 w-full">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-5 h-0.5 bg-[#C8FF4D]" />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Taxonomy Explorer
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101114] tracking-tight">
            Problem Categories
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Browse collected real-world frictions across {categories.length} structured domains.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(cat => {
            const count = cat.count || stats.categoryCounts[cat.name] || 0;
            return (
              <Link
                key={cat.id}
                href={`/problems/category/${cat.slug}`}
                className="group bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 bg-[#C8FF4D]/25 px-2.5 py-0.5 rounded-full">
                      {count} {count === 1 ? 'problem' : 'problems'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#101114] group-hover:translate-x-1 transition-all" />
                  </div>

                  <h3 className="text-base font-bold text-[#101114] pt-2">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                  <span>Explore category</span>
                  <span className="text-[#101114] font-semibold group-hover:underline">View →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
