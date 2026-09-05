import React from 'react';

export default function KPICard({
  label,
  value,
  subvalue,
  badge,
  badgePositive = true,
  color = 'brand-gold',
  icon = 'fa-coins',
  progress = null,
  footnote = null
}) {
  const colorStyles = {
    'brand-gold': {
      border: 'border-t-2 border-brand-gold',
      bg: 'bg-gradient-to-b from-brand-gold/10 to-transparent',
      text: 'text-brand-gold',
      glow: 'glow-gold',
    },
    'brand-cyan': {
      border: 'border-t-2 border-brand-cyan',
      bg: 'bg-gradient-to-b from-brand-cyan/10 to-transparent',
      text: 'text-brand-cyan',
      glow: 'glow-cyan',
    },
    'brand-emerald': {
      border: 'border-t-2 border-brand-emerald',
      bg: 'bg-gradient-to-b from-brand-emerald/10 to-transparent',
      text: 'text-brand-emerald',
      glow: 'glow-emerald',
    },
    'brand-rose': {
      border: 'border-t-2 border-brand-rose',
      bg: 'bg-gradient-to-b from-brand-rose/10 to-transparent',
      text: 'text-brand-rose',
      glow: '',
    },
    'slate': {
      border: 'border border-white/10',
      bg: 'bg-white/[0.02]',
      text: 'text-white',
      glow: '',
    }
  };

  const currentTheme = colorStyles[color] || colorStyles.slate;

  return (
    <div className={`glass-ui p-6 sm:p-8 rounded-[2rem] relative overflow-hidden group shadow-xl transition-all duration-300 hover:border-white/20 ${currentTheme.border} ${currentTheme.bg}`}>
      <p className={`font-mono text-[10px] uppercase tracking-widest font-bold ${currentTheme.text}`}>
        {label}
      </p>

      <div className="flex items-baseline gap-2 mt-4">
        <h3 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter">
          {value}
        </h3>
        {subvalue && (
          <span className="text-xs font-mono text-slate-500 uppercase font-bold">
            {subvalue}
          </span>
        )}
      </div>

      {progress !== null && (
        <div className="mt-4 w-full bg-white/5 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${color === 'brand-cyan' ? 'bg-brand-cyan' : 'bg-brand-gold'}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      )}

      {badge && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`text-[10px] font-mono font-bold ${
              badgePositive ? 'text-brand-emerald' : 'text-brand-rose'
            }`}
          >
            {badge}
          </span>
          <div className="flex-1 h-[1px] bg-white/10"></div>
        </div>
      )}

      {footnote && (
        <p className="text-[9px] font-mono text-slate-500 uppercase mt-2">
          {footnote}
        </p>
      )}

      {icon && (
        <i
          className={`fa-solid ${icon} absolute -right-3 -bottom-3 text-6xl text-white/[0.04] group-hover:rotate-12 transition-transform duration-500 pointer-events-none`}
        ></i>
      )}
    </div>
  );
}
