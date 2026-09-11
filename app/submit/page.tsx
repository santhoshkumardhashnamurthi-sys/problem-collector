import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { FloatingProblemCard } from '@/components/problem-form/FloatingProblemCard';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function SubmitPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-[#101114] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left instructions (Span 5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2">
                <span className="w-5 h-0.5 bg-[#C8FF4D]" />
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Direct Ingestion
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#101114] tracking-tight">
                Share a Real-World Problem
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                ARTIX collects, organizes, and analyzes authentic human friction to discover what should be built next.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Submission Guidelines
              </h3>
              <ul className="text-xs text-neutral-600 space-y-2 leading-relaxed list-disc list-inside">
                <li>Describe the problem clearly in your own everyday words.</li>
                <li>No need to brainstorm a solution or business idea.</li>
                <li>Specify who experiences this friction and how frequently.</li>
                <li>Optional location helps identify regional clusters.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-start gap-2.5 text-xs text-neutral-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Anonymous submissions are fully supported. No personal email or address is required.
              </span>
            </div>
          </div>

          {/* Right form (Span 7 cols) */}
          <div className="md:col-span-7 flex justify-center">
            <FloatingProblemCard />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
