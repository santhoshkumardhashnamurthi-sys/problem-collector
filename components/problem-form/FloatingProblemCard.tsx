'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lightbulb, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
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

export function FloatingProblemCard({ onProblemSubmitted }: FloatingProblemCardProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
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
      category: undefined,
      user_type: undefined,
      frequency: undefined,
      location: '',
    },
  });

  const onSubmit = async (data: ProblemSubmissionFormData) => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        description: data.raw_description,
        category: data.category,
        whoFacesThis: data.user_type,
        frequency: data.frequency,
        location: data.location || null,
      };

      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await response.json();

      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Failed to submit problem');
      }

      // Celebratory feedback
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#C8FF3D', '#08131A', '#DFFF73'],
        });
      } catch {
        // Fallback if canvas is not available
      }

      if (!res.problemCode) {
        throw new Error('Server did not return a valid Problem ID.');
      }

      setSubmittedCode(res.problemCode);
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
      id="submit-problem"
      className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_45px_-10px_rgba(8,19,26,0.12)] border border-neutral-200/90 relative z-30 transition-all hover:shadow-[0_16px_50px_-10px_rgba(8,19,26,0.16)]"
    >
      {/* Header with circular lightbulb icon */}
      <div className="flex items-start gap-3.5 mb-5">
        <div className="w-10 h-10 rounded-full bg-[#C8FF3D]/30 border border-[#C8FF3D]/50 flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5 text-[#08131A]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#08131A] leading-snug">
            Submit a Problem
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Share a problem. Help build a better tomorrow.
          </p>
        </div>
      </div>

      {submittedCode ? (
        /* Clean Confirmation State */
        <div className="py-4 space-y-5 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-[#C8FF3D]/15 border border-[#C8FF3D]/60 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#08131A]">
                Problem Submitted Successfully!
              </p>
              <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                Thank you for helping us understand real-world problems.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Problem ID:</span>
            <span className="text-xs font-mono font-extrabold text-[#08131A] px-2.5 py-1 bg-white border border-neutral-300 rounded-lg">
              {submittedCode}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSubmittedCode(null)}
            className="w-full py-2.5 rounded-full bg-[#08131A] hover:bg-neutral-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Submit Another Problem</span>
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
              } placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#C8FF3D] focus:ring-2 focus:ring-[#C8FF3D]/20 transition-all resize-none`}
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
              defaultValue=""
              className={`w-full px-3 py-2 text-xs text-neutral-800 bg-neutral-50/80 rounded-xl border ${
                errors.category ? 'border-rose-400' : 'border-neutral-200'
              } focus:bg-white focus:outline-none focus:border-[#C8FF3D] focus:ring-2 focus:ring-[#C8FF3D]/20 transition-all`}
            >
              <option value="" disabled>Select category...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-[10px] text-rose-600 mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* 3. Who Faces This Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Who Faces This?
            </label>
            <select
              {...register('user_type')}
              defaultValue=""
              className={`w-full px-3 py-2 text-xs text-neutral-800 bg-neutral-50/80 rounded-xl border ${
                errors.user_type ? 'border-rose-400' : 'border-neutral-200'
              } focus:bg-white focus:outline-none focus:border-[#C8FF3D] focus:ring-2 focus:ring-[#C8FF3D]/20 transition-all`}
            >
              <option value="" disabled>Select affected group...</option>
              {WHO_FACES_THIS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {errors.user_type && (
              <p className="text-[10px] text-rose-600 mt-1">{errors.user_type.message}</p>
            )}
          </div>

          {/* 4. How Often Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              How Often?
            </label>
            <select
              {...register('frequency')}
              defaultValue=""
              className={`w-full px-3 py-2 text-xs text-neutral-800 bg-neutral-50/80 rounded-xl border ${
                errors.frequency ? 'border-rose-400' : 'border-neutral-200'
              } focus:bg-white focus:outline-none focus:border-[#C8FF3D] focus:ring-2 focus:ring-[#C8FF3D]/20 transition-all`}
            >
              <option value="" disabled>Select frequency...</option>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            {errors.frequency && (
              <p className="text-[10px] text-rose-600 mt-1">{errors.frequency.message}</p>
            )}
          </div>

          {/* 5. Location (Optional) */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Location <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              {...register('location')}
              placeholder="Enter your location"
              maxLength={100}
              className={`w-full px-3 py-2 text-xs text-neutral-800 bg-neutral-50/80 rounded-xl border ${
                errors.location ? 'border-rose-400' : 'border-neutral-200'
              } placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#C8FF3D] focus:ring-2 focus:ring-[#C8FF3D]/20 transition-all`}
            />
            {errors.location && (
              <p className="text-[10px] text-rose-600 mt-1">{errors.location.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-xl bg-[#08131A] hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 group shadow-sm active:scale-[0.99]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8FF3D]" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Problem</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C8FF3D] transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
