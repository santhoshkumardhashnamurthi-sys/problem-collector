import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { repository } from '@/lib/db/repository';
import { Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const clusters = await repository.getClusters();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-5 h-0.5 bg-[#C8FF4D]" />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Pattern Recognition Engine
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#101114] tracking-tight">
            Top Problems Right Now
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
            Real-world problems ranked strictly by authentic reports, cross-contributor consensus, geographic dispersion, and growth momentum.
          </p>
        </div>

        {/* Transparent Signal Formula Explainer Banner */}
        <div className="bg-[#101114] text-white rounded-3xl p-6 sm:p-7 border border-neutral-800 shadow-md mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#C8FF4D]">
              <Sparkles className="w-4 h-4" />
              <span>How ARTIX Calculates Opportunity Signal (0–100)</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Our signal score combines report volume, contributor diversity, monthly trajectory, geographic spread, and severity intensity.
            </p>
          </div>

          <div className="text-[11px] text-neutral-400 bg-neutral-900 px-4 py-2 rounded-2xl border border-neutral-800 max-w-xs shrink-0 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Disclaimer:</strong> Opportunity signals reflect collected data patterns and do not guarantee business success.
            </span>
          </div>
        </div>

        {/* Top Problems Ranked List */}
        <div className="space-y-4">
          {clusters.map((cluster, index) => {
            const rank = index + 1;
            const signalLabel =
              cluster.signal_score >= 85 ? 'High Intensity Signal' : cluster.signal_score >= 70 ? 'Strong Signal' : 'Moderate Signal';

            return (
              <div
                key={cluster.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-neutral-200/90 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Rank & Title */}
                <div className="flex items-start gap-4 max-w-2xl">
                  <div className="w-9 h-9 rounded-2xl bg-[#101114] text-[#C8FF4D] flex items-center justify-center font-mono font-extrabold text-sm shrink-0">
                    #{rank}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-[#C8FF4D]/30 px-2.5 py-0.5 rounded-full">
                        {cluster.category_name || 'General'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#101114]">
                      {cluster.name}
                    </h3>

                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {cluster.description}
                    </p>
                  </div>
                </div>

                {/* Right: Metrics Grid + Signal Score */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-neutral-100 shrink-0">
                  {/* Stats columns */}
                  <div className="grid grid-cols-3 gap-3 text-center min-w-44">
                    <div>
                      <div className="text-sm font-extrabold text-[#101114]">{cluster.report_count.toLocaleString()}</div>
                      <div className="text-[10px] text-neutral-500">Reports</div>
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-[#101114]">{cluster.unique_contributors.toLocaleString()}</div>
                      <div className="text-[10px] text-neutral-500">People</div>
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-emerald-700">+{cluster.growth_rate}%</div>
                      <div className="text-[10px] text-neutral-500">Growth</div>
                    </div>
                  </div>

                  {/* Signal Badge */}
                  <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-center min-w-28">
                    <div className="text-xs text-neutral-500 font-semibold">Signal</div>
                    <div className="text-xl font-extrabold text-[#101114] font-mono">
                      {cluster.signal_score}
                      <span className="text-xs text-neutral-400 font-normal">/100</span>
                    </div>
                    <div className="text-[9px] font-bold text-emerald-800 uppercase tracking-tight">
                      {signalLabel}
                    </div>
                  </div>

                  {/* Explore Link */}
                  <Link
                    href={`/explore?category=${encodeURIComponent(cluster.category_name || '')}`}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-[#C8FF4D] text-neutral-600 hover:text-[#101114] flex items-center justify-center transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      <Footer />
    </div>
  );
}
