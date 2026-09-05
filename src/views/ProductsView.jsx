import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ProductsView({ onSelectProduct, onOpenDeployModal }) {
  const { toast } = useToast();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    language: 'ALL',
    gender: 'ALL',
    frequency: 'ALL',
    search: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts(100, 0);
      setAllProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Products fetch error', err);
      // Fallback
      setAllProducts([
        { id: 22, product_id: '22', title: 'የ 8-ሳምንት የጀማሪዎች የሰውነት መገንቢያ ዕቅድ', language: 'AM', gender: 'MALE', level: 'Beginner', frequency: 4, price: 949, sales_count: 84, total_revenue: 50670 },
        { id: 13, product_id: '13', title: 'የ 8-ሳምንት የጀማሪዎች ሰውነት መገንቢያ ዕቅድ', language: 'AM', gender: 'MALE', level: 'Beginner', frequency: 3, price: 949, sales_count: 75, total_revenue: 39680 },
        { id: 4, product_id: '4', title: 'የ 8-ሳምንት የጀማሪዎች ሰውነት መገንቢያ ዕቅድ', language: 'AM', gender: 'MALE', level: 'Beginner', frequency: 4, price: 949, sales_count: 60, total_revenue: 38540 },
        { id: 23, product_id: '23', title: 'የ 8-ሳምንት የ መካከለኛ-ሰውነት መገንቢያ ዕቅድ', language: 'AM', gender: 'MALE', level: 'Intermediate', frequency: 4, price: 949, sales_count: 72, total_revenue: 38534 },
        { id: 14, product_id: '14', title: 'የ 8-ሳምንት የ መካከለኛ-ሰውነት መገንቢያ', language: 'AM', gender: 'MALE', level: 'Intermediate', frequency: 4, price: 949, sales_count: 50, total_revenue: 29654 },
        { id: 24, product_id: '24', title: 'የ 8-ሳምንት አድቫንስድ-ሰውነት መገንቢያ ዕቅድ', language: 'AM', gender: 'MALE', level: 'Advanced', frequency: 5, price: 949, sales_count: 24, total_revenue: 15628 },
        { id: 10, product_id: '10', title: 'THE 8-WEEK INTERMEDIATE RESILIENCE SYSTEM', language: 'EN', gender: 'MALE', level: 'Intermediate', frequency: 4, price: 949, sales_count: 18, total_revenue: 10133 },
        { id: 9, product_id: '9', title: 'THE 8-WEEK BEGINNER REBUILD SYSTEM', language: 'EN', gender: 'MALE', level: 'Beginner', frequency: 4, price: 949, sales_count: 16, total_revenue: 9891 },
        { id: 1, product_id: '1', title: 'THE 8-WEEK BEGINNER REBUILD SYSTEM', language: 'EN', gender: 'MALE', level: 'Beginner', frequency: 3, price: 949, sales_count: 13, total_revenue: 7287 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetFilters = () => {
    setFilters({ language: 'ALL', gender: 'ALL', frequency: 'ALL', search: '' });
  };

  const deleteProduct = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(`Deactivate product #${id}?`)) return;
    try {
      await api.inactivateProduct(id);
      toast('Product archived from active catalog');
      fetchProducts();
    } catch (err) {
      toast(err.message || 'Error updating product', 'error');
    }
  };

  const filtered = allProducts.filter((p) => {
    const mLang =
      filters.language === 'ALL' ||
      (p.language || '').toUpperCase() === filters.language.toUpperCase();
    const mGen =
      filters.gender === 'ALL' ||
      (p.gender || '').toUpperCase() === filters.gender.toUpperCase();
    const mFreq =
      filters.frequency === 'ALL' ||
      Number(p.frequency) === Number(filters.frequency);
    const mSearch =
      filters.search === '' ||
      (p.title || '').toLowerCase().includes(filters.search.toLowerCase());

    return mLang && mGen && mFreq && mSearch;
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Control Header & Filters */}
      <div className="premium-card p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="w-full sm:w-80 relative">
            <i className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search catalog..."
              className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="chip-btn text-xs"
            >
              Reset Filters
            </button>
            <button
              onClick={onOpenDeployModal}
              className="px-4 py-2 bg-white text-slate-950 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-2"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Deploy Plan</span>
            </button>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-3 border-t border-white/[0.04] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Language:</span>
            {['ALL', 'AM', 'EN'].map((l) => (
              <button
                key={l}
                onClick={() => setFilters((prev) => ({ ...prev, language: l }))}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filters.language === l
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l === 'ALL' ? 'All' : l === 'AM' ? 'Amharic' : 'English'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Gender:</span>
            {['ALL', 'MALE', 'FEMALE'].map((g) => (
              <button
                key={g}
                onClick={() => setFilters((prev) => ({ ...prev, gender: g }))}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filters.gender === g
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {g === 'ALL' ? 'All' : g === 'MALE' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Schedule:</span>
            {['ALL', '3', '4', '5'].map((f) => (
              <button
                key={f}
                onClick={() => setFilters((prev) => ({ ...prev, frequency: f }))}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filters.frequency === f
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'All' : `${f} Days`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
          Loading catalog systems...
        </div>
      ) : filtered.length === 0 ? (
        <div className="premium-card p-16 text-center text-xs text-slate-500">
          No products match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => {
            const rev = Number(p.total_revenue || (p.sales_count || 0) * p.price || 0);

            return (
              <div
                key={p.id || p.product_id}
                onClick={() => onSelectProduct && onSelectProduct(p)}
                className="premium-card-hover p-6 flex flex-col justify-between cursor-pointer group relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.05] border border-white/[0.08] text-slate-300">
                        {p.language === 'AM' ? 'Amharic' : 'English'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {p.gender || 'Universal'}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {p.frequency || 4} Days/Wk
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {p.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                    <div>
                      <p className="text-[10px] text-slate-400">Total Sales</p>
                      <p className="text-xs font-semibold text-white mt-0.5">
                        {p.sales_count || 0} orders
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Total Yield</p>
                      <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                        {rev.toLocaleString()} Br
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] mt-5">
                  <div>
                    <span className="text-[10px] text-slate-400">Price</span>
                    <p className="text-base font-bold text-white font-mono">
                      {Number(p.price).toLocaleString()} <span className="text-xs font-normal text-slate-400">ETB</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => deleteProduct(e, p.id || p.product_id)}
                      className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Deactivate plan"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                    <span className="text-xs text-cyan-400 font-medium group-hover:translate-x-0.5 transition-transform">
                      View details →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
