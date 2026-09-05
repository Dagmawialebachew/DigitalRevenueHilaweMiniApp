import React from 'react';

export default function Header({ currentView, onOpenDeployModal }) {
  const titles = {
    dashboard: { title: 'Executive Overview', desc: 'Real-time performance metrics and revenue analytics' },
    payments: { title: 'Payment Clearance', desc: 'Audit, verify, and reconcile transaction receipts' },
    products: { title: 'Product Suite', desc: 'Manage digital workout systems and active catalogs' },
    testimonials: { title: 'Member Stories', desc: 'Verified customer feedback and sentiment scores' },
    ledger: { title: 'Partner Settlement', desc: 'Net revenue distribution and financial statement archive' },
  };

  const current = titles[currentView] || { title: 'Control Center', desc: 'System management' };

  return (
    <header className="py-4 md:py-6 px-4 sm:px-8 border-b border-white/[0.04] bg-[#090A0F]/60 backdrop-blur-xl sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
          {current.title}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {current.desc}
        </p>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>5,332 Members Active</span>
        </div>

        <button
          onClick={onOpenDeployModal}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/15 transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          <span>Deploy Product</span>
        </button>
      </div>
    </header>
  );
}
