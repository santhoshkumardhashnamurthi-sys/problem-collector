import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import { MessageSquare, Database, Cpu, Compass, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Tell Us',
      subtitle: 'Share a real problem you experience.',
      description:
        'Submit the exact friction you experience in daily life, work, education, healthcare, transit, or business. No need to invent solutions or business plans — just describe the friction truthfully.',
      icon: <MessageSquare className="w-6 h-6 text-[#101114]" />,
      accent: 'bg-[#C8FF4D]',
      details: [
        'Open to anyone, anonymously or with an account',
        'Specify who faces the problem and frequency',
        'Optional city / locality to capture geographic trends',
      ],
    },
    {
      number: '02',
      title: 'We Collect',
      subtitle: 'ARTIX securely stores the problem.',
      description:
        'Every single authentic submission is validated, assigned an immutable unique reference code (e.g., ARTIX-2026-0001), and securely saved into a resilient PostgreSQL database.',
      icon: <Database className="w-6 h-6 text-white" />,
      accent: 'bg-[#101114]',
      details: [
        'Raw user words preserved verbatim',
        'Strict privacy protection: no sensitive data exposed',
        'Real-time streaming to the live problem river',
      ],
    },
    {
      number: '03',
      title: 'We Organize',
      subtitle: 'AI categorizes and groups similar problems.',
      description:
        'Our neural AI model processes the submission to normalize language, extract core keywords, and compute semantic embeddings. Submissions sharing root friction are automatically clustered.',
      icon: <Cpu className="w-6 h-6 text-[#101114]" />,
      accent: 'bg-[#C8FF4D]',
      details: [
        'Multi-dimensional taxonomy classification',
        'Semantic similarity matching & cluster linking',
        'Zero duplicate deletion: every voice strengthens the signal',
      ],
    },
    {
      number: '04',
      title: 'We Discover',
      subtitle: 'Patterns reveal important problem areas and opportunity signals.',
      description:
        'When many independent people report the same pain across locations, ARTIX synthesizes an Opportunity Signal (0–100) indicating where high-impact products and policies should focus.',
      icon: <Compass className="w-6 h-6 text-white" />,
      accent: 'bg-[#101114]',
      details: [
        'Calculated from volume, diversity, growth, and severity',
        'Interactive 3D Problem Landscape mapping',
        'Transparent signals to discover what should be built next',
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* Header */}
        <div className="max-w-2xl space-y-3 mb-16">
          <div className="inline-flex items-center gap-2">
            <span className="w-5 h-0.5 bg-[#C8FF4D]" />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              The Four-Step Engine
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#101114]">
            How ARTIX Works
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed pt-1">
            From an authentic frustration in someone&apos;s day to a structured, high-signal opportunity cluster. Here is the lifecycle of every problem submitted to ARTIX.
          </p>
        </div>

        {/* Animated Timeline Container */}
        <div className="relative border-l-2 border-neutral-300 ml-4 sm:ml-8 space-y-14 pl-6 sm:pl-10">
          {steps.map(step => (
            <div key={step.number} className="relative group">
              {/* Step indicator node on timeline */}
              <div className="absolute -left-[35px] sm:-left-[51px] top-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center font-mono text-xs sm:text-sm font-bold text-neutral-800 shadow-sm group-hover:border-[#C8FF4D] group-hover:bg-[#C8FF4D] transition-colors">
                {step.number}
              </div>

              {/* Step Content Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${step.accent} flex items-center justify-center shadow-sm`}>
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#101114]">
                        {step.title}
                      </h3>
                      <p className="text-xs text-neutral-500 font-medium">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-5">
                  {step.description}
                </p>

                {/* Micro checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-neutral-100">
                  {step.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-neutral-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="mt-16 p-8 rounded-3xl bg-[#101114] text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold">Ready to contribute your real-world problem?</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Take 30 seconds to help surface what should be built next.
            </p>
          </div>
          <Link
            href="/#submit"
            className="px-6 py-3 rounded-full bg-[#C8FF4D] text-[#101114] text-xs font-bold hover:bg-[#bbf03f] transition-colors flex items-center gap-1.5"
          >
            Share a Problem <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
