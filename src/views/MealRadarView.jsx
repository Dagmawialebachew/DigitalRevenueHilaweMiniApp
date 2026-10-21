import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function MealRadarView() {
  const { toast } = useToast();
  const [hours, setHours] = useState(24);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'online' | 'checkout'
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
            title: 'Radar Synchronized',
            message: `Telemetry updated. ${res.summary.active_online} users active in last 10 minutes.`,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load meal telemetry', err);
      if (showToastNotice) {
        toast?.({
          type: 'error',
          title: 'Sync Failed',
          message: 'Unable to reach telemetry stream.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [hours, toast]);

  useEffect(() => {
    fetchTelemetry(false);
  }, [fetchTelemetry]);

  const filteredUsers = (data.users || []).filter((u) => {
    if (filterMode === 'online') return u.is_online;
    if (filterMode === 'checkout') {
      return (
        u.stage === 'CHECKOUT' ||
        u.stage === 'PAYMENT' ||
        u.current_step?.includes('BANK') ||
        u.payment_status === 'PENDING'
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* --- TOP CONTROL BAR --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/30">
            <i className="fa-solid fa-satellite-dish text-cyan-400 text-base animate-pulse"></i>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#0C0E16]"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Meal Plan Live Control Radar
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Zero-lag client telemetry & real-time funnel drop-off monitor
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Time Window Selector */}
          <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/[0.08]">
            {[
              { label: '2 Hours', value: 2 },
              { label: 'Today (24h)', value: 24 },
              { label: '7 Days', value: 168 },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setHours(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  hours === t.value
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
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
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] active:scale-95 text-white text-xs font-semibold border border-white/[0.1] transition-all cursor-pointer disabled:opacity-50"
          >
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin text-cyan-400' : ''}`}></i>
            <span>Refresh Radar</span>
          </button>
        </div>
      </div>

      {/* --- KPI SUMMARY METRICS --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-3xl bg-[#0F111D]/90 border border-white/[0.06] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Active Now (10m)
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {data.summary.active_online}
            </span>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Currently interacting</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-3xl bg-[#0F111D]/90 border border-white/[0.06] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Total Intakes
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {data.summary.total_opened}
            </span>
            <span className="text-xs text-slate-400">clients</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">In selected window</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-3xl bg-[#0F111D]/90 border border-white/[0.06] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Top Friction Point
          </p>
          <div className="flex items-baseline gap-2 mt-2 truncate">
            <span className="text-lg font-bold text-rose-300 truncate" title={data.summary.dropoff_point}>
              {data.summary.dropoff_point || 'None Detected'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Highest user abandonment</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-3xl bg-[#0F111D]/90 border border-white/[0.06] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Paid Conversion
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {data.summary.conversion_rate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">End-to-end checkout rate</p>
        </div>
      </div>

      {/* --- FUNNEL STAGES VISUALIZER --- */}
      <div className="p-6 rounded-3xl bg-[#0F111D]/90 border border-white/[0.06] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-filter text-cyan-400 text-xs"></i>
              Customer Conversion Funnel & Drop-Off
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Drop-off percentages show exact drop from preceding step
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {data.funnel_steps?.length || 0} stages tracked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(data.funnel_steps || []).map((step, idx) => {
            const isTopDrop = data.summary.dropoff_point === step.name;
            return (
              <div
                key={step.id || idx}
                className={`p-4 rounded-2xl border transition-all ${
                  isTopDrop
                    ? 'bg-rose-500/[0.04] border-rose-500/30 shadow-lg shadow-rose-500/5'
                    : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white/[0.04] text-slate-300 flex items-center justify-center text-[10px] font-bold font-mono">
                      {idx + 1}
                    </span>
                    <i className={`fa-solid ${step.icon || 'fa-circle'} text-xs text-cyan-400`}></i>
                  </div>
                  {isTopDrop && (
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      HIGH DROP
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-white truncate" title={step.name}>
                  {step.name}
                </p>

                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl font-bold font-mono text-white">
                    {step.count}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {step.pct_of_total}% of all
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTopDrop ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, step.pct_of_total))}%` }}
                  ></div>
                </div>

                {idx > 0 && (
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono">
                    <span>Drop:</span>
                    <span className={step.dropoff_pct > 30 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {step.dropoff_pct}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- LIVE USER MOVEMENT RADAR FEED --- */}
      <div className="p-6 rounded-3xl bg-[#0F111D]/90 border border-white/[0.06] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-users-viewfinder text-cyan-400 text-xs"></i>
              Live Customer Session Radar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Granular real-time positions of clients navigating the meal plan flow
            </p>
          </div>

          {/* User Filters */}
          <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/[0.08] text-xs">
            {[
              { id: 'all', label: 'All Users' },
              { id: 'online', label: 'Active Online' },
              { id: 'checkout', label: 'Checkout / Payment' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id)}
                className={`px-3 py-1 rounded-xl transition-all ${
                  filterMode === f.id
                    ? 'bg-white/[0.1] text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table / Feed */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 pl-3">Client</th>
                <th className="pb-3">Status / Recency</th>
                <th className="pb-3">Current Step / Stage</th>
                <th className="pb-3">Profile / Goal</th>
                <th className="pb-3">Country</th>
                <th className="pb-3 pr-3 text-right">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No users matching the active filter in this time window.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  return (
                    <tr
                      key={user.telegram_id || idx}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Client Name & ID */}
                      <td className="py-3.5 pl-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center font-bold text-[11px] text-cyan-300">
                            {(user.full_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                              {user.full_name || `User ${user.telegram_id}`}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500">
                              {user.username ? `@${user.username}` : `ID: ${user.telegram_id}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status / Recency */}
                      <td className="py-3.5">
                        {user.is_online ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Online Now
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            {user.last_active_seconds_ago !== undefined && user.last_active_seconds_ago < 3600
                              ? `${Math.floor(user.last_active_seconds_ago / 60)}m ago`
                              : user.last_active_seconds_ago !== undefined && user.last_active_seconds_ago < 86400
                              ? `${Math.floor(user.last_active_seconds_ago / 3600)}h ago`
                              : 'Earlier'}
                          </span>
                        )}
                      </td>

                      {/* Current Step / Stage */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold bg-white/[0.04] text-cyan-300 border border-white/[0.06]">
                            {user.stage || 'INTAKE'}
                          </span>
                          <span className="text-slate-300 text-[11px] truncate max-w-[140px]" title={user.current_step}>
                            {user.current_step || 'In Progress'}
                          </span>
                        </div>
                      </td>

                      {/* Profile / Goal */}
                      <td className="py-3.5">
                        <div className="text-[11px] text-slate-300">
                          <span>{user.answers_summary || 'General Fitness'}</span>
                          {user.target_kcal && (
                            <span className="block text-[10px] font-mono text-amber-400">
                              {user.target_kcal} kcal / day
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Country */}
                      <td className="py-3.5">
                        <span className="text-slate-400 text-[11px] font-mono">
                          {user.country || 'ETHIOPIA'}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 pr-3 text-right">
                        {user.payment_status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <i className="fa-solid fa-check text-[9px]"></i> Paid
                          </span>
                        ) : user.payment_status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <i className="fa-solid fa-clock text-[9px]"></i> Review
                          </span>
                        ) : user.stage === 'CHECKOUT' || user.stage === 'PAYMENT' ? (
                          <span className="text-rose-400 text-[10px] font-mono">
                            Pending Proof
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
