import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = `sig-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[250] flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const colorClass = isSuccess ? 'border-brand-cyan/40' : 'border-brand-rose/40';
          const iconColor = isSuccess ? 'text-brand-cyan' : 'text-brand-rose';
          const icon = isSuccess ? 'fa-square-check' : 'fa-triangle-exclamation';

          return (
            <div
              key={t.id}
              onClick={() => removeToast(t.id)}
              className={`glass-ui pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl border ${colorClass} shadow-2xl animate-slide-up transition-all duration-300 cursor-pointer`}
            >
              <div className={`${iconColor} text-lg animate-pulse`}>
                <i className={`fa-solid ${icon}`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-white truncate">
                  {t.message}
                </p>
                <p className="font-mono text-[8px] uppercase text-slate-500">
                  {isSuccess ? 'System Link: Nominal' : 'Telemetry Flagged'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
