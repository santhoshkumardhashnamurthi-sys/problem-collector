'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lightbulb, MapPin, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  problemSubmissionSchema,
  ProblemSubmissionFormData,
  CATEGORIES,
  WHO_FACES_THIS,
  FREQUENCIES,
} from '@/lib/validation/problem';

interface FloatingProblemCardProps {
  onProblemSubmitted?: () => void;
}

function getOrCreateSubmitterId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'artix_submitter_id';
  try {
    let sid = localStorage.getItem(key);
    if (!sid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sid)) {
      sid = crypto.randomUUID();
      localStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return '';
  }
}

export function FloatingProblemCard({ onProblemSubmitted }: FloatingProblemCardProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    problemCode: string;
    normalized: string;
    category: string;
    clusterName?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProblemSubmissionFormData>({
    resolver: zodResolver(problemSubmissionSchema),
    defaultValues: {
      raw_description: '',
      category: '',
      user_type: '',
      frequency: '',
      location: '',
      is_anonymous: true,
    },
  });

  const onSubmit = async (data: ProblemSubmissionFormData) => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const submitterId = getOrCreateSubmitterId();
      const payload = {
        ...data,
        submitter_id: submitterId || undefined,
      };

      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await response.json();

      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Failed to submit problem to database');
      }

      // Trigger delightful success confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#C8FF4D', '#101114', '#FF9F43', '#00e5ff'],
        });
      } catch {
        // Fallback if canvas is unavailable
      }

      setSubmittedData({
        problemCode: res.problem.problem_code,
        normalized: res.problem.normalized_problem || data.raw_description,
        category: res.problem.category_name || data.category,
        clusterName: res.cluster?.name,
      });

      reset();
      if (onProblemSubmitted) onProblemSubmitted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="submit"
      className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_45px_-10px_rgba(16,17,20,0.12)] border border-neutral-200/90 relative z-30 transition-all hover:shadow-[0_16px_50px_-10px_rgba(16,17,20,0.16)]"
    >
      {/* Header with circular lightbulb icon */}
      <div className="flex items-start gap-3.5 mb-5">
        <div className="w-10 h-10 rounded-full bg-[#C8FF4D]/30 border border-[#C8FF4D]/50 flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5 text-[#101114]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#101114] leading-snug">
            Submit a Problem
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Share a problem. Help build a better tomorrow.
          </p>
        </div>
      </div>

      {submittedData ? (
        /* Success State */
        <div className="py-4 space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-[#C8FF4D]/15 border border-[#C8FF4D]/60 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-neutral-900">
                Problem collected successfully.
              </p>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                Your problem has been added to the ARTIX problem database.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-neutral-500 font-mono">Reference Code</span>
              <span className="font-bold text-[#101114] font-mono px-2 py-0.5 bg-neutral-200 rounded">
                {submittedData.problemCode}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-semibold">AI Normalized Problem</span>
              <p className="text-neutral-800 font-medium italic mt-0.5">
                &ldquo;{submittedData.normalized}&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-neutral-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Assigned to <strong>{submittedData.category}</strong> Opportunity Cluster</span>
            </div>
          </div>

          <button
            onClick={() => setSubmittedData(null)}
            className="w-full py-2.5 rounded-full bg-[#101114] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
          >
            Submit Another Problem
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Submission Form */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* 1. Problem Description */}
          <div>
            <textarea
              {...register('raw_description')}
              rows={3}
              placeholder="Describe the problem in detail..."
              className={`w-full px-3.5 py-2.5 text-xs text-neutral-900 bg-neutral-50/80 rounded-xl border ${
                errors.raw_description ? 'border-rose-400' : 'border-neutral-200'
              } placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#C8FF4D] focus:ring-2 focus:ring-[#C8FF4D]/20 transition-all resize-none`}
            />
            {errors.raw_description && (
              <p className="text-[10px] text-rose-600 mt-1">{errors.raw_description.message}</p>
            )}
          </div>

          {/* 2. Category Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Category
            </label>
            <select
              {...register('category')}
              className={`w-full px-3 py-2 text-xs text-neutral-800 bg-neutral-50/80 rounded-xl border ${
                errors.category ? 'border-rose-400' : 'border-neutral-200'
              } focus:bg-white focus:outline-none focus:border-[#C8FF4D] focus:ring-2 focus:ring-[#C8FF4D]/20 transition-all`}
            >
              <option value="">Select category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-[10px] text-rose-600 mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* 3 & 4. Who faces this? & How often? */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1 truncate">
                Who faces this?
              </label>
              <select
                {...register('user_type')}
                className={`w-full px-2.5 py-2 text-xs text-neutral-800 bg-neutral-50/80 rounded-xl border ${
                  errors.user_type ? 'border-rose-400' : 'border-neutral-200'
                } focus:bg-white focus:outline-none focus:border-[#C8FF4D] focus:ring-2 focus:ring-[#C8FF4D]/20 transition-all`}
              >
                <option value="">Select type</option>
                {WHO_FACES_THIS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              {errors.user_type && (
                <p className="text-[10px] text-rose-600 mt-1">{errors.user_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1 truncate">
                How often?
              </label>
              <select
                {...register('frequency')}
                className={`w-full px-2.5 py-2 text-xs text-neutral-800 bg-neutral-50/80 rounded-xl border ${
                  errors.frequency ? 'border-rose-400' : 'border-neutral-200'
                } focus:bg-white focus:outline-none focus:border-[#C8FF4D] focus:ring-2 focus:ring-[#C8FF4D]/20 transition-all`}
              >
                <option value="">Select frequency</option>
                {FREQUENCIES.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              {errors.frequency && (
                <p className="text-[10px] text-rose-600 mt-1">{errors.frequency.message}</p>
              )}
            </div>
          </div>

          {/* 5. Location (optional) */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Location <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                {...register('location')}
                placeholder="Enter your location"
                className="w-full pl-8 pr-3 py-2 text-xs text-neutral-800 bg-neutral-50/80 rounded-xl border border-neutral-200 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#C8FF4D] focus:ring-2 focus:ring-[#C8FF4D]/20 transition-all"
              />
            </div>
          </div>

          {/* Privacy statement */}
          <p className="text-[10px] text-neutral-400 text-center pt-1">
            Please avoid sharing personal or sensitive information.
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-[#101114] hover:bg-neutral-800 disabled:opacity-60 text-white text-xs font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C8FF4D]" />
                <span>Analyzing & Storing...</span>
              </>
            ) : (
              <>
                <span>Submit Problem</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C8FF4D]" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
