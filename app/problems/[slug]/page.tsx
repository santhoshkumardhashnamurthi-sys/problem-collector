import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { repository } from '@/lib/db/repository';
import {
  ArrowLeft,
  Sparkles,
  Layers,
  AlertCircle,
  ThumbsUp,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProblemDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { problem, cluster, similar } = await repository.getProblemBySlugOrCode(slug);

  if (!problem) {
    notFound();
  }

  const signalScore = problem.signal_score || cluster?.signal_score || 80;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Back Link */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-[#101114] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Problem Explorer
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header Block */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-md">
                  {problem.problem_code}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-[#C8FF4D]/30 px-3 py-1 rounded-full">
                  {problem.category_name || 'General'}
                </span>
              </div>

              {/* Title / Normalized Problem */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101114] leading-tight">
                {problem.normalized_problem || problem.raw_description}
              </h1>

              {/* Raw verbatim description quote */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                  Verbatim User Submission
                </span>
                <p className="text-xs sm:text-sm text-neutral-700 italic leading-relaxed">
                  &ldquo;{problem.raw_description}&rdquo;
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-100 text-xs">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Affected Group</span>
                  <span className="font-bold text-neutral-800">{problem.user_type}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Frequency</span>
                  <span className="font-bold text-neutral-800">{problem.frequency}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Severity</span>
                  <span className="font-bold text-neutral-800">{problem.severity || 'Moderate'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Reported Location</span>
                  <span className="font-bold text-neutral-800">{problem.city || 'Undisclosed'}</span>
                </div>
              </div>
            </div>

            {/* Opportunity Cluster Card */}
            {cluster && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Associated Opportunity Cluster</span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#101114]">
                  {cluster.name}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {cluster.description}
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div className="text-base font-extrabold text-[#101114]">{cluster.report_count}</div>
                    <div className="text-[10px] text-neutral-500">Total Reports</div>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div className="text-base font-extrabold text-[#101114]">{cluster.unique_contributors}</div>
                    <div className="text-[10px] text-neutral-500">Contributors</div>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <div className="text-base font-extrabold text-emerald-700">+{cluster.growth_rate}%</div>
                    <div className="text-[10px] text-neutral-500">Monthly Growth</div>
                  </div>
                </div>
              </div>
            )}

            {/* Similar Problems */}
            {similar.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
                  Similar Problems in this Cluster
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {similar.map(sim => (
                    <Link
                      key={sim.id}
                      href={`/problems/${sim.problem_code}`}
                      className="p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow block space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-neutral-500">{sim.problem_code}</span>
                        <span className="text-neutral-500">{sim.city || 'Remote'}</span>
                      </div>
                      <p className="text-xs font-bold text-neutral-900 line-clamp-2">
                        {sim.normalized_problem || sim.raw_description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar: Opportunity Signal & Community Actions (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Opportunity Signal Score Card */}
            <div className="bg-[#101114] text-white rounded-3xl p-6 border border-neutral-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                  Opportunity Signal
                </span>
                <Sparkles className="w-4 h-4 text-[#C8FF4D]" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#C8FF4D] font-mono">
                  {signalScore}
                </span>
                <span className="text-neutral-500 text-lg font-mono">/100</span>
              </div>

              <div className="inline-block px-3 py-1 rounded-full bg-[#C8FF4D]/20 text-[#C8FF4D] text-xs font-bold">
                {signalScore >= 85 ? 'High Intensity Signal' : 'Strong Signal'}
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                This score indicates an authentic pattern in collected data across independent contributors and frequencies.
              </p>

              {/* Mandatory Disclaimer */}
              <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Important Notice:</strong> Opportunity signals are based on collected data and do not guarantee business success.
                </span>
              </div>
            </div>

            {/* Community Support & Share Action */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/90 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-[#101114]">
                Do you experience this problem too?
              </h4>
              <p className="text-xs text-neutral-600">
                Endorse this friction to help strengthen its opportunity signal.
              </p>
              
              <button className="w-full py-2.5 rounded-full bg-[#C8FF4D] hover:bg-[#bbf03f] text-[#101114] text-xs font-bold transition-colors flex items-center justify-center gap-2">
                <ThumbsUp className="w-3.5 h-3.5" />
                I Experience This Too ({problem.supports_count || 1})
              </button>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
