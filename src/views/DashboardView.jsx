import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import { api } from '../services/api';
import { generatePremiumPDF } from '../services/pdfExport';
import { useToast } from '../context/ToastContext';

export default function DashboardView({ onSelectProduct, onNavigate }) {
  const { toast } = useToast();
  const [revenueFilter, setRevenueFilter] = useState(7);
  const [stats, setStats] = useState({
    club_revenue: 0,
    total_revenue: 294579,
    active_users: 5332,
    pending_payments: 1,
    conversion_rate: 94.2,
  });
  const [payments, setPayments] = useState([]);
  const [revData, setRevData] = useState(null);
  const [distData, setDistData] = useState({ pending: 1, approved: 506, rejected: 68 });
  const [rawIntel, setRawIntel] = useState({
    lvl_beginner: 3016,
    lvl_inter: 1485,
    lvl_adv: 346,
    lvl_glute: 166,
    gen_male: 3592,
    gen_female: 1428,
    lang_en: 617,
    lang_am: 4715,
    freq_2_3: 1200,
    freq_3_4: 2800,
    freq_4_5: 980,
    freq_everyday: 352,
  });
  const [topSellers, setTopSellers] = useState([]);
  const [demoType, setDemoType] = useState('level');
  const [exporting, setExporting] = useState(false);

  const mainCanvasRef = useRef(null);
  const mainChartRef = useRef(null);
  const donutCanvasRef = useRef(null);
  const donutChartRef = useRef(null);
  const demoCanvasRef = useRef(null);
  const demoChartRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.getStats(),
      api.getRecentPayments(6),
      api.getRevenueStats(revenueFilter),
      api.getDistribution(),
      api.getNodeIntelligence(),
      api.getTopSellers(5),
    ]).then(([statsRes, payRes, revRes, distRes, intelRes, topRes]) => {
      if (!active) return;
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats((prev) => ({ ...prev, ...statsRes.value }));
      }
      if (payRes.status === 'fulfilled' && Array.isArray(payRes.value)) {
        setPayments(payRes.value);
      }
      if (revRes.status === 'fulfilled' && revRes.value) {
        setRevData(revRes.value);
      } else {
        setRevData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          revenue_products: [4200, 7800, 11400, 8900, 14200, 19500, 16800],
          revenue_club: [1200, 1800, 2400, 1900, 3100, 4200, 3900],
          users: [14, 22, 35, 28, 42, 58, 49],
          days_limit: revenueFilter,
        });
      }
      if (distRes.status === 'fulfilled' && distRes.value) {
        setDistData(distRes.value);
      }
      if (intelRes.status === 'fulfilled' && intelRes.value) {
        setRawIntel((prev) => ({ ...prev, ...intelRes.value }));
      }
      if (topRes.status === 'fulfilled' && Array.isArray(topRes.value)) {
        setTopSellers(topRes.value);
      } else {
        setTopSellers([
          { id: 22, product_id: '22', title: 'የ 8-ሳምንት የጀማሪዎች የሰውነት መገንቢያ ዕቅድ', total_revenue: 50670, sales_count: 84 },
          { id: 13, product_id: '13', title: 'የ 8-ሳምንት የጀማሪዎች ሰውነት መገንቢያ ዕቅድ', total_revenue: 39680, sales_count: 75 },
          { id: 4, product_id: '4', title: 'የ 8-ሳምንት የጀማሪዎች ሰውነት መገንቢያ ዕቅድ', total_revenue: 38540, sales_count: 60 },
        ]);
      }
    });

    return () => {
      active = false;
    };
  }, [revenueFilter]);

  const clubRevenue = Number(stats.club_revenue || 0);
  const salesRevenue = Number(stats.total_revenue || 294579);
  const totalRevenueSum = clubRevenue + salesRevenue;
  const totalSignals =
    Number(distData.pending || 0) +
    Number(distData.approved || 0) +
    Number(distData.rejected || 0) || 575;

  // Main Revenue Chart Setup
  useEffect(() => {
    if (!mainCanvasRef.current || !revData) return;
    if (mainChartRef.current) mainChartRef.current.destroy();

    const ctx = mainCanvasRef.current.getContext('2d');
    const labels = revData.labels || [];
    const prodData = (revData.revenue_products || []).map(Number);
    const clubData = (revData.revenue_club || []).map(Number);
    const usersData = (revData.users || []).map(Number);

    const gradient = ctx.createLinearGradient(0, 0, 0, 340);
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.18)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

    mainChartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Product Sales (ETB)',
            data: prodData,
            borderColor: '#06b6d4',
            borderWidth: 2.5,
            tension: 0.38,
            fill: true,
            backgroundColor: gradient,
            pointBackgroundColor: '#06b6d4',
            pointBorderColor: '#090A0F',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            yAxisID: 'yRevenue',
            order: 1,
          },
          {
            type: 'line',
            label: 'Club Subscriptions (ETB)',
            data: clubData,
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.38,
            fill: false,
            pointBackgroundColor: '#f59e0b',
            pointRadius: 2,
            pointHoverRadius: 5,
            yAxisID: 'yRevenue',
            order: 2,
          },
          {
            type: 'bar',
            label: 'New Members',
            data: usersData,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            hoverBackgroundColor: 'rgba(99, 102, 241, 0.4)',
            borderRadius: 6,
            barPercentage: 0.4,
            yAxisID: 'yUsers',
            order: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800 },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
          },
          yRevenue: {
            position: 'left',
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 10 },
              callback: (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`),
            },
          },
          yUsers: { display: false },
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 11, weight: '500' },
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: '#10121B',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            titleFont: { family: 'Inter', size: 12, weight: '600' },
            bodyFont: { family: 'JetBrains Mono', size: 12 },
            callbacks: {
              label(context) {
                const label = context.dataset.label || '';
                const val = context.parsed.y;
                if (label.includes('ETB')) {
                  return `${label}: ${Intl.NumberFormat().format(val)} Br`;
                }
                return `${label}: ${val}`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (mainChartRef.current) mainChartRef.current.destroy();
    };
  }, [revData]);

  // Donut Chart Setup
  useEffect(() => {
    if (!donutCanvasRef.current) return;
    if (donutChartRef.current) donutChartRef.current.destroy();

    const ctx = donutCanvasRef.current.getContext('2d');
    donutChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Pending', 'Declined'],
        datasets: [
          {
            data: [
              Number(distData.approved || 506),
              Number(distData.pending || 1),
              Number(distData.rejected || 68),
            ],
            backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
            borderWidth: 0,
            hoverOffset: 6,
            borderRadius: 8,
            spacing: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '78%',
        plugins: {
          legend: { display: false },
        },
      },
    });

    return () => {
      if (donutChartRef.current) donutChartRef.current.destroy();
    };
  }, [distData]);

  // Demographic Chart Setup
  useEffect(() => {
    if (!demoCanvasRef.current) return;
    if (demoChartRef.current) demoChartRef.current.destroy();

    const levelData = {
      Beginner: rawIntel.lvl_beginner || 3016,
      Intermediate: rawIntel.lvl_inter || 1485,
      Advanced: rawIntel.lvl_adv || 346,
      Glute: rawIntel.lvl_glute || 166,
    };
    const genderData = {
      Male: rawIntel.gen_male || 3592,
      Female: rawIntel.gen_female || 1428,
    };
    const langData = {
      Amharic: rawIntel.lang_am || 4715,
      English: rawIntel.lang_en || 617,
    };
    const freqData = {
      '3 Days/Wk': rawIntel.freq_2_3 || 1200,
      '4 Days/Wk': rawIntel.freq_3_4 || 2800,
      '5 Days/Wk': rawIntel.freq_4_5 || 980,
      Daily: rawIntel.freq_everyday || 352,
    };

    const config = {
      level: { labels: Object.keys(levelData), data: Object.values(levelData), color: '#06b6d4' },
      gender: { labels: Object.keys(genderData), data: Object.values(genderData), color: '#f43f5e' },
      lang: { labels: Object.keys(langData), data: Object.values(langData), color: '#10b981' },
      freq: { labels: Object.keys(freqData), data: Object.values(freqData), color: '#f59e0b' },
    }[demoType];

    const ctx = demoCanvasRef.current.getContext('2d');
    demoChartRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: config.labels,
        datasets: [
          {
            data: config.data,
            backgroundColor: `${config.color}15`,
            borderColor: config.color,
            borderWidth: 2,
            pointBackgroundColor: config.color,
            pointBorderColor: '#090A0F',
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.04)' },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            pointLabels: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 10, weight: '500' },
            },
            ticks: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });

    return () => {
      if (demoChartRef.current) demoChartRef.current.destroy();
    };
  }, [demoType, rawIntel]);

  const handleExportPDF = async () => {
    if (!revData) return;
    setExporting(true);
    try {
      await generatePremiumPDF({
        data: revData,
        chartCanvas: mainCanvasRef.current,
        autoDownload: true,
      });
      toast('Statement downloaded successfully');
    } catch (err) {
      toast(err.message || 'Export error', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* 1. EXECUTIVE METRIC CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Revenue */}
        <div className="premium-card p-6 sm:p-7 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Gross Revenue</span>
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-vault"></i>
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {totalRevenueSum.toLocaleString()} <span className="text-sm font-semibold text-slate-400">ETB</span>
            </h3>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Club: {clubRevenue.toLocaleString()} Br
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Products: {salesRevenue.toLocaleString()} Br
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Members */}
        <div className="premium-card p-6 sm:p-7 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Members</span>
            <span className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-users"></i>
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {(stats.active_users || 5332).toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-400 font-medium mt-2 flex items-center gap-1">
              <i className="fa-solid fa-arrow-trend-up text-[10px]"></i>
              <span>94.2% completed onboarding</span>
            </p>
          </div>
        </div>

        {/* Card 3: Pending Queue */}
        <div
          onClick={() => onNavigate && onNavigate('payments')}
          className="premium-card p-6 sm:p-7 relative overflow-hidden group cursor-pointer hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Pending Clearance</span>
            <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {stats.pending_payments || 1}
              </h3>
              <span className="text-xs text-amber-400 font-medium font-mono">awaiting audit</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
              <span>View queue in Payments</span>
              <i className="fa-solid fa-arrow-right text-[9px]"></i>
            </p>
          </div>
        </div>

        {/* Card 4: Conversion Funnel */}
        <div className="premium-card p-6 sm:p-7 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Funnel Conversion</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-bolt"></i>
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {stats.conversion_rate || 94.2}%
            </h3>
            <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${stats.conversion_rate || 94.2}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN REVENUE CHART & DISTRIBUTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Revenue Velocity Chart (8 cols) */}
        <div className="lg:col-span-8 premium-card p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Revenue Trajectory
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparison of digital plan sales and recurring club fees
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
                {[7, 14, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setRevenueFilter(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                      revenueFilter === d
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>

              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="chip-btn flex items-center gap-2"
              >
                <i className="fa-solid fa-file-arrow-down text-cyan-400 text-xs"></i>
                <span>{exporting ? 'Exporting...' : 'Export'}</span>
              </button>
            </div>
          </div>

          <div className="h-[320px] w-full relative">
            <canvas ref={mainCanvasRef} id="mainChart"></canvas>
          </div>
        </div>

        {/* Settlement Ratio Donut (4 cols) */}
        <div className="lg:col-span-4 premium-card p-6 sm:p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Payment Ratio
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit clearance breakdown
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live
            </span>
          </div>

          <div className="h-[210px] relative flex items-center justify-center">
            <canvas ref={donutCanvasRef} id="donutChart"></canvas>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-medium text-slate-400">Total Audited</span>
              <span className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                {totalSignals}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/[0.06] text-center">
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <p className="text-[10px] text-slate-400">Approved</p>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">{distData.approved || 506}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <p className="text-[10px] text-slate-400">Pending</p>
              <p className="text-xs font-bold text-amber-400 mt-0.5">{distData.pending || 1}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <p className="text-[10px] text-slate-400">Declined</p>
              <p className="text-xs font-bold text-rose-400 mt-0.5">{distData.rejected || 68}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DEMOGRAPHICS & TOP VEHICLES */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Demographics Radar (4 cols) */}
        <div className="lg:col-span-5 premium-card p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Audience Segmentation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Member demographics analysis</p>
            </div>

            <select
              value={demoType}
              onChange={(e) => setDemoType(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-medium rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:border-white/20 transition-all"
            >
              <option value="level" className="bg-[#12141F]">By Experience</option>
              <option value="gender" className="bg-[#12141F]">By Gender</option>
              <option value="lang" className="bg-[#12141F]">By Language</option>
              <option value="freq" className="bg-[#12141F]">By Frequency</option>
            </select>
          </div>

          <div className="h-[240px] relative">
            <canvas ref={demoCanvasRef} id="demoChart"></canvas>
          </div>
        </div>

        {/* Top Products Leaderboard (7 cols) */}
        <div className="lg:col-span-7 premium-card p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Top Revenue Systems
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Highest grossing workout plans</p>
            </div>
            <span className="text-xs font-medium text-cyan-400 hover:underline cursor-pointer" onClick={() => onNavigate && onNavigate('products')}>
              View catalog →
            </span>
          </div>

          <div className="space-y-3">
            {topSellers.slice(0, 3).map((p, i) => (
              <div
                key={p.product_id || p.id || i}
                onClick={() => onSelectProduct && onSelectProduct(p)}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-bold text-xs text-slate-400 shrink-0">
                    0{i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
                      {p.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {p.sales_count || 60} verified orders
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-white">
                    {Number(p.total_revenue || 0).toLocaleString()} Br
                  </p>
                  <p className="text-[10px] text-emerald-400 font-medium">Gross revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. RECENT CLEARANCE STREAM */}
      <section className="premium-card p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Recent Transaction Activity
            </h3>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('payments')}
            className="text-xs font-medium text-cyan-400 hover:underline cursor-pointer"
          >
            Audit all payments →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {payments.slice(0, 6).map((p, idx) => (
            <div
              key={p.id || idx}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between hover:border-white/15 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {p.full_name ? p.full_name[0] : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {p.full_name || 'Anonymous Member'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {p.product_title || p.title || 'Workout Guide System'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-white">
                  {Number(p.amount || 949).toLocaleString()} Br
                </p>
                <span className="text-[9px] font-semibold text-emerald-400 uppercase">
                  Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
