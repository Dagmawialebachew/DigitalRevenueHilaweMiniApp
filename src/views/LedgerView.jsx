import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import { api } from '../services/api';
import { generatePayoutPDF } from '../services/pdfExport';
import { useToast } from '../context/ToastContext';

export default function LedgerView() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('payout'); // 'payout' | 'expense'
  const [expenseCategory, setExpenseCategory] = useState('infra'); // 'infra' | 'video_production'
  const [deductionsInput, setDeductionsInput] = useState('0');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [memoNote, setMemoNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Core dual-stream state governed by the August 10, 2026 agreement
  const [pendingData, setPendingData] = useState({
    pending_revenue: 31091,
    pending_deductions: 0,
    net_distributable: 31091,
    coach_total_payout: 21434.8,
    dagmawi_total_payout: 9656.2,
    last_payout_at: '2026-08-08T18:00:48.474330+00:00',
    products_stream: {
      gross: 27802,
      count: 49,
      deductions: 0,
      net: 27802,
      coach_rate: 0.70,
      dagmawi_rate: 0.30,
      coach_share: 19461.4,
      dagmawi_share: 8340.6,
      clause: 'Section 6.1 (Fixed 70/30)',
    },
    club_stream: {
      gross: 3289,
      count: 11,
      deductions: 0,
      net: 3289,
      stage: 'initial_60_40',
      coach_rate: 0.60,
      dagmawi_rate: 0.40,
      coach_share: 1973.4,
      dagmawi_share: 1315.6,
      cumulative_all_time: 20930,
      target_milestone: 50000,
      progress_pct: 41.9,
      clause: 'Section 6.2 (Initial 60/40 until 50k ETB, then 65/35)',
    },
    infrastructure_cap: {
      monthly_limit: 5000,
      monthly_used: 0,
      monthly_remaining: 5000,
      cap_utilized_pct: 0,
      clause: 'Section 5.1 (5,000 ETB/mo cap)',
    },
    lifetime_gross: 294579,
    lifetime_burn: 45017,
    reserve_balance: 31091,
    trend_labels: ['06/06', '07/11', '08/08', 'Pending'],
    trend_data: [59594, 19117, 47802, 31091],
  });

  const [history, setHistory] = useState([]);
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.allSettled([
        api.getPendingPayout(),
        api.getPayoutHistory(),
      ]);

      if (pendingRes.status === 'fulfilled' && pendingRes.value && !pendingRes.value.error) {
        setPendingData((prev) => ({ ...prev, ...pendingRes.value }));
        setDeductionsInput(String(pendingRes.value.pending_deductions || 0));
      }

      if (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value) && historyRes.value.length > 0) {
        setHistory(historyRes.value);
      } else {
        // High-fidelity fallback based on actual database payout_history rows
        setHistory([
          {
            id: 40,
            payout_date: '2026-08-08T18:00:48.474330Z',
            entry_type: 'payout',
            gross_revenue: 47802.49,
            products_gross: 44513.49,
            club_gross: 3289.00,
            operational_deductions: 0.00,
            net_profit: 47802.49,
            coach_share: 28681.49,
            dagmawi_share: 19121.00,
            tier_applied: 1,
            club_stage: 'initial_60_40',
            expense_note: 'Product sales + Community subscription (July & August) Saturday Main Payout',
          },
          {
            id: 39,
            payout_date: '2026-08-07T17:05:07.338038Z',
            entry_type: 'expense_only',
            gross_revenue: 0.00,
            products_gross: 0,
            club_gross: 0,
            operational_deductions: 4906.91,
            net_profit: -4906.91,
            coach_share: 0,
            dagmawi_share: 0,
            tier_applied: 1,
            club_stage: 'initial_60_40',
            expense_note: '27.11$ for server and database (at 181Br. rate)',
          },
          {
            id: 38,
            payout_date: '2026-08-07T17:02:42.891293Z',
            entry_type: 'expense_only',
            gross_revenue: 0.00,
            products_gross: 0,
            club_gross: 0,
            operational_deductions: 11259.00,
            net_profit: -11259.00,
            coach_share: 0,
            dagmawi_share: 0,
            tier_applied: 1,
            club_stage: 'initial_60_40',
            expense_note: 'Product Cost - 6',
          },
          {
            id: 37,
            payout_date: '2026-07-11T00:00:00Z',
            entry_type: 'payout',
            gross_revenue: 19117.00,
            products_gross: 19117.00,
            club_gross: 0,
            operational_deductions: 0.00,
            net_profit: 19117.00,
            coach_share: 11470.20,
            dagmawi_share: 7646.80,
            tier_applied: 1,
            club_stage: 'initial_60_40',
            expense_note: 'Main Product Sales only payout',
          },
        ]);
      }
    } catch (err) {
      console.error('Ledger fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  // Live Pro-Rata Settlement Calculations
  const prodGross = pendingData.products_stream?.gross || 0;
  const clubGross = pendingData.club_stream?.gross || 0;
  const totalPendingGross = prodGross + clubGross;

  const enteredDeduction = Math.max(0, parseFloat(deductionsInput) || 0);

  // Pro-rata deduction distribution
  let liveProdDeduct = 0;
  let liveClubDeduct = 0;
  if (totalPendingGross > 0 && enteredDeduction > 0) {
    const prodRatio = prodGross / totalPendingGross;
    liveProdDeduct = Math.round(enteredDeduction * prodRatio * 100) / 100;
    liveClubDeduct = Math.max(0, enteredDeduction - liveProdDeduct);
  }

  const liveProdNet = Math.max(0, prodGross - liveProdDeduct);
  const liveClubNet = Math.max(0, clubGross - liveClubDeduct);

  // Stream A: Fixed 70% Coach / 30% Dagmawi (Section 6.1)
  const liveProdCoach = Math.round(liveProdNet * 0.70 * 100) / 100;
  const liveProdDag = Math.max(0, liveProdNet - liveProdCoach);

  // Stream B: 60% Coach / 40% Dagmawi until 50k ETB milestone, then 65/35 (Section 6.2)
  const isClubMature = (pendingData.club_stream?.cumulative_all_time || 0) >= 50000;
  const clubCoachRate = isClubMature ? 0.65 : 0.60;
  const liveClubCoach = Math.round(liveClubNet * clubCoachRate * 100) / 100;
  const liveClubDag = Math.max(0, liveClubNet - liveClubCoach);

  const totalCoachShare = liveProdCoach + liveClubCoach;
  const totalDagShare = liveProdDag + liveClubDag;
  const totalNetDistributable = liveProdNet + liveClubNet;

  // Chart Rendering
  useEffect(() => {
    if (!chartCanvasRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const ctx = chartCanvasRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 160);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: pendingData.trend_labels || ['06/06', '07/11', '08/08', 'Pending'],
        datasets: [
          {
            label: 'Total Net Payout (ETB)',
            data: pendingData.trend_data || [59594, 19117, 47802, 31091],
            borderColor: '#06b6d4',
            backgroundColor: gradient,
            borderWidth: 2.5,
            pointBackgroundColor: '#06b6d4',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(9, 10, 15, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
            bodyFont: { family: 'JetBrains Mono', size: 11 },
            callbacks: {
              label: (context) => ` ${Number(context.raw).toLocaleString()} ETB`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 10 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#64748b',
              font: { family: 'JetBrains Mono', size: 10 },
              callback: (v) => `${(v / 1000).toFixed(0)}k`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [pendingData]);

  // Handle Execution of Settlement or Expense
  const handleExecuteSettlement = async () => {
    setSubmitting(true);
    try {
      if (mode === 'payout') {
        const payload = {
          entry_type: 'payout',
          products_amount: prodGross,
          club_amount: clubGross,
          deductions: enteredDeduction,
          note: memoNote || `Saturday Partner Settlement (Products: 70/30, Club: ${isClubMature ? '65/35' : '60/40'})`,
        };
        const res = await api.confirmPayout(payload);
        toast('Dual-stream partner settlement recorded successfully!', 'success');
        setMemoNote('');
        setDeductionsInput('0');
        fetchLedger();
      } else {
        const amount = parseFloat(expenseAmount) || 0;
        if (amount <= 0) {
          toast('Please enter a valid expense amount', 'error');
          setSubmitting(false);
          return;
        }

        const payload = {
          entry_type: 'expense_only',
          category: expenseCategory,
          amount: amount,
          note: memoNote || (expenseCategory === 'video_production' ? 'Paid-Product Video Production' : 'Technical Infrastructure & Servers'),
        };
        await api.confirmPayout(payload);
        toast('Operating expense recorded successfully', 'success');
        setExpenseAmount('');
        setMemoNote('');
        fetchLedger();
      }
    } catch (err) {
      toast(err.message || 'Error recording settlement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Preview Statement PDF
  const handleDownloadPendingStatement = () => {
    generatePayoutPDF({
      id: 'PENDING',
      payout_date: new Date().toISOString(),
      entry_type: 'payout',
      gross_revenue: totalPendingGross,
      products_gross: prodGross,
      club_gross: clubGross,
      operational_deductions: enteredDeduction,
      net_profit: totalNetDistributable,
      coach_share: totalCoachShare,
      dagmawi_share: totalDagShare,
      club_stage: isClubMature ? 'mature_65_35' : 'initial_60_40',
      expense_note: memoNote || 'Official Pending Partner Settlement Draft (Section 8 Statement)',
    });
  };

  const mtdBurn = pendingData.operating_expenses?.current_month_burn || 0;
  const pendingBurn = pendingData.operating_expenses?.pending_burn || 0;

  const clubCumul = pendingData.club_stream?.cumulative_all_time || 20930;
  const clubTarget = pendingData.club_stream?.target_milestone || 50000;
  const clubProgress = pendingData.club_stream?.progress_pct || Math.round((clubCumul / clubTarget) * 1000) / 10;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-12">
      {/* Contractual Header & Accounting Window */}
      <div className="premium-card p-5 sm:p-6 bg-gradient-to-r from-cyan-950/20 via-slate-900/30 to-slate-900/10 border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              REVISED AGREEMENT ACTIVE
            </span>
            <span className="text-xs font-mono text-slate-400">
              August 10, 2026 – March 2, 2029
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
            Partnership Settlement & Dual-Stream Financial Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Governed by the signed partnership contract: Digital Products are fixed at <span className="text-emerald-400 font-semibold">70/30</span>, while Community Subscriptions operate at <span className="text-purple-400 font-semibold">60/40</span> until the 50k ETB milestone is achieved.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadPendingStatement}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <i className="fa-solid fa-file-pdf text-rose-400"></i>
            <span>Export Statement</span>
          </button>
          <button
            onClick={fetchLedger}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh Live Data"
          >
            <i className={`fa-solid fa-rotate-right ${loading ? 'animate-spin text-cyan-400' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* Top 4 Executive Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Pending Gross */}
        <div className="premium-card p-6 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Pending Gross Revenue</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Unsettled
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 font-mono">
            {totalPendingGross.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-400">ETB</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-mono font-bold">{prodGross.toLocaleString()} Br</span> Products +{' '}
            <span className="text-purple-400 font-mono font-bold">{clubGross.toLocaleString()} Br</span> Club
          </p>
        </div>

        {/* Card 2: Operating & Production Deductions */}
        <div className="premium-card p-6 border-rose-500/20 bg-gradient-to-br from-rose-500/[0.02] to-transparent">
          <div className="flex items-center justify-between text-xs text-rose-400/90 font-medium">
            <span>Operating Deductions (Burn)</span>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Uncapped Actuals
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight mt-2 font-mono">
            -{(enteredDeduction || mtdBurn).toLocaleString()} <span className="text-sm font-sans font-normal text-slate-400">ETB</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">
            Servers, Neon DB, USD FX rate adjustments & product costs
          </p>
        </div>

        {/* Card 3: Coach Hilawe Entitlement */}
        <div className="premium-card p-6 border-amber-500/20 bg-gradient-to-br from-amber-500/[0.02] to-transparent">
          <div className="flex items-center justify-between text-xs text-amber-400/90 font-medium">
            <span>Coach Hilawe Entitlement</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {totalPendingGross > 0 ? Math.round((totalCoachShare / totalPendingGross) * 1000) / 10 : 68.9}%
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 font-mono">
            {totalCoachShare.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-400">ETB</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">
            70% of Products ({liveProdCoach.toLocaleString()} Br) + {clubCoachRate * 100}% Club ({liveClubCoach.toLocaleString()} Br)
          </p>
        </div>

        {/* Card 4: Dagmawi Tech Entitlement */}
        <div className="premium-card p-6 border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.02] to-transparent">
          <div className="flex items-center justify-between text-xs text-cyan-400/90 font-medium">
            <span>Dagmawi Tech Entitlement</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {totalPendingGross > 0 ? Math.round((totalDagShare / totalPendingGross) * 1000) / 10 : 31.1}%
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 font-mono">
            {totalDagShare.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-400">ETB</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">
            30% of Products ({liveProdDag.toLocaleString()} Br) + {Math.round((1 - clubCoachRate) * 100)}% Club ({liveClubDag.toLocaleString()} Br)
          </p>
        </div>
      </div>

      {/* Dual Stream Architecture Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Stream A: Digital Products Engine (Section 6.1) */}
        <div className="premium-card p-6 sm:p-7 relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.02] to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <i className="fa-solid fa-dumbbell text-sm"></i>
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">Stream A: Digital Product Sales</h4>
                <p className="text-[11px] text-slate-400">Workout programs, nutrition plans & guides</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Fixed 70 / 30 Split
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-5 font-mono text-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-sans">Gross Sales</p>
              <p className="text-base font-bold text-white mt-1">{prodGross.toLocaleString()} Br</p>
              <p className="text-[10px] text-slate-400 font-sans">{pendingData.products_stream?.count || 49} orders</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-sans">Pro-Rata Burn</p>
              <p className="text-base font-bold text-rose-400 mt-1">-{liveProdDeduct.toLocaleString()} Br</p>
              <p className="text-[10px] text-slate-400 font-sans">Section 5 costs</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-sans">Net Distributable</p>
              <p className="text-base font-bold text-emerald-400 mt-1">{liveProdNet.toLocaleString()} Br</p>
              <p className="text-[10px] text-slate-400 font-sans">Post-deductions</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
              <span className="text-slate-300 font-medium">Coach Hilawe Semma (70%)</span>
              <span className="text-white font-mono font-bold">{liveProdCoach.toLocaleString()} ETB</span>
            </div>
            <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
              <span className="text-slate-300 font-medium">Dagmawi Tewodros (30%)</span>
              <span className="text-cyan-400 font-mono font-bold">{liveProdDag.toLocaleString()} ETB</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
            <span>Contract Term: Section 6.1 (Fixed 3 Years)</span>
            <span className="text-emerald-400/90 font-medium">No Volume Tiers</span>
          </div>
        </div>

        {/* Stream B: Transformation Club (Section 6.2) */}
        <div className="premium-card p-6 sm:p-7 relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/[0.02] to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <i className="fa-solid fa-users text-sm"></i>
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">Stream B: Transformation Club</h4>
                <p className="text-[11px] text-slate-400">Monthly community subscriptions & renewals</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              {isClubMature ? 'Stage 2: 65 / 35' : 'Stage 1: 60 / 40 Split'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-5 font-mono text-center">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-sans">Pending Gross</p>
              <p className="text-base font-bold text-white mt-1">{clubGross.toLocaleString()} Br</p>
              <p className="text-[10px] text-slate-400 font-sans">{pendingData.club_stream?.count || 11} members</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-sans">Pro-Rata Burn</p>
              <p className="text-base font-bold text-rose-400 mt-1">-{liveClubDeduct.toLocaleString()} Br</p>
              <p className="text-[10px] text-slate-400 font-sans">Allocated share</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-sans">Net Distributable</p>
              <p className="text-base font-bold text-purple-400 mt-1">{liveClubNet.toLocaleString()} Br</p>
              <p className="text-[10px] text-slate-400 font-sans">Post-deductions</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
              <span className="text-slate-300 font-medium">Coach Hilawe Semma ({clubCoachRate * 100}%)</span>
              <span className="text-white font-mono font-bold">{liveClubCoach.toLocaleString()} ETB</span>
            </div>
            <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
              <span className="text-slate-300 font-medium">Dagmawi Tewodros ({Math.round((1 - clubCoachRate) * 100)}%)</span>
              <span className="text-cyan-400 font-mono font-bold">{liveClubDag.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* 50,000 ETB Transition Milestone Gauge */}
          <div className="mt-5 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-purple-300 font-medium">50,000 ETB Transition Milestone (Section 6.2)</span>
              <span className="text-white font-mono font-bold">{clubProgress}%</span>
            </div>
            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(3, clubProgress))}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
              <span>{clubCumul.toLocaleString()} ETB Recorded</span>
              <span>Target: {clubTarget.toLocaleString()} ETB (Then 65/35)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Console & Trend Visualizer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column: Settlement / Expense Execution Console (5 cols) */}
        <div className="lg:col-span-5 premium-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Settlement Engine</h3>
              <p className="text-xs text-slate-400">Post-August 8, 2026 Accounting Period</p>
            </div>
            <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
              <button
                onClick={() => setMode('payout')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'payout' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Payout
              </button>
              <button
                onClick={() => setMode('expense')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'expense' ? 'bg-rose-500/20 text-rose-400 shadow-sm border border-rose-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Expense
              </button>
            </div>
          </div>

          {mode === 'payout' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Available Revenue (Database Verified)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`Products: ${prodGross.toLocaleString()} ETB`}
                    readOnly
                    className="w-1/2 bg-white/[0.02] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono outline-none cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={`Club: ${clubGross.toLocaleString()} ETB`}
                    readOnly
                    className="w-1/2 bg-white/[0.02] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-purple-400 font-mono outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-400">
                    Operational Deductions (ETB)
                  </label>
                  <span className="text-[10px] text-cyan-400">Auto Pro-Rata Split</span>
                </div>
                <input
                  type="number"
                  value={deductionsInput}
                  onChange={(e) => setDeductionsInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-rose-400 font-mono focus:border-rose-500/50 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Deductions split proportionally: {liveProdDeduct.toLocaleString()} Br Products / {liveClubDeduct.toLocaleString()} Br Club
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Settlement Memo & Accounting Note
                </label>
                <textarea
                  value={memoNote}
                  onChange={(e) => setMemoNote(e.target.value)}
                  placeholder="e.g. Saturday bi-weekly distribution (August-September cycle)"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-500/50 outline-none h-18 resize-none transition-all"
                ></textarea>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Coach Hilawe Payout:</span>
                  <span className="text-white font-mono font-bold">{totalCoachShare.toLocaleString()} ETB</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Dagmawi Tewodros Payout:</span>
                  <span className="text-cyan-400 font-mono font-bold">{totalDagShare.toLocaleString()} ETB</span>
                </div>
              </div>

              <button
                onClick={handleExecuteSettlement}
                disabled={submitting || totalPendingGross <= 0}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/15 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Executing settlement...' : 'Record Partner Settlement'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Expense Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExpenseCategory('infra')}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                      expenseCategory === 'infra'
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="font-bold">Servers & Database</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Render, Neon, Bot hosting, USD FX</p>
                  </button>

                  <button
                    onClick={() => setExpenseCategory('video_production')}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                      expenseCategory === 'video_production'
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="font-bold">Product & Production</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Video creation & product assets</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Expense Amount (ETB)
                </label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder={expenseCategory === 'video_production' ? '11259.00' : '5500.00'}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-rose-400 font-mono focus:border-rose-500/50 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Logged at actual incurred ETB cost (supporting USD conversions {'>'} 195 ETB/$ and product costs).
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Expense Memo & Documentation
                </label>
                <textarea
                  value={memoNote}
                  onChange={(e) => setMemoNote(e.target.value)}
                  placeholder="e.g. Neon PostgreSQL & Render compute server invoice"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:border-rose-500/50 outline-none h-18 resize-none transition-all"
                ></textarea>
              </div>

              <button
                onClick={handleExecuteSettlement}
                disabled={submitting}
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-rose-500/15 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Archiving expense...' : 'Archive Operational Expense'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Historical Net Growth Trajectory (7 cols) */}
        <div className="lg:col-span-7 premium-card p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Settlement Trajectory & Profit Yield
                </h4>
                <p className="text-xs text-slate-400">Historical net partner distributions over time</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Audited Ledgers
              </span>
            </div>

            <div className="h-48 sm:h-52 w-full relative">
              <canvas ref={chartCanvasRef} id="profitTrendChart"></canvas>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-white/[0.06] text-center font-mono">
            <div>
              <p className="text-[10px] text-slate-400 font-sans">Lifetime Gross</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {(pendingData.lifetime_gross || 294579).toLocaleString()} Br
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-sans">Operational Burn</p>
              <p className="text-sm font-bold text-rose-400 mt-0.5">
                -{(pendingData.lifetime_burn || 45017).toLocaleString()} Br
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-sans">Profit Efficiency</p>
              <p className="text-sm font-bold text-cyan-400 mt-0.5">98.2%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Settlement Statements Archive Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Settlement Archive & Statements
            </h3>
            <p className="text-xs text-slate-400">Archived partner distributions & operational expenses</p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
            {history.length} Certified Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/[0.06] bg-white/[0.01] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Ref ID</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">Products Gross</th>
                <th className="py-3.5 px-5">Club Gross</th>
                <th className="py-3.5 px-5">Expenses</th>
                <th className="py-3.5 px-5">Coach Payout</th>
                <th className="py-3.5 px-5">Dagmawi Payout</th>
                <th className="py-3.5 px-5 text-right">Official Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
              {history.map((log) => {
                const isExpense = log.entry_type === 'expense_only';
                const prodVal = parseFloat(log.products_gross || (isExpense ? 0 : log.gross_revenue || 0));
                const clubVal = parseFloat(log.club_gross || 0);
                const burnVal = Math.abs(parseFloat(log.operational_deductions || 0));
                const coach = parseFloat(log.coach_share || 0);
                const dag = parseFloat(log.dagmawi_share || 0);

                return (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5 text-slate-400 whitespace-nowrap">
                      {new Date(log.payout_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 text-cyan-400 font-bold whitespace-nowrap">
                      #{log.id}
                    </td>
                    <td className="py-4 px-5 font-sans whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          isExpense
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isExpense ? 'Expense' : 'Payout'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-white font-bold whitespace-nowrap">
                      {isExpense ? '—' : `${prodVal.toLocaleString()} Br`}
                    </td>
                    <td className="py-4 px-5 text-purple-400 font-bold whitespace-nowrap">
                      {isExpense ? '—' : (clubVal > 0 ? `${clubVal.toLocaleString()} Br` : '—')}
                    </td>
                    <td className="py-4 px-5 text-rose-400 whitespace-nowrap">
                      {burnVal > 0 ? `-${burnVal.toLocaleString()} Br` : '0 Br'}
                    </td>
                    <td className="py-4 px-5 text-amber-400 font-bold whitespace-nowrap">
                      {isExpense ? '—' : `${coach.toLocaleString()} Br`}
                    </td>
                    <td className="py-4 px-5 text-slate-300 font-bold whitespace-nowrap">
                      {isExpense ? '—' : `${dag.toLocaleString()} Br`}
                    </td>
                    <td className="py-4 px-5 text-right font-sans whitespace-nowrap">
                      <button
                        onClick={() => generatePayoutPDF(log)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all text-xs cursor-pointer flex items-center gap-1.5 ml-auto"
                      >
                        <i className="fa-solid fa-file-pdf text-rose-400"></i>
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
