import React from 'react';

export default function Sidebar({ currentView, setView, pendingCount = 1 }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: 'fa-chart-pie' },
    { id: 'payments', label: 'Payments', icon: 'fa-receipt', badge: pendingCount > 0 ? pendingCount : null },
    { id: 'products', label: 'Products', icon: 'fa-cubes' },
    { id: 'testimonials', label: 'Feedback', icon: 'fa-star' },
    { id: 'ledger', label: 'Financials', icon: 'fa-wallet' },
  ];

  return (
    <>
      {/* --- DESKTOP SLEEK SIDEBAR --- */}
      <aside className="hidden md:flex w-64 fixed h-screen bg-[#0C0E16]/80 backdrop-blur-2xl border-r border-white/[0.06] flex-col z-[150] select-none">
        {/* Brand Header */}
        <div className="p-7 flex items-center justify-between border-b border-white/[0.04]">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-600/30 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <span className="font-extrabold text-amber-400 text-sm tracking-tighter">H</span>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Hilawe <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">PRO</span>
              </h1>
              <p className="text-[10px] text-slate-500 tracking-wider uppercase font-mono mt-0.5">
                Revenue Suite
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Main Menu
          </p>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer text-left text-xs font-medium group ${
                  isActive
                    ? 'bg-white/[0.08] text-white shadow-sm border border-white/[0.08]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <i
                    className={`fa-solid ${item.icon} w-4 text-center text-sm transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  ></i>
                  <span className="tracking-wide">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer User Profile */}
        <div className="p-4 border-t border-white/[0.04]">
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-black">
                H
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Coach Hilawe</p>
                <p className="text-[10px] text-slate-500 truncate">Administrator</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
          </div>
        </div>
      </aside>

      {/* --- MOBILE REFINED FLOATING BOTTOM COMMAND DOCK --- */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-[150] bg-[#10121B]/90 backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-1.5 shadow-2xl shadow-black/80 flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white/10 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-sm`}></i>
              <span className="text-[9px] font-semibold tracking-tight">
                {item.label}
              </span>

              {item.badge && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
