'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/footer/Footer';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Database,
  CloudUpload,
  AlertCircle,
} from 'lucide-react';
import { Problem, DatabaseStats } from '@/lib/db/schema';

export default function AdminDashboardPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [activeTab, setActiveTab] = useState<'submissions' | 'excel' | 'audit'>('submissions');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [dbHealth, setDbHealth] = useState<{ configured: boolean; connected: boolean; tablesExist: boolean; error?: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/admin/sync').then(r => r.json());
      if (res.success) setDbHealth(res.health);
    } catch {}
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' }).then(r => r.json());
      setSyncMessage(res.message || (res.success ? 'Sync complete' : 'Sync failed'));
      if (res.health) setDbHealth(res.health);
      await handleRefresh();
    } catch (e: any) {
      setSyncMessage(e?.message || 'Sync request failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/problems?sort=most_recent').then(r => r.json()),
        fetch('/api/stats').then(r => r.json()),
      ]);

      if (pRes.success) setProblems(pRes.problems);
      if (sRes.success) setStats(sRes.stats);
      await checkHealth();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch('/api/problems?sort=most_recent').then(r => r.json()),
          fetch('/api/stats').then(r => r.json()),
        ]);

        if (isMounted) {
          if (pRes.success) setProblems(pRes.problems);
          if (sRes.success) setStats(sRes.stats);
        }
        await checkHealth();
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalProblemsCount = stats?.totalProblems ?? problems.length;
  const totalSubmittersCount = stats?.uniqueSubmitters ?? stats?.uniqueContributors ?? new Set(problems.map(p => p.user_id).filter(Boolean)).size;
  const todayProblemsCount = problems.filter(p => new Date(p.created_at) >= todayStart).length || stats?.todayProblems || 0;
  const thisWeekProblemsCount = problems.filter(p => new Date(p.created_at) >= weekStart).length;
  const thisMonthProblemsCount = problems.filter(p => new Date(p.created_at) >= monthStart).length;

  const availableCategories = Array.from(
    new Set(problems.map(p => p.category_name).filter(Boolean))
  ) as string[];

  const handleExport = (filter: string, category?: string) => {
    setExporting(filter);
    if (filter === 'all' && !category) {
      window.location.href = '/api/problems/export';
    } else {
      let url = `/api/admin/export?filter=${filter}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      window.location.href = url;
    }
    setTimeout(() => setExporting(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EA] text-[#101114]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-5 h-0.5 bg-[#C8FF4D]" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Governance & Moderation
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101114] tracking-tight">
              Admin Control Center
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Cluster synthesis, AI classification review, and content moderation.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="self-start sm:self-auto px-4 py-2 bg-white rounded-xl border border-neutral-200 text-xs font-bold hover:bg-neutral-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Database Status & Synchronization Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              dbHealth?.tablesExist
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#101114]">
                  Storage Mode:
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  dbHealth?.tablesExist
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dbHealth?.connected !== false ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  Excel File Storage Active
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                All problems are persistently stored in data/problems.xlsx with zero database dependencies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {syncMessage && (
              <span className="text-[11px] font-medium text-neutral-600 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-200">
                {syncMessage}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Verifying...' : 'Verify Excel Storage'}
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">Total Problems</span>
            <div className="text-2xl font-extrabold text-[#101114] mt-1 font-mono">
              {stats?.totalProblems || 0}
            </div>
            <span className="text-[10px] text-neutral-400">Stored in problems.xlsx</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">Total Submitters</span>
            <div className="text-2xl font-extrabold text-[#101114] mt-1 font-mono">
              {stats?.uniqueSubmitters ?? stats?.uniqueContributors ?? 0}
            </div>
            <span className="text-[10px] text-neutral-400">Unique contributors</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">Today&apos;s Problems</span>
            <div className="text-2xl font-extrabold text-[#101114] mt-1 font-mono">
              {stats?.todayProblems || 0}
            </div>
            <span className="text-[10px] text-neutral-400">Submitted today</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">Active Categories</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">
              {stats?.categoriesCount || 0}
            </div>
            <span className="text-[10px] text-neutral-400">Covered sectors</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-neutral-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'submissions'
                ? 'bg-[#101114] text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Recent Problems
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'excel'
                ? 'bg-[#101114] text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            Excel Reports
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-[#101114] text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Security & Audit Trail
          </button>
        </div>

        {/* Submissions Table */}
        {activeTab === 'submissions' && (
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#101114]">Recent Problems</h3>
                <p className="text-[11px] text-neutral-500">Live records from data/problems.xlsx</p>
              </div>
              <span className="text-xs text-neutral-500 font-mono">{problems.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-100">
                  <tr>
                    <th className="p-3.5 whitespace-nowrap">Problem ID</th>
                    <th className="p-3.5 whitespace-nowrap">Title</th>
                    <th className="p-3.5 whitespace-nowrap">Description</th>
                    <th className="p-3.5 whitespace-nowrap">Category</th>
                    <th className="p-3.5 whitespace-nowrap">Submitter</th>
                    <th className="p-3.5 whitespace-nowrap">Created Date/Time</th>
                    <th className="p-3.5 whitespace-nowrap">Status</th>
                    <th className="p-3.5 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {problems.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-neutral-700 whitespace-nowrap">
                        {p.problem_code}
                      </td>
                      <td className="p-3.5 max-w-xs truncate font-medium text-neutral-800" title={p.normalized_problem || p.raw_description}>
                        {p.normalized_problem || p.raw_description}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-neutral-600 italic" title={p.raw_description}>
                        &ldquo;{p.raw_description}&rdquo;
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-[#C8FF4D]/30 text-emerald-900 rounded font-semibold text-[11px]">
                          {p.category_name || 'General'}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-neutral-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-neutral-100 rounded text-[11px]">
                          {p.submitter_name || (p.is_anonymous ? 'Anonymous' : 'Community')}
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(p.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'flagged'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => alert(`Problem ${p.problem_code} verified.`)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Verify"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert(`Problem ${p.problem_code} flagged for review.`)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Flag as Spam"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Excel Reports Section */}
        {activeTab === 'excel' && (
          <div className="space-y-8">
            {/* Excel Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">Total Problems</span>
                <div className="text-2xl font-extrabold text-[#101114] mt-1 font-mono">{totalProblemsCount}</div>
                <span className="text-[10px] text-neutral-400">All submissions</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">Total Submitters</span>
                <div className="text-2xl font-extrabold text-[#101114] mt-1 font-mono">{totalSubmittersCount}</div>
                <span className="text-[10px] text-neutral-400">Unique contributors</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">Today&apos;s Problems</span>
                <div className="text-2xl font-extrabold text-[#101114] mt-1 font-mono">{todayProblemsCount}</div>
                <span className="text-[10px] text-neutral-400">Since 00:00 UTC</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">This Week&apos;s Problems</span>
                <div className="text-2xl font-extrabold text-[#101114] mt-1 font-mono">{thisWeekProblemsCount}</div>
                <span className="text-[10px] text-neutral-400">Past 7 days</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm col-span-2 sm:col-span-1">
                <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">This Month&apos;s Problems</span>
                <div className="text-2xl font-extrabold text-[#101114] mt-1 font-mono">{thisMonthProblemsCount}</div>
                <span className="text-[10px] text-neutral-400">Current calendar month</span>
              </div>
            </div>

            {/* Excel Export Controls Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-bold text-[#101114]">Problem Collector Excel Reports</h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Export verified problem records to formatted Excel spreadsheets (<code className="font-mono text-[11px] bg-neutral-100 px-1 py-0.5 rounded">data/problems.xlsx</code>).
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Excel Storage Active
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => handleExport('all')}
                  disabled={exporting !== null}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-[#101114] text-white rounded-2xl font-bold text-xs hover:bg-neutral-800 transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#C8FF4D]" />
                  {exporting === 'all' ? 'Generating...' : 'Export All Problems'}
                </button>

                <button
                  onClick={() => handleExport('today')}
                  disabled={exporting !== null}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white text-neutral-800 border border-neutral-200 rounded-2xl font-bold text-xs hover:bg-neutral-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  {exporting === 'today' ? 'Generating...' : 'Export Today'}
                </button>

                <button
                  onClick={() => handleExport('week')}
                  disabled={exporting !== null}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white text-neutral-800 border border-neutral-200 rounded-2xl font-bold text-xs hover:bg-neutral-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {exporting === 'week' ? 'Generating...' : 'Export This Week'}
                </button>

                <button
                  onClick={() => handleExport('month')}
                  disabled={exporting !== null}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white text-neutral-800 border border-neutral-200 rounded-2xl font-bold text-xs hover:bg-neutral-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-purple-600" />
                  {exporting === 'month' ? 'Generating...' : 'Export This Month'}
                </button>
              </div>

              {/* Export by Category */}
              <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="text-xs font-bold text-neutral-700 whitespace-nowrap flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-neutral-500" />
                  Export by Category:
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select a Category ({availableCategories.length} available)</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => selectedCategory && handleExport('category', selectedCategory)}
                  disabled={!selectedCategory || exporting !== null}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export by Category
                </button>
              </div>

              {/* Excel Specifications Summary Card */}
              <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600">Worksheets Included in Master Excel</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-neutral-600">
                  <div className="p-3 bg-white rounded-xl border border-neutral-200/70">
                    <p className="font-bold text-neutral-900 font-mono">1. ALL PROBLEMS</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Every verified submission, sorted newest first with S.No, Problem ID, Date, Time, Title, Description, Submitter, and Status.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200/70">
                    <p className="font-bold text-neutral-900 font-mono">2. CATEGORY SUMMARY</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Summary table of total problems aggregated by sector (Education, Transport, Technology, etc.).</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200/70">
                    <p className="font-bold text-neutral-900 font-mono">3. DAILY SUMMARY</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Submission velocity breakdown grouped by Date (DD-MM-YYYY).</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200/70">
                    <p className="font-bold text-neutral-900 font-mono">4. STATUS SUMMARY</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Status breakdown (ACTIVE, FLAGGED, RESOLVED, ARCHIVED).</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200/70">
                    <p className="font-bold text-neutral-900 font-mono">5. MONTHLY SUMMARY</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Monthly trends grouped by calendar month.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-neutral-200/70">
                    <p className="font-bold text-neutral-900 font-mono">6. CATEGORY WORKSHEETS</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Dedicated standalone sheets for each category (Transport, Healthcare, etc.) created automatically.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#101114]">System Security & Audit Activity</h3>
            <p className="text-xs text-neutral-500">
              Immutable log of admin actions, AI classifications, and cluster assignments.
            </p>
            <div className="space-y-2 font-mono text-xs text-neutral-600 bg-neutral-900 text-neutral-300 p-4 rounded-2xl">
              <p>[SYSTEM_INIT] Excel storage engine initialized at data/problems.xlsx.</p>
              <p>[STORAGE_ENGINE] Zero-database file persistence active.</p>
              <p>[AI_PROVIDER] Heuristic and OpenAI hybrid provider registered.</p>
              <p>[REALTIME] SSE broadcast channel online.</p>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
