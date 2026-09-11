'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import {
  Search,
  Filter,
  MapPin,
  Sparkles,
  Inbox,
  Loader2,
} from 'lucide-react';
import { Problem, ProblemSortOption } from '@/lib/db/schema';
import { CATEGORIES, WHO_FACES_THIS, FREQUENCIES } from '@/lib/validation/problem';

export default function ExplorePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedFrequency, setSelectedFrequency] = useState('All');
  const [selectedSort, setSelectedSort] = useState<ProblemSortOption>('highest_signal');

  const fetchProblems = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedGroup !== 'All') params.set('user_type', selectedGroup);
      if (selectedFrequency !== 'All') params.set('frequency', selectedFrequency);
      params.set('sort', selectedSort);

      const res = await fetch(`/api/problems?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProblems(data.problems);
      }
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedGroup, selectedFrequency, selectedSort]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedGroup !== 'All') params.set('user_type', selectedGroup);
      if (selectedFrequency !== 'All') params.set('frequency', selectedFrequency);
      params.set('sort', selectedSort);

      const res = await fetch(`/api/problems?${params.toString()}`);
      const data = await res.json();
      if (!ignore && data.success) {
        setProblems(data.problems);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [selectedCategory, selectedGroup, selectedFrequency, selectedSort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProblems();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-5 h-0.5 bg-[#C8FF4D]" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Problem Intelligence Directory
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101114] tracking-tight">
              Explore Collected Problems
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl">
              Search real authentic friction points reported across industries, user groups, and geographies.
            </p>
          </div>

          <Link
            href="/#submit"
            className="self-start md:self-auto px-5 py-2.5 rounded-full bg-[#101114] text-white text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
          >
            Submit New Problem →
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-sm mb-8 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by keywords, problem description, location, or code (e.g. food, transit, ARTIX-2026-0001)..."
              className="w-full pl-11 pr-24 py-3 text-xs sm:text-sm bg-neutral-50 rounded-2xl border border-neutral-200 focus:bg-white focus:outline-none focus:border-[#C8FF4D] focus:ring-2 focus:ring-[#C8FF4D]/20 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 px-4 py-1.5 rounded-xl bg-[#101114] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-500 font-medium mr-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-[#C8FF4D]"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Group Select */}
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-[#C8FF4D]"
            >
              <option value="All">All User Types</option>
              {WHO_FACES_THIS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* Frequency Select */}
            <select
              value={selectedFrequency}
              onChange={e => setSelectedFrequency(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800 focus:outline-none focus:border-[#C8FF4D]"
            >
              <option value="All">All Frequencies</option>
              {FREQUENCIES.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            {/* Sort Filter */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-neutral-500 font-medium">Sort:</span>
              <select
                value={selectedSort}
                onChange={e => setSelectedSort(e.target.value as ProblemSortOption)}
                className="px-3 py-1.5 rounded-xl bg-[#101114] text-white border border-neutral-800 font-semibold focus:outline-none focus:border-[#C8FF4D]"
              >
                <option value="highest_signal">Highest Signal Score</option>
                <option value="most_recent">Most Recent</option>
                <option value="most_supported">Most Community Supports</option>
                <option value="fastest_growing">Fastest Growing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Stream / Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs text-neutral-500">Querying problem database...</p>
          </div>
        ) : problems.length === 0 ? (
          /* Empty State Requirement #31 */
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/90 shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-800">
              No problems collected yet.
            </h3>
            <p className="text-xs text-neutral-500">
              Be the first person to share a real-world problem.
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
                className="group bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-[0_2px_12px_rgba(16,17,20,0.03)] hover:shadow-lg hover:border-neutral-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top tags: Code, Category, Signal Score */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold text-neutral-500 px-2 py-0.5 bg-neutral-100 rounded-md">
                      {problem.problem_code}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-[#C8FF4D]/25 px-2.5 py-0.5 rounded-full">
                      {problem.category_name || 'General'}
                    </span>
                  </div>

                  {/* Normalized Statement & Raw User Description */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#101114] group-hover:text-emerald-800 transition-colors line-clamp-2">
                      {problem.normalized_problem || problem.raw_description}
                    </h3>
                    <p className="text-xs text-neutral-500 italic mt-1.5 line-clamp-2">
                      &ldquo;{problem.raw_description}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Card Meta Footer */}
                <div className="pt-4 mt-4 border-t border-neutral-100 space-y-2.5 text-xs text-neutral-500">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-700 font-medium">
                      Faces: <strong>{problem.user_type}</strong>
                    </span>
                    <span className="text-[11px] text-neutral-600">
                      Freq: <strong>{problem.frequency}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{problem.city || 'Undisclosed'}</span>
                    </div>

                    {/* Opportunity Signal Badge */}
                    <div className="flex items-center gap-1 font-mono font-bold text-[11px] text-neutral-800">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Signal: {problem.signal_score || 75}/100</span>
                    </div>
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
