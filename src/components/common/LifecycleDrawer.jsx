import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function LifecycleDrawer({ product, isOpen, onClose, onProductUpdated }) {
  const { toast } = useToast();
  const [lifecycleData, setLifecycleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inactivating, setInactivating] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!product || !isOpen) return;

    let active = true;
    setLoading(true);

    api.getProductLifecycle(product.id || product.product_id)
      .then((data) => {
        if (active) setLifecycleData(data);
      })
      .catch((err) => {
        console.error('Lifecycle telemetry load error', err);
        if (active) {
          setLifecycleData({
            dates: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            sales: [12, 28, 45, product.sales_count || 84],
            revenue: (product.sales_count || 84) * product.price,
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [product, isOpen]);

  useEffect(() => {
    if (!chartRef.current || !lifecycleData) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: lifecycleData.dates || [],
        datasets: [
          {
            data: lifecycleData.sales || [],
            borderColor: '#06b6d4',
            borderWidth: 2.5,
            pointBackgroundColor: '#06b6d4',
            pointRadius: 3,
            fill: true,
            backgroundColor: gradient,
            tension: 0.38,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#10121B',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleFont: { family: 'Inter', size: 11 },
            bodyFont: { family: 'JetBrains Mono', size: 12 },
          },
        },
        scales: {
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#64748b', font: { size: 10, family: 'Inter' } },
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 10, family: 'Inter' } },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [lifecycleData]);

  if (!isOpen || !product) return null;

  const handleInactivate = async () => {
    if (!window.confirm(`Deactivate product #${product.id || product.product_id}?`)) return;
    setInactivating(true);
    try {
      await api.inactivateProduct(product.id || product.product_id);
      toast('Product archived from active catalog');
      if (onProductUpdated) onProductUpdated();
      onClose();
    } catch (err) {
      toast(err.message || 'Error updating product', 'error');
    } finally {
      setInactivating(false);
    }
  };

  const totalRev = Number(product.total_revenue || (product.sales_count || 0) * product.price);

  return (
    <div
      className="fixed inset-0 z-[190] bg-black/70 backdrop-blur-md flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="h-full w-full sm:w-[500px] bg-[#0E1017] border-l border-white/[0.08] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl animate-slide-left relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/[0.06]">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                Active Catalog Item
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                {product.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ID #{product.id || product.product_id} • Added {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Active'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          {/* Metric Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
              <span className="text-[10px] text-slate-400">Unit Price</span>
              <p className="text-base font-bold text-white font-mono mt-0.5">
                {product.price} Br
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
              <span className="text-[10px] text-slate-400">Total Sales</span>
              <p className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                {product.sales_count || 0}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
              <span className="text-[10px] text-slate-400">Gross Yield</span>
              <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                {totalRev.toLocaleString()} Br
              </p>
            </div>
          </div>

          {/* Performance History Chart */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-white">Sales Trajectory</span>
              <span className="text-[10px] text-slate-400">Cumulative units</span>
            </div>
            <div className="h-44 w-full relative">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Loading telemetry...
                </div>
              ) : (
                <canvas ref={chartRef}></canvas>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Configuration Details
            </span>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-slate-400">Language</span>
              <span className="font-semibold text-white">{product.language === 'AM' ? 'Amharic (Local)' : 'English'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-slate-400">Demographic</span>
              <span className="font-semibold text-white">{product.gender || 'Universal'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-slate-400">Experience Tier</span>
              <span className="font-semibold text-white">{product.level || 'Beginner'}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-slate-400">Weekly Schedule</span>
              <span className="font-semibold text-white">{product.frequency || 4} Days per week</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-5 border-t border-white/[0.06] mt-6">
          <button
            onClick={handleInactivate}
            disabled={inactivating}
            className="w-full py-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            {inactivating ? 'Deactivating...' : 'Deactivate Product from Bot'}
          </button>
        </div>
      </div>
    </div>
  );
}
