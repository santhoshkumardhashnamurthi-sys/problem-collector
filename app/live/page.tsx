'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import {
  Radio,
  Send,
} from 'lucide-react';
import { Problem } from '@/lib/db/schema';

export default function LiveStreamPage() {
  const [liveProblems, setLiveProblems] = useState<Problem[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // 1. Fetch recent problems initially
    fetch('/api/problems?sort=most_recent')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLiveProblems(data.problems);
        }
      })
      .catch(console.error);

    // 2. Connect to Server-Sent Events stream for true realtime updates
    const eventSource = new EventSource('/api/realtime');

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'NEW_PROBLEM' && payload.problem) {
          setLiveProblems(prev => [payload.problem, ...prev]);
        }
      } catch {
        // Ignore ping or malformed
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                {connected ? 'Live Database Event Stream' : 'Connecting to Live Pipeline...'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101114] tracking-tight">
              Realtime Problem Stream
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Direct telemetry from real user submissions as they enter the ARTIX pipeline.
            </p>
          </div>

          <Link
            href="/#submit"
            className="self-start sm:self-auto px-5 py-2.5 rounded-full bg-[#101114] text-white text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-md"
          >
            <Send className="w-3.5 h-3.5 text-[#C8FF4D]" />
            Submit Live Problem
          </Link>
        </div>

        {/* Pipeline Architecture Visual Flow Banner */}
        <div className="bg-[#101114] text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-xl mb-10 relative overflow-hidden">
          <div className="text-xs font-mono uppercase text-[#C8FF4D] mb-4 tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4" />
            <span>ARTIX Autonomous Pipeline Architecture</span>
          </div>

          {/* 5-Step Horizontal Flow Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-10">
            <div className="p-3 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-center space-y-1">
              <div className="text-[10px] font-mono text-neutral-400">01. INGEST</div>
              <div className="text-xs font-bold text-white">USER PROBLEM</div>
              <div className="text-[10px] text-neutral-400">Raw Friction</div>
            </div>

            <div className="hidden sm:flex items-center justify-center text-[#C8FF4D]">
              →
            </div>

            <div className="p-3 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-center space-y-1">
              <div className="text-[10px] font-mono text-neutral-400">02. TELEMETRY</div>
              <div className="text-xs font-bold text-white">DATA NODE</div>
              <div className="text-[10px] text-neutral-400">Serial ID & Verbatim</div>
            </div>

            <div className="hidden sm:flex items-center justify-center text-[#C8FF4D]">
              →
            </div>

            <div className="p-3 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-center space-y-1">
              <div className="text-[10px] font-mono text-neutral-400">03. TAXONOMY</div>
              <div className="text-xs font-bold text-white">CATEGORY</div>
              <div className="text-[10px] text-neutral-400">Domain Mapping</div>
            </div>

            <div className="hidden sm:flex items-center justify-center text-[#C8FF4D]">
              →
            </div>

            <div className="p-3 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-center space-y-1">
              <div className="text-[10px] font-mono text-neutral-400">04. EMBEDDINGS</div>
              <div className="text-xs font-bold text-white">AI ANALYSIS</div>
              <div className="text-[10px] text-neutral-400">Semantic Extraction</div>
            </div>

            <div className="hidden sm:flex items-center justify-center text-[#C8FF4D]">
              →
            </div>

            <div className="p-3 bg-emerald-950/40 rounded-2xl border border-[#C8FF4D]/40 text-center space-y-1">
              <div className="text-[10px] font-mono text-[#C8FF4D]">05. DISCOVERY</div>
              <div className="text-xs font-bold text-white">PROBLEM CLUSTER</div>
              <div className="text-[10px] text-[#C8FF4D]">Opportunity Signal</div>
            </div>
          </div>
        </div>

        {/* Live Stream Streamed Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold px-2 mb-2">
            <span>Incoming Real Database Events ({liveProblems.length})</span>
            <span>Latency: ~50ms</span>
          </div>

          {liveProblems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-sm space-y-3">
              <p className="text-xs text-neutral-500">Waiting for live problem events...</p>
            </div>
          ) : (
            liveProblems.map(problem => (
              <div
                key={problem.id}
                className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                      {problem.problem_code}
                    </span>
                    <span className="font-semibold text-emerald-800 bg-[#C8FF4D]/30 px-2.5 py-0.5 rounded-full">
                      {problem.category_name || 'General'}
                    </span>
                    <span className="text-neutral-400">
                      {new Date(problem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#101114]">
                    {problem.normalized_problem || problem.raw_description}
                  </h3>

                  <p className="text-xs text-neutral-500 italic line-clamp-1">
                    &ldquo;{problem.raw_description}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs">
                  <div className="text-right">
                    <span className="text-neutral-500 block text-[10px]">Location</span>
                    <span className="font-semibold text-neutral-800">{problem.city || 'Remote'}</span>
                  </div>

                  <Link
                    href={`/problems/${problem.problem_code}`}
                    className="px-3.5 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    Inspect →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
