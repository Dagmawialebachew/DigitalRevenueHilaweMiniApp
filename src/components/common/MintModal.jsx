import React, { useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function MintModal({ isOpen, onClose, onProductCreated }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    price: '949',
    language: 'AM',
    gender: 'MALE',
    level: 'Beginner',
    frequency: '4',
    file_id: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createProduct({
        title: formData.title,
        price: parseFloat(formData.price),
        language: formData.language,
        gender: formData.gender,
        level: formData.level,
        frequency: parseInt(formData.frequency, 10),
        telegram_file_id: formData.file_id,
      });
      toast('Product deployed to active catalog');
      if (onProductCreated) onProductCreated();
      onClose();
    } catch (err) {
      toast(err.message || 'Deployment error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[180] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#12141F] border border-white/[0.08] w-full max-w-lg p-6 sm:p-8 rounded-3xl relative shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-white tracking-tight">Deploy Digital Product</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure a new training guide or nutrition plan for the Telegram bot
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Program Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. የ 8-ሳምንት የጀማሪዎች ሰውነት መገንቢያ ዕቅድ"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Access Fee (ETB)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="949"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-cyan-500/50 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Language
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
              >
                <option value="AM" className="bg-[#12141F]">Amharic (Local)</option>
                <option value="EN" className="bg-[#12141F]">English (Global)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Demographic
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                <option value="MALE" className="bg-[#12141F]">Male</option>
                <option value="FEMALE" className="bg-[#12141F]">Female</option>
                <option value="ALL" className="bg-[#12141F]">Universal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Experience Tier
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                <option value="Beginner" className="bg-[#12141F]">Beginner</option>
                <option value="Intermediate" className="bg-[#12141F]">Intermediate</option>
                <option value="Advanced" className="bg-[#12141F]">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Weekly Days
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                <option value="3" className="bg-[#12141F]">3 Days</option>
                <option value="4" className="bg-[#12141F]">4 Days</option>
                <option value="5" className="bg-[#12141F]">5 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Telegram File Attachment ID
            </label>
            <input
              type="text"
              name="file_id"
              value={formData.file_id}
              onChange={handleChange}
              placeholder="BQACAgQAAxkBAAE..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 outline-none focus:border-cyan-500/50 transition-all"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/15 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Publishing plan...' : 'Publish Product to Telegram Bot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
