import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { repository } from '@/lib/db/repository';
import { User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const problems = await repository.getProblems();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-full bg-[#101114] text-[#C8FF4D] flex items-center justify-center text-xl font-bold">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[#101114]">Researcher Profile</h1>
            <p className="text-xs text-neutral-500">
              Active Contributor &amp; Problem Observer
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <span className="text-[11px] font-semibold text-emerald-800 bg-[#C8FF4D]/30 px-2.5 py-0.5 rounded-full">
                Anonymous Submissions Enabled
              </span>
              <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                Storage Ready
              </span>
            </div>
          </div>
        </div>

        {/* Submissions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#101114]">Recent Submissions in Community</h3>
            <Link href="/#submit" className="text-xs font-bold text-emerald-800 hover:underline">
              Submit Another Problem →
            </Link>
          </div>

          <div className="space-y-3">
            {problems.slice(0, 3).map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                      {p.problem_code}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      {p.category_name}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#101114]">
                    {p.normalized_problem || p.raw_description}
                  </h4>
                </div>

                <Link
                  href={`/problems/${p.problem_code}`}
                  className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-[#C8FF4D] text-xs font-semibold transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
