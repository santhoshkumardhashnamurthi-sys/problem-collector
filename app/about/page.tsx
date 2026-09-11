import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { repository } from '@/lib/db/repository';
import { Database, Users, MapPin, Layers, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const stats = await repository.getDatabaseStats();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2">
            <span className="w-5 h-0.5 bg-[#C8FF4D]" />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              The ARTIX Manifesto
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#101114]">
            Why ARTIX Exists
          </h1>

          <p className="text-lg sm:text-xl font-medium text-neutral-800 pt-2 leading-relaxed">
            Most products start with an idea. <br />
            <span className="text-emerald-800 font-bold">
              ARTIX starts somewhere different — with real problems experienced by real people.
            </span>
          </p>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            We collect and organize those problems so patterns can become visible. By shifting focus from subjective intuition to authentic human friction, builders, researchers, and innovators can discover what truly deserves to be created.
          </p>
        </div>

        {/* Live Dynamic Database Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 mb-16">
          <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
              <Database className="w-4 h-4 text-emerald-800" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#101114]">
              {stats.totalProblems.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Problems Collected</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4 text-amber-800" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#101114]">
              {stats.categoriesCount}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Categories Mapped</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center mb-3">
              <MapPin className="w-4 h-4 text-sky-800" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#101114]">
              {stats.locationsCovered}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Locations Covered</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-purple-800" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#101114]">
              {stats.uniqueContributors.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">Unique Contributors</div>
          </div>
        </div>

        {/* Philosophy & Purpose Block */}
        <div className="space-y-8 text-neutral-700 leading-relaxed text-sm sm:text-base border-t border-neutral-200 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#C8FF4D]/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-neutral-900" />
              </div>
              <h3 className="text-base font-bold text-[#101114]">
                What ARTIX Is
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600">
                A neutral, open, real-world intelligence engine. It structures chaotic human feedback into validated opportunity clusters with measurable signals: frequency, severity, contributor spread, and growth rates.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-neutral-900" />
              </div>
              <h3 className="text-base font-bold text-[#101114]">
                What ARTIX Is Not
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600">
                ARTIX is not a complaint resolution platform, customer service queue, or repair ticketing system. It does not dispatch technicians. Its sole purpose is: <strong>COLLECT → ORGANIZE → ANALYZE → DISCOVER</strong>.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-[#101114] text-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-lg font-bold">Have a real problem to share?</h4>
              <p className="text-xs text-neutral-400">
                Every problem is an opportunity for what gets built next.
              </p>
            </div>
            <Link
              href="/#submit"
              className="inline-flex items-center gap-2 bg-[#C8FF4D] text-[#101114] text-xs font-bold px-6 py-3 rounded-full hover:bg-[#bbf03f] transition-all"
            >
              Share a Problem <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
