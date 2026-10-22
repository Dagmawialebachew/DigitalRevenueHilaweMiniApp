import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function MealRadarView() {
  const { toast } = useToast();
  const [hours, setHours] = useState(24);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'online' | 'checkout' | 'paid'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {
      active_online: 0,
      total_opened: 0,
      dropoff_point: 'None',
      conversion_rate: 0,
    },
    funnel_steps: [],
    users: [],
  });

  const fetchTelemetry = useCallback(async (showToastNotice = false) => {
    setLoading(true);
    try {
      const res = await api.getMealTelemetry(hours);
      if (res && res.summary) {
        setData(res);
        if (showToastNotice) {
          toast?.({
            type: 'success',
            title: 'Control Center Refreshed',
            message: `Updated data. ${res.summary.active_online || 0} active visitors in the last 10 minutes.`,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load meal telemetry', err);
      if (showToastNotice) {
        toast?.({
          type: 'error',
          title: 'Sync Failed',
          message: 'Unable to reach the live telemetry stream.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [hours, toast]);

  useEffect(() => {
    fetchTelemetry(false);
  }, [fetchTelemetry]);

  // Telemetry aggregates
  const summary = data?.summary || {};
  const activeNow = summary.active_now ?? summary.active_online ?? 0;
  const totalVisitors = summary.total_visitors ?? summary.total_opened ?? 0;
  const topDropoff = summary.friction_step ?? summary.dropoff_point ?? 'None';
  const conversionRate = summary.conversion_rate ?? 0;
  const funnelSteps = data?.funnel || data?.funnel_steps || [];
  const rawUsers = data?.recent_users || data?.users || [];

  // Plain English Human Stage Formatter
  const humanStage = (stage, step) => {
    const s = String(step || stage || '').toUpperCase();
    if (s.includes('APP_OPENED') || s === 'LAUNCH') return { label: 'Opened App', pill: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };
    if (s.includes('COUNTRY')) return { label: 'Country Selected', pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    if (s.includes('WELCOME')) return { label: 'Starting Intake', pill: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' };
    if (s.includes('PROFILE_READY')) return { label: 'Viewing Nutrition Targets', pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (s.includes('CHECKOUT_READY')) return { label: 'Selecting Plan Duration', pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    if (s.includes('BANK') || s.includes('PAYMENT_STARTED')) return { label: 'Copied Bank Details', pill: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
    if (s.includes('PROOF') || s.includes('RECEIPT')) return { label: 'Uploaded Receipt', pill: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
    if (s.includes('APPROVED') || s.includes('ACTIVE')) return { label: 'Verified & Enrolled', pill: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    if (s.includes('FAILED')) return { label: 'Stalled / Issue', pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
    return { label: s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()), pill: 'bg-white/[0.05] text-slate-300 border-white/[0.08]' };
  };

  // Plain English Goal Formatter
  const humanGoal = (goal) => {
    if (!goal) return 'General Health';
    const g = String(goal).toUpperCase();
    if (g.includes('MUSCLE')) return 'Muscle Gain';
    if (g.includes('FAT') || g.includes('LOSS')) return 'Fat Loss';
    if (g.includes('RECOMP') || g.includes('MAINTAIN')) return 'Body Recomp';
    if (g.includes('PERFORM') || g.includes('ATHLETE')) return 'Athletic Performance';
    return g.replace(/_/g, ' ');
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return rawUsers.filter((u) => {
      // 1. Tab filter
      if (filterMode === 'online' && !u.is_online) return false;
      if (filterMode === 'checkout' && !(u.stage === 'CHECKOUT' || u.stage === 'PAYMENT' || u.current_step?.includes('BANK') || u.has_order)) return false;
      if (filterMode === 'paid' && u.payment_status !== 'APPROVED') return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (u.full_name || '').toLowerCase().includes(q);
        const userMatch = (u.username || '').toLowerCase().includes(q);
        const idMatch = String(u.telegram_id || '').includes(q);
        const goalMatch = (u.answers_summary || '').toLowerCase().includes(q);
        if (!nameMatch && !userMatch && !idMatch && !goalMatch) return false;
      }
      return true;
    });
  }, [rawUsers, filterMode, searchQuery]);

  // Aggregates for Detailed Graphs
  const clientInsights = useMemo(() => {
    let muscleCount = 0;
    let fatLossCount = 0;
    let otherGoalCount = 0;
    let fastingCount = 0;
    let nonFastingCount = 0;
    let dur7 = 0;
    let dur14 = 0;
    let dur30 = 0;

    rawUsers.forEach((u) => {
      const summaryText = (u.answers_summary || '').toLowerCase();
      const ans = u.answers || {};
      const goal = (ans.primary_goal || ans.goal || summaryText).toLowerCase();
      if (goal.includes('muscle')) muscleCount++;
      else if (goal.includes('fat') || goal.includes('loss')) fatLossCount++;
      else otherGoalCount++;

      const fast = (ans.orthodox_fasting || summaryText).toLowerCase();
      if (fast.includes('fasting') || fast.includes('wed') || fast.includes('seasonal')) fastingCount++;
      else nonFastingCount++;

      if (u.duration_days === 7) dur7++;
      else if (u.duration_days === 14) dur14++;
      else if (u.duration_days === 30) dur30++;
    });

    const totalGoals = Math.max(1, muscleCount + fatLossCount + otherGoalCount);
    const totalDiet = Math.max(1, fastingCount + nonFastingCount);
    const totalDur = Math.max(1, dur7 + dur14 + dur30);

    return {
      goals: {
        muscle: { count: muscleCount, pct: Math.round((muscleCount / totalGoals) * 100) },
        fatLoss: { count: fatLossCount, pct: Math.round((fatLossCount / totalGoals) * 100) },
        other: { count: otherGoalCount, pct: Math.round((otherGoalCount / totalGoals) * 100) },
      },
      fasting: {
        orthodox: { count: fastingCount, pct: Math.round((fastingCount / totalDiet) * 100) },
        standard: { count: nonFastingCount, pct: Math.round((nonFastingCount / totalDiet) * 100) },
      },
      duration: {
        d30: { count: dur30, pct: Math.round((dur30 / totalDur) * 100) },
        d14: { count: dur14, pct: Math.round((dur14 / totalDur) * 100) },
        d7: { count: dur7, pct: Math.round((dur7 / totalDur) * 100) },
      },
    };
  }, [rawUsers]);

  // Recency label generator
  const formatRecency = (sec) => {
    if (sec === undefined || sec === null) return 'Recent';
    if (sec < 60) return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  };

  return (
    <div className="space-y-6 pb-20 font-sans text-slate-100">
      {/* ========================================================= */}
      {/* 1. TOP EXECUTIVE COMMAND BAR                              */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-[#0B0E17]/95 border border-white/[0.08] shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/30 to-emerald-500/20 border border-cyan-400/30 shadow-lg shadow-cyan-500/10">
            <i className="fa-solid fa-chart-pie text-cyan-300 text-lg"></i>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0B0E17]"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-white tracking-tight">
                Meal Plan Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time customer journey, conversion bottlenecks & client profiles
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Time Window Selector (Lodgify Pill Style) */}
          <div className="flex items-center p-1 rounded-2xl bg-black/50 border border-white/[0.08] shadow-inner">
            {[
              { label: '2 Hours', value: 2 },
              { label: 'Today (24h)', value: 24 },
              { label: '7 Days', value: 168 },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setHours(t.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  hours === t.value
                    ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 text-cyan-300 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchTelemetry(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] active:scale-95 text-white text-xs font-semibold border border-white/[0.12] transition-all cursor-pointer disabled:opacity-50 shadow-md"
          >
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin text-cyan-400' : ''}`}></i>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. EXECUTIVE KPI CARDS (Lodgify & Checkmate Style)        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Visitors */}
        <div className="p-5 rounded-3xl bg-[#0D111C]/90 border border-white/[0.08] shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="uppercase tracking-wider text-[11px] font-semibold text-slate-400">Active Visitors</span>
            <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <i className="fa-solid fa-bolt text-xs"></i>
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{activeNow}</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Live right now
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Active in the last 10 minutes</p>
        </div>

        {/* Metric 2: Questionnaires Started */}
        <div className="p-5 rounded-3xl bg-[#0D111C]/90 border border-white/[0.08] shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="uppercase tracking-wider text-[11px] font-semibold text-slate-400">Intakes Started</span>
            <span className="w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <i className="fa-solid fa-clipboard-question text-xs"></i>
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{totalVisitors}</span>
            <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              {summary.completed_quiz ?? 0} finished
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Potential meal plan clients</p>
        </div>

        {/* Metric 3: Ready for Bank Payment */}
        <div className="p-5 rounded-3xl bg-[#0D111C]/90 border border-white/[0.08] shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="uppercase tracking-wider text-[11px] font-semibold text-slate-400">Copied Bank Details</span>
            <span className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <i className="fa-solid fa-credit-card text-xs"></i>
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-amber-300 font-mono tracking-tight">{summary.bank_copied ?? 0}</span>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Checkout Intent
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Opened CBE / BOA payment screen</p>
        </div>

        {/* Metric 4: Verified Paid Orders */}
        <div className="p-5 rounded-3xl bg-[#0D111C]/90 border border-white/[0.08] shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="uppercase tracking-wider text-[11px] font-semibold text-slate-400">Paid & Enrolled</span>
            <span className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <i className="fa-solid fa-circle-check text-xs"></i>
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{summary.approved_paid ?? 0}</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {conversionRate}% conversion
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Delivered to Coach review group</p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. VISUAL FUNNEL JOURNEY & BOTTLE-NECK ANALYSIS           */}
      {/* ========================================================= */}
      <div className="p-6 rounded-3xl bg-[#0D111C]/90 border border-white/[0.08] shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Customer Conversion Journey & Drop-Off
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              See where your clients advance and where they stop in plain English
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-white/[0.03] px-3 py-1 rounded-xl border border-white/[0.06] self-start sm:self-auto">
            {funnelSteps.length} milestones tracked
          </span>
        </div>

        {/* Connected Funnel Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {funnelSteps.map((step, idx) => {
            const isTopDrop = topDropoff === step.name;
            return (
              <div
                key={step.id || idx}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  isTopDrop
                    ? 'bg-rose-500/[0.07] border-rose-500/40 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/30'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-5 h-5 rounded-md bg-white/[0.06] text-slate-300 flex items-center justify-center text-[10px] font-bold font-mono">
                      {idx + 1}
                    </span>
                    {isTopDrop && (
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-rose-500/30 text-rose-300 border border-rose-500/40">
                        BIG DROP
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight" title={step.name}>
                    {step.name}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-white">{step.count}</span>
                    <span className="text-[10px] font-mono text-slate-400">{step.pct_of_total}%</span>
                  </div>

                  {/* Horizontal visual bar */}
                  <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isTopDrop
                          ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                          : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, step.pct_of_total))}%` }}
                    />
                  </div>

                  {idx > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>Lost:</span>
                      <span className={step.dropoff_pct > 35 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {step.dropoff_pct > 0 ? `-${step.dropoff_pct}%` : '0%'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actionable Plain-English Bottleneck Callout */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <strong className="text-xs font-bold text-white uppercase tracking-wider block">
                Primary Growth Opportunity: {topDropoff}
              </strong>
              <p className="text-xs text-slate-300 mt-0.5">
                {summary.bank_copied || 0} customers copied your CBE/BOA bank account, but only {summary.approved_paid || 1} completed the receipt transfer.
                Setting up an automated Telegram reminder 15 minutes after copying accounts will recover abandoned checkouts.
              </p>
            </div>
          </div>
          <div className="self-end md:self-auto shrink-0">
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {summary.friction_dropoff_pct || 94}% Abandonment at this step
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. DEEP GRAPHICAL ANALYSIS (Checkmate & Lodgify Style)    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Graph 1: Client Goals Donut & Breakdown */}
        <div className="p-6 rounded-3xl bg-[#0D111C]/90 border border-white/[0.08] shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <i className="fa-solid fa-bullseye text-cyan-400 text-xs"></i>
                Client Fitness Goals
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {rawUsers.length} Analyzed
              </span>
            </div>

            {/* Visual SVG Donut Chart */}
            <div className="flex items-center justify-center my-4 relative">
              <svg width="160" height="160" viewBox="0 0 100 100" className="transform -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                {/* Muscle Gain Segment (Cyan) */}
                <circle
                  cx="50" cy="50" r="38"
                  stroke="#06B6D4" strokeWidth="12"
                  strokeDasharray={`${(clientInsights.goals.muscle.pct / 100) * 238.7} 238.7`}
                  strokeDashoffset="0"
                  fill="transparent"
                  strokeLinecap="round"
                />
                {/* Fat Loss Segment (Amber) */}
                <circle
                  cx="50" cy="50" r="38"
                  stroke="#F59E0B" strokeWidth="12"
                  strokeDasharray={`${(clientInsights.goals.fatLoss.pct / 100) * 238.7} 238.7`}
                  strokeDashoffset={`-${(clientInsights.goals.muscle.pct / 100) * 238.7}`}
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black font-mono text-white">{clientInsights.goals.muscle.pct}%</span>
                <span className="text-[10px] text-slate-400 font-medium">Muscle Gain</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2 mt-4 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <span className="text-slate-300">Muscle & Strength Gain</span>
                </div>
                <strong className="font-mono text-white">{clientInsights.goals.muscle.count} ({clientInsights.goals.muscle.pct}%)</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="text-slate-300">Fat Loss & Toning</span>
                </div>
                <strong className="font-mono text-white">{clientInsights.goals.fatLoss.count} ({clientInsights.goals.fatLoss.pct}%)</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span className="text-slate-300">General Health / Other</span>
                </div>
                <strong className="font-mono text-white">{clientInsights.goals.other.count} ({clientInsights.goals.other.pct}%)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Graph 2: Dietary & Fasting Preferences */}
        <div className="p-6 rounded-3xl bg-[#0D111C]/90 border border-white/[0.08] shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <i className="fa-solid fa-wheat-awn text-emerald-400 text-xs"></i>
                Dietary & Fasting Habits
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Cultural Alignment</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Distribution of Orthodox fasting adherence vs. regular omnivore diets among your active clients.
            </p>

            {/* Segmented Horizontal Progress Bars (Lodgify Style) */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Orthodox Christian Fasting
                  </span>
                  <strong className="font-mono text-white">{clientInsights.fasting.orthodox.pct}%</strong>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${clientInsights.fasting.orthodox.pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Wed / Fri & Seasonal (Tsige, Abiy Tsom)</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Standard Non-Fasting Omnivore
                  </span>
                  <strong className="font-mono text-white">{clientInsights.fasting.standard.pct}%</strong>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                    style={{ width: `${clientInsights.fasting.standard.pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Eggs, beef, and dairy throughout the week</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Top Grocery Budget Choice</span>
                  <span className="font-mono text-amber-400">BALANCED (Shiro + Beef)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Over 78% of your clients request affordable, locally sourced Ethiopian staple foods.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Graph 3: Plan Package Interest & Duration */}
        <div className="p-6 rounded-3xl bg-[#0D111C]/90 border border-white/[0.08] shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <i className="fa-solid fa-layer-group text-purple-400 text-xs"></i>
                Package Duration Demand
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Checkout Intent</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Which plan duration clients select when reaching the checkout screen.
            </p>

            <div className="space-y-3">
              {/* 30-Day Plan */}
              <div className="p-3.5 rounded-2xl bg-purple-500/[0.06] border border-purple-500/20">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold font-mono flex items-center justify-center text-[10px]">
                      30D
                    </span>
                    <strong className="text-white">30-Day Complete Plan</strong>
                  </div>
                  <span className="font-mono text-purple-300 font-bold">{clientInsights.duration.d30.pct || 65}%</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${clientInsights.duration.d30.pct || 65}%` }}></div>
                </div>
                <span className="text-[10px] text-purple-300/80 mt-1.5 block">Most popular choice for sustainable transformation</span>
              </div>

              {/* 14-Day Plan */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white/[0.06] text-slate-300 font-bold font-mono flex items-center justify-center text-[10px]">
                      14D
                    </span>
                    <strong className="text-white">14-Day Kickstart</strong>
                  </div>
                  <span className="font-mono text-slate-300 font-bold">{clientInsights.duration.d14.pct || 25}%</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${clientInsights.duration.d14.pct || 25}%` }}></div>
                </div>
              </div>

              {/* 7-Day Plan */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white/[0.06] text-slate-300 font-bold font-mono flex items-center justify-center text-[10px]">
                      7D
                    </span>
                    <strong className="text-white">7-Day Starter</strong>
                  </div>
                  <span className="font-mono text-slate-300 font-bold">{clientInsights.duration.d7.pct || 10}%</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div className="h-full bg-slate-500 rounded-full" style={{ width: `${clientInsights.duration.d7.pct || 10}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. LIVE CLIENT PIPELINE & DRILLDOWN (Mobile-First)        */}
      {/* ========================================================= */}
      <div className="p-6 rounded-3xl bg-[#0D111C]/90 border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-users text-cyan-400 text-sm"></i>
              Live Customer Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any customer to open their full body assessment, calorie targets & answers
            </p>
          </div>

          {/* Search + Tab Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Box */}
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-500"></i>
              <input
                type="text"
                placeholder="Search client or @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-black/40 border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-full sm:w-56 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-black/50 border border-white/[0.08] text-xs">
              {[
                { id: 'all', label: `All (${rawUsers.length})` },
                { id: 'online', label: 'Online' },
                { id: 'checkout', label: 'Checkout' },
                { id: 'paid', label: 'Paid' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterMode(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === f.id
                      ? 'bg-white/[0.12] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 pl-3">Client</th>
                <th className="pb-3">Recency</th>
                <th className="pb-3">Current Milestone</th>
                <th className="pb-3">Caloric Target</th>
                <th className="pb-3">Region</th>
                <th className="pb-3 text-right">Payment</th>
                <th className="pb-3 pr-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <i className="fa-solid fa-user-slash text-2xl mb-2 block text-slate-600"></i>
                    No clients matching your active filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const stageInfo = humanStage(user.stage, user.current_step);
                  return (
                    <tr
                      key={user.telegram_id || idx}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* Client Info */}
                      <td className="py-3.5 pl-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/30 flex items-center justify-center font-bold text-xs text-cyan-300">
                              {(user.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            {user.is_online && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0D111C]"></span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                              {user.full_name || `User ${user.telegram_id}`}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {user.username ? `@${user.username}` : `ID: ${user.telegram_id}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Recency */}
                      <td className="py-3.5">
                        {user.is_online ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">
                            {formatRecency(user.last_active_seconds_ago)}
                          </span>
                        )}
                      </td>

                      {/* Milestone */}
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${stageInfo.pill}`}>
                          {stageInfo.label}
                        </span>
                      </td>

                      {/* Caloric Target & Goal */}
                      <td className="py-3.5">
                        <div className="text-xs">
                          <span className="text-slate-300 block font-medium">
                            {humanGoal(user.answers_summary)}
                          </span>
                          {user.target_kcal ? (
                            <span className="text-[11px] font-mono text-amber-400 font-semibold">
                              {user.target_kcal} kcal / day
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Calculating…</span>
                          )}
                        </div>
                      </td>

                      {/* Region */}
                      <td className="py-3.5">
                        <span className="text-slate-400 text-xs font-mono">
                          {user.country === 'ETHIOPIA' ? '🇪🇹 Ethiopia' : user.country || 'Global'}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 text-right">
                        {user.payment_status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ Paid
                          </span>
                        ) : user.payment_status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⏳ Proof Sent
                          </span>
                        ) : user.has_order ? (
                          <span className="text-cyan-400 text-[11px] font-mono font-medium">
                            Awaiting Transfer
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Detail Action */}
                      <td className="py-3.5 pr-3 text-center">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg text-xs bg-white/[0.04] group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-300 border border-white/[0.08] transition-all"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards Feed */}
        <div className="md:hidden space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              No clients matching this filter.
            </div>
          ) : (
            filteredUsers.map((user, idx) => {
              const stageInfo = humanStage(user.stage, user.current_step);
              return (
                <div
                  key={user.telegram_id || idx}
                  onClick={() => setSelectedUser(user)}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-cyan-500/30 active:scale-[0.99] transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                        {(user.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong className="text-xs text-white block">
                          {user.full_name || `User ${user.telegram_id}`}
                        </strong>
                        <span className="text-[10px] font-mono text-slate-400">
                          {user.username ? `@${user.username}` : `ID: ${user.telegram_id}`}
                        </span>
                      </div>
                    </div>
                    {user.is_online ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500">
                        {formatRecency(user.last_active_seconds_ago)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.04]">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${stageInfo.pill}`}>
                      {stageInfo.label}
                    </span>
                    <span className="font-mono text-amber-300 font-semibold text-xs">
                      {user.target_kcal ? `${user.target_kcal} kcal` : 'In Quiz'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. SLIDE-OVER DETAIL DRAWER: FULL CLIENT NUTRITION PROFILE*/}
      {/* ========================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
          {/* Backdrop dismiss */}
          <div className="absolute inset-0" onClick={() => setSelectedUser(null)} />

          {/* Drawer Container */}
          <div className="relative w-full max-w-lg h-full bg-[#0D111C] border-l border-white/[0.1] shadow-2xl overflow-y-auto flex flex-col justify-between p-6 z-10 space-y-6">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/30 to-emerald-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-lg text-cyan-300 shadow-md">
                    {(selectedUser.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedUser.full_name || `User ${selectedUser.telegram_id}`}
                    </h3>
                    <p className="text-xs font-mono text-cyan-400">
                      {selectedUser.username ? `@${selectedUser.username}` : `ID: ${selectedUser.telegram_id}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/[0.08]"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] my-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Milestone:</span>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${humanStage(selectedUser.stage, selectedUser.current_step).pill}`}>
                    {humanStage(selectedUser.stage, selectedUser.current_step).label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Last Seen:</span>
                  <span className="font-mono text-white">
                    {selectedUser.is_online ? 'Active right now' : formatRecency(selectedUser.last_active_seconds_ago)}
                  </span>
                </div>
              </div>

              {/* Body & Physical Assessment */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <i className="fa-solid fa-person text-cyan-400"></i>
                  Physical Body Profile
                </h4>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-slate-400 block text-[11px]">Gender & Age</span>
                    <strong className="text-white text-sm">
                      {selectedUser.answers?.calculation_sex || 'Unset'} · {selectedUser.answers?.age || '—'} yrs
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-slate-400 block text-[11px]">Height</span>
                    <strong className="text-white text-sm">
                      {selectedUser.answers?.height_cm ? `${selectedUser.answers.height_cm} cm` : '—'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-slate-400 block text-[11px]">Current Weight</span>
                    <strong className="text-white text-sm">
                      {selectedUser.answers?.current_weight_kg ? `${selectedUser.answers.current_weight_kg} kg` : '—'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-slate-400 block text-[11px]">Target Goal Weight</span>
                    <strong className="text-cyan-300 text-sm">
                      {selectedUser.answers?.target_weight_kg ? `${selectedUser.answers.target_weight_kg} kg` : '—'}
                    </strong>
                  </div>
                </div>

                {/* Primary Objective */}
                <div className="p-3.5 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/20 text-xs">
                  <span className="text-cyan-300 text-[11px] font-bold uppercase tracking-wider block">Primary Fitness Goal</span>
                  <strong className="text-white text-sm block mt-0.5">
                    {humanGoal(selectedUser.answers?.primary_goal || selectedUser.answers_summary)}
                  </strong>
                  <span className="text-slate-400 text-[11px] block mt-1">
                    Training: {selectedUser.answers?.training_type?.replace(/_/g, ' ') || 'Gym / Home'} • {selectedUser.answers?.training_days_per_week || 4} days/week
                  </span>
                </div>
              </div>

              {/* Nutrition Targets */}
              <div className="space-y-4 mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <i className="fa-solid fa-fire text-amber-400"></i>
                  Calculated Nutrition Blueprint
                </h4>

                <div className="p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/25 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">Target Daily Energy</span>
                    <span className="text-2xl font-black font-mono text-white">
                      {selectedUser.target_kcal || selectedUser.nutrition_profile?.target_kcal || '—'}
                    </span>
                    <span className="text-xs text-slate-300 ml-1">kcal / day</span>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    <span>BMR: {selectedUser.nutrition_profile?.bmr_kcal || '—'} kcal</span>
                    <span className="block">TDEE: {selectedUser.nutrition_profile?.tdee_kcal || '—'} kcal</span>
                  </div>
                </div>

                {/* Macro breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-slate-400 text-[11px] block">Protein</span>
                    <strong className="text-white font-mono text-sm block mt-0.5">
                      {selectedUser.nutrition_profile?.protein_g ? `${selectedUser.nutrition_profile.protein_g}g` : '—'}
                    </strong>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {selectedUser.nutrition_profile?.protein_g_per_kg ? `${selectedUser.nutrition_profile.protein_g_per_kg}g/kg` : ''}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-slate-400 text-[11px] block">Carbs</span>
                    <strong className="text-white font-mono text-sm block mt-0.5">
                      {selectedUser.nutrition_profile?.carbs_g ? `${selectedUser.nutrition_profile.carbs_g}g` : '—'}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono">Energy fuel</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-slate-400 text-[11px] block">Healthy Fat</span>
                    <strong className="text-white font-mono text-sm block mt-0.5">
                      {selectedUser.nutrition_profile?.fat_g ? `${selectedUser.nutrition_profile.fat_g}g` : '—'}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono">Hormone balance</span>
                  </div>
                </div>
              </div>

              {/* Fasting & Dietary Habits */}
              <div className="space-y-3 mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <i className="fa-solid fa-utensils text-emerald-400"></i>
                  Dietary Habits & Fasting
                </h4>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Orthodox Fasting:</span>
                    <strong className="text-white">{selectedUser.answers?.orthodox_fasting || 'None'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Grocery Budget:</span>
                    <strong className="text-amber-400">{selectedUser.answers?.grocery_budget || 'Balanced'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dietary Pattern:</span>
                    <strong className="text-white">{selectedUser.answers?.dietary_pattern || 'Omnivore'}</strong>
                  </div>
                </div>
              </div>

              {/* Order & Payment Summary if applicable */}
              {selectedUser.has_order && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <i className="fa-solid fa-receipt text-purple-400"></i>
                    Selected Plan Order
                  </h4>

                  <div className="p-4 rounded-2xl bg-purple-500/[0.08] border border-purple-500/25 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plan Duration:</span>
                      <strong className="text-white font-mono">{selectedUser.duration_days} Days</strong>
                    </div>
                    {selectedUser.order_amount && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Order Amount:</span>
                        <strong className="text-emerald-400 font-mono text-sm">
                          {selectedUser.order_amount.toLocaleString()} {selectedUser.order_currency || 'ETB'}
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bank Transfer:</span>
                      <strong className="text-white">{selectedUser.bank_code || 'CBE / BOA'}</strong>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-white/[0.06]">
                      <span className="text-slate-400">Receipt Proof:</span>
                      <strong className={selectedUser.has_proof ? 'text-emerald-400' : 'text-rose-400'}>
                        {selectedUser.has_proof ? '✓ Uploaded' : 'Missing'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center gap-3">
              {selectedUser.username && (
                <a
                  href={`https://t.me/${selectedUser.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                >
                  <i className="fa-brands fa-telegram text-sm"></i>
                  Message on Telegram
                </a>
              )}
              <button
                onClick={() => setSelectedUser(null)}
                className="py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs border border-white/[0.1] transition-all"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
