import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { repository } from '@/lib/db/repository';
import { ArrowLeft, Sparkles, MapPin, Inbox } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function CategoryProblemsPage({ params }: PageProps) {
  const { slug } = await params;
  const { category, problems, stats } = await repository.getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Back Link */}
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-[#101114] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Categories
        </Link>

        {/* Category Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-800 bg-[#C8FF4D]/30 px-3 py-1 rounded-full inline-block">
                Category Focus
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101114]">
                {category.name} Problems
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl">
                {category.description}
              </p>
            </div>

            <div className="flex gap-3 text-center self-start sm:self-auto">
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 min-w-24">
                <div className="text-2xl font-extrabold text-[#101114]">{stats.total}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Reports</div>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 min-w-24">
                <div className="text-xs font-extrabold text-[#101114] truncate max-w-28">{stats.topGroup}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Primary Group</div>
              </div>
            </div>
          </div>
        </div>

        {/* Problem Stream for this category */}
        {problems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/90 shadow-sm max-w-md mx-auto space-y-3">
            <Inbox className="w-8 h-8 text-neutral-400 mx-auto" />
            <h3 className="text-base font-bold text-neutral-800">
              No problems logged in {category.name} yet.
            </h3>
            <p className="text-xs text-neutral-500">
              Be the first to submit a problem in this category.
            </p>
            <Link
              href="/#submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#C8FF4D] text-[#101114] text-xs font-bold hover:bg-[#bbf03f] transition-all"
            >
              Share a Problem →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {problems.map(problem => (
              <Link
                key={problem.id}
                href={`/problems/${problem.problem_code}`}
                className="group bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                      {problem.problem_code}
                    </span>
                    <span className="text-[11px] font-bold text-neutral-600">
                      {problem.frequency}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#101114] group-hover:text-emerald-800 transition-colors line-clamp-2">
                    {problem.normalized_problem || problem.raw_description}
                  </h3>

                  <p className="text-xs text-neutral-500 italic line-clamp-2">
                    &ldquo;{problem.raw_description}&rdquo;
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{problem.city || 'Undisclosed'}</span>
                  </div>

                  <div className="flex items-center gap-1 font-mono font-bold text-neutral-800">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Signal: {problem.signal_score || 75}/100</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
