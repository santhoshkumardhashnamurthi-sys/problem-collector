'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  Layers,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Problem } from '@/lib/db/schema';
import { CATEGORIES } from '@/lib/validation/problem';

interface AdminStats {
  totalProblems: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  categoryDistribution: Record<string, number>;
  whoFacesDistribution?: Record<string, number>;
  frequencyDistribution?: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard Data
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [exporting, setExporting] = useState(false);

  // Check initial authentication status
  useEffect(() => {
    fetch('/api/admin/check')
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleRefresh = async () => {
    setLoadingData(true);
    try {
      const [statsRes, problemsRes] = await Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/admin/problems').then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (problemsRes.success) setProblems(problemsRes.problems);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/admin/problems').then((r) => r.json()),
      ])
        .then(([statsRes, problemsRes]) => {
          if (isMounted) {
            if (statsRes.success) setStats(statsRes.stats);
            if (problemsRes.success) setProblems(problemsRes.problems);
          }
        })
        .catch((err) => {
          console.error('Failed to load admin data:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setIsAuthenticated(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      setIsAuthenticated(false);
      setProblems([]);
      setStats(null);
    }
  };

  const handleExportExcel = (filter: string = 'all') => {
    setExporting(true);
    let url = `/api/admin/export?filter=${filter}`;
    if (selectedCategory && selectedCategory !== 'All') {
      url += `&category=${encodeURIComponent(selectedCategory)}`;
    }

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'problems.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setExporting(false), 1500);
  };

  // Filter problems by search and category
  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.problem_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.raw_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.user_type && p.user_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' ||
      (p.category_name && p.category_name.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#08131A] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C8FF3D] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-neutral-400 font-mono tracking-wider">Verifying admin session...</span>
        </div>
      </div>
    );
  }

  // 1. Login Gate View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#08131A] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C8FF3D]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#101820] border border-neutral-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#08131A] border border-neutral-800 flex items-center justify-center text-[#C8FF3D]">
              <Lock className="w-6 h-6" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight">ARTIX Admin Portal</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Authorized personnel only. Please sign in to manage problem collections.
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2.5 rounded-xl bg-[#08131A] border border-neutral-700 text-sm text-white focus:outline-none focus:border-[#C8FF3D] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#08131A] border border-neutral-700 text-sm text-white focus:outline-none focus:border-[#C8FF3D] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 py-3 rounded-xl bg-[#C8FF3D] hover:bg-[#DFFF73] disabled:bg-neutral-600 text-[#08131A] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {loginLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Enter Control Center</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-800 text-center">
            <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
              ← Return to public website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-[#F7F4E8] text-[#08131A] flex flex-col">
      {/* Admin Top Bar */}
      <header className="bg-[#08131A] text-white border-b border-neutral-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <svg viewBox="0 0 36 36" fill="none" className="w-7 h-7">
                <path d="M18 4L4 32H12L18 19L24 32H32L18 4Z" fill="#C8FF3D" />
                <path d="M18 13L11 28H15L18 21L21 28H25L18 13Z" fill="#08131A" />
              </svg>
              <span className="font-extrabold tracking-widest text-white text-base">ARTIX</span>
            </Link>
            <span className="text-neutral-500">/</span>
            <span className="px-2.5 py-0.5 rounded-md bg-neutral-800 text-[11px] font-mono text-[#C8FF3D] border border-neutral-700">
              Admin Control Center
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExportExcel('all')}
              disabled={exporting}
              className="px-3.5 py-1.5 rounded-lg bg-[#C8FF3D] hover:bg-[#DFFF73] text-[#08131A] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exporting ? 'Generating...' : 'Export Excel'}</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={loadingData}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/40 hover:text-rose-400 text-neutral-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Problem Ingestion Overview
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Internal repository monitoring and Excel export hub.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-neutral-600">Storage Online</span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-neutral-500 text-xs font-semibold">Total Problems</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#08131A] mt-1">
              {stats?.totalProblems || problems.length}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-neutral-500 text-xs font-semibold">Today&apos;s Problems</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#08131A] mt-1">
              {stats?.todayCount ?? 0}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-neutral-500 text-xs font-semibold">This Week (7d)</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#08131A] mt-1">
              {stats?.weekCount ?? 0}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-neutral-500 text-xs font-semibold">This Month (30d)</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#08131A] mt-1">
              {stats?.monthCount ?? 0}
            </div>
          </div>
        </div>

        {/* Category Breakdown Section */}
        {stats?.categoryDistribution && Object.keys(stats.categoryDistribution).length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm mb-8">
            <h3 className="text-sm font-bold text-[#08131A] mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Category Distribution</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {CATEGORIES.map((cat) => {
                const count = stats.categoryDistribution[cat] || 0;
                return (
                  <div
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'border-[#08131A] bg-[#08131A] text-white'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100/80 text-neutral-800'
                    }`}
                  >
                    <span className="text-[11px] font-semibold block truncate">{cat}</span>
                    <span className="text-lg font-extrabold block mt-0.5">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Problems Table Card */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden mb-8">
          {/* Table Controls */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search problem code, description, location..."
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-[#08131A]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 focus:outline-none focus:border-[#08131A]"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-neutral-500 font-mono">
                Showing {filteredProblems.length} of {problems.length} records
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                <tr>
                  <th className="p-3.5">Problem ID</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Problem Description</th>
                  <th className="p-3.5">Who Faces This</th>
                  <th className="p-3.5">Frequency</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProblems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-500">
                      No problems match your current filter.
                    </td>
                  </tr>
                ) : (
                  filteredProblems.map((p) => {
                    const dateFormatted = new Date(p.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const timeFormatted = new Date(p.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const loc = p.location || [p.area, p.city].filter(Boolean).join(', ') || 'Not specified';

                    return (
                      <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-[#08131A] whitespace-nowrap">
                          {p.problem_code}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded font-semibold text-[11px] border border-neutral-200">
                            {p.category_name}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-sm text-neutral-800 leading-relaxed">
                          {p.raw_description}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-neutral-600">
                          {p.user_type || 'Everyone'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-neutral-600 font-mono text-[11px]">
                          {p.frequency || 'Daily'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-neutral-600">
                          {loc}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                          {dateFormatted} {timeFormatted}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
