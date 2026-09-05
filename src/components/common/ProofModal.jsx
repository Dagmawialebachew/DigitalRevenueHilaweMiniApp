import React from 'react';

export default function ProofModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[210] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition-all cursor-pointer z-10"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>

      <div
        className="max-w-3xl w-full max-h-[85vh] bg-[#10121B] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">Payment Receipt Audit</h4>
            <p className="text-xs text-slate-400 mt-0.5">Verification of member transfer slip</p>
          </div>
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
          >
            <span>Open full image</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </a>
        </div>

        <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/40">
          <img
            src={imageUrl}
            alt="Payment Receipt"
            className="max-w-full max-h-[70vh] object-contain rounded-2xl border border-white/[0.05]"
            onError={(e) => {
              e.target.src = 'https://placehold.co/600x800/10121B/38bdf8?text=RECEIPT+OFFLINE';
            }}
          />
        </div>
      </div>
    </div>
  );
}
