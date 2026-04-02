/**
 * HILAWE | SOVEREIGN COMMAND V3
 * Ultra High-End Admin Control Logic
 */

const API_BASE = "https://digitalrevenuehilawe.onrender.com/api/admin";
// const API_BASE = "http://localhost:8000/api/admin";

let charts = {}; 
let revenueFilter = 7; // Default filter state
let activeFilters = { language: 'ALL', gender: 'ALL', frequency: 'ALL', search:'' };

// --- SYSTEM UTILITIES ---

const toast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const id = `sig-${Math.random().toString(36).substr(2, 5)}`;
    const colorClass = type === 'success' ? 'brand-cyan' : 'brand-rose';
    
    const html = `
        <div id="${id}" class="glass-ui flex items-center gap-4 px-6 py-4 rounded-2xl border border-${colorClass}/30 shadow-2xl transition-all duration-500 translate-x-12 opacity-0">
            <div class="text-${colorClass} text-lg animate-pulse">
                <i class="fa-solid ${type === 'success' ? 'fa-square-check' : 'fa-triangle-exclamation'}"></i>
            </div>
            <div>
                <p class="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-white">${message}</p>
                <p class="font-mono text-[8px] uppercase text-slate-500">System Link: Stable</p>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    setTimeout(() => el.classList.remove('translate-x-12', 'opacity-0'), 50);
    setTimeout(() => {
        el.classList.add('translate-x-12', 'opacity-0');
        setTimeout(() => el.remove(), 500);
    }, 4000);
};

// --- CORE ROUTER ---

const router = {
    currentView: 'dashboard',

    async navigate(view) {
        this.currentView = view;
        const outlet = document.getElementById('router-outlet');
        window.location.hash = view;
        const title = document.getElementById('view-title');
        
        title.innerHTML = `<span class="opacity-40">MISSION:</span> ${view.toUpperCase()}`;
        
        document.querySelectorAll('.nav-link').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === view);
        });

        outlet.innerHTML = `
            <div class="flex flex-col items-center justify-center py-40">
                <div class="w-16 h-16 border-t-2 border-b-2 border-brand-cyan rounded-full animate-spin glow-cyan"></div>
                <p class="font-mono text-[9px] uppercase tracking-[0.6em] text-cyan-500/50 mt-8 animate-pulse italic">Establishing Neural Uplink...</p>
            </div>
        `;

        this.cleanupCharts();

        try {
            switch(view) {
                case 'dashboard': await this.renderDashboard(); break;
                case 'payments': await this.renderPayments(); break;
                case 'products': await this.renderProducts(); break;
                case 'testimonials': await this.renderTestimonials(); break;
                case 'ledger': await this.renderLedger(); break; // ADD THIS LINE
            }
        } catch (err) {
            console.error("Navigation Failure:", err);
            toast("Connection Terminated", "error");
        }
    },
async renderTestimonials() {
    const [testiRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/testimonials`),
        fetch(`${API_BASE}/testimonials/stats`)
    ]);
    
    const testimonials = await testiRes.json();
    const stats = await statsRes.json();
    const outlet = document.getElementById('router-outlet');

    let html = `
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in">
        ${this.componentKPI("Success Narratives", stats.total_feedback_points, 'brand-cyan', 'fa-comment-medical', 'delay-100')}
        ${this.componentKPI("Global Sentiment", `${stats.avg_rating} / 5.0`, 'brand-gold', 'fa-award', 'delay-200')}
        ${this.componentKPI("Army Engagement", stats.participation_rate, 'brand-emerald', 'fa-users-rays', 'delay-300')}
    </section>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-slide-up">
    `;

    testimonials.forEach(user => {
        const answers = typeof user.answers === 'string' ? JSON.parse(user.answers) : user.answers;
        
        // 1. Identify the "Big Story" (The text-based feedback)
        const storyAnswer = answers.find(a => a.input_type === 'text' && a.question_id === 6);
        const story = storyAnswer?.text || "Client provided numeric data without a written narrative.";

        html += `
            <div class="glass-ui p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group hover:border-brand-cyan/30 transition-all duration-500">
                
                <div class="flex justify-between items-start mb-8">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-cyber-slate border border-white/10 flex items-center justify-center relative overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-tr from-brand-cyan/20 to-transparent"></div>
                            <span class="text-2xl font-black text-white italic relative z-10">${user.live_name[0]}</span>
                        </div>
                        <div>
                            <h4 class="text-xl font-black text-white italic tracking-tighter uppercase mb-1">${user.live_name}</h4>
                            <p class="font-mono text-[9px] text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded inline-block border border-brand-cyan/20 uppercase">
                                Verified Node: @${user.username || 'ANON'}
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="flex gap-1.5 mb-2 justify-end">${this.generateStars(answers.find(a => a.question_id === 1)?.rating || 0)}</div>
                        <p class="font-mono text-[8px] text-brand-gold uppercase tracking-[0.2em] font-bold">Client Satisfaction</p>
                    </div>
                </div>

                <div class="bg-gradient-to-r from-brand-cyan/10 to-transparent border-l-4 border-brand-cyan rounded-r-2xl p-8 mb-8 relative">
                    <span class="absolute -top-3 left-4 bg-brand-cyan text-black font-mono text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest shadow-lg">TRANSFORMATION_LOG</span>
                    <p class="text-white text-lg font-medium italic leading-relaxed">
                        "${story}"
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-8">
${answers.filter(a => a.question_id !== 6).map(a => {
    let displayVal = "";
    let label = a.question_en.split('?')[0]; 

    // CASE 1: TOGGLE (Yes/No)
    if (a.input_type === 'toggle') {
        displayVal = a.rating === 1 
            ? '<span class="text-brand-emerald font-black">✅ YES</span>' 
            : '<span class="text-brand-rose font-black">❌ NO</span>';
    } 
    // CASE 2: TEXT (The specific "null / 5" fix)
    else if (a.input_type === 'text') {
        displayVal = `<span class="text-white italic text-[10px]">"${a.text || 'No Entry'}"</span>`;
    }
    // CASE 3: EMOJI (Workout feel)
    else if (a.input_type === 'emoji') {
        const emojis = ['💪', '👍', '🔥']; 
        displayVal = `<span class="text-xl">${emojis[a.rating-1] || '✨'}</span>`;
    } 
    // CASE 4: STANDARD RATING
    else {
        displayVal = `<span class="text-white font-black">${a.rating || 0}</span><span class="text-slate-600">/5</span>`;
    }

    return `
        <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group/item hover:bg-white/[0.05] transition-colors">
            <div class="flex items-start justify-between mb-3">
                <p class="font-mono text-[12px] text-slate-500 uppercase tracking-tighter leading-tight flex-1 pr-2">
                    Q#${a.question_id}: ${label}
                </p>
                <i class="fa-solid ${a.input_type === 'text' ? 'fa-pen-nib' : 'fa-circle-info'} text-[8px] text-white/10 group-hover/item:text-brand-cyan/40 transition-colors"></i>
            </div>
            <p class="font-mono text-[11px] uppercase tracking-wider italic">
                ${displayVal}
            </p>
        </div>
    `;
}).join('')}
                </div>

                <div class="flex justify-between items-center pt-6 border-t border-white/5">
                   <div class="flex items-center gap-2">
                        <i class="fa-solid fa-fingerprint text-xs text-brand-cyan/30"></i>
                        <span class="font-mono text-[8px] text-slate-600 uppercase tracking-widest">ID: ${user.telegram_id}</span>
                   </div>
                   <div class="flex gap-3">
                        <button class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-rose/20 hover:border-brand-rose/30 hover:text-brand-rose transition-all">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                        <button class="px-6 py-2 rounded-xl bg-brand-cyan/10 text-brand-cyan text-[10px] font-black uppercase border border-brand-cyan/20 hover:bg-brand-cyan hover:text-black transition-all shadow-lg shadow-brand-cyan/5">
                            Feature
                        </button>
                   </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    outlet.innerHTML = html;
},

    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            const isActive = i <= rating;
            stars += `<i class="fa-solid fa-star text-[9px] ${isActive ? 'text-brand-gold glow-gold shadow-[0_0_10px_rgba(255,184,0,0.4)]' : 'text-white/5'}"></i>`;
        }
        return stars;
    },
async renderLedger() {
    const outlet = document.getElementById('router-outlet');
    
    outlet.innerHTML = `
    <div class="animate-fade-in space-y-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="glass-ui p-6 rounded-3xl border border-white/5 bg-white/[0.01]">
                <p class="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Gross_Revenue_Lifetime</p>
                <h3 id="kpi-gross" class="text-xl font-bold text-white mt-1">0.00 Br</h3>
            </div>
            <div class="glass-ui p-6 rounded-3xl border border-white/5 bg-white/[0.01]">
                <p class="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Total_Expenses</p>
                <h3 id="kpi-burn" class="text-xl font-bold text-brand-rose mt-1">0.00 Br</h3>
            </div>
            <div class="glass-ui p-6 rounded-3xl border border-brand-cyan/20 bg-brand-cyan/[0.02]">
                <p class="font-mono text-[9px] text-brand-cyan uppercase tracking-widest">Profit_Efficiency</p>
                <h3 id="kpi-efficiency" class="text-xl font-bold text-white mt-1">0%</h3>
            </div>
             <div class="glass-ui p-6 rounded-3xl border border-white/5 bg-white/[0.01]">
                <p class="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Net_Profit_To_Date</p>
                <h3 id="cumulative-profit-display" class="text-xl font-bold text-white mt-1">0.00 Br</h3>
            </div>
        </div>

        <div class="space-y-6">
            <div class="flex justify-between items-end">
                <div>
                    <h1 class="text-4xl font-black tracking-tighter text-white uppercase italic">Financial_Command</h1>
                    <p id="display-tier" class="font-mono text-[10px] text-brand-cyan tracking-[0.3em] uppercase mt-2">Initializing_Financial_Core...</p>
                </div>
            </div>

            <div class="px-2">
                <div class="flex justify-between items-center mb-3">
                    <p id="tier-label" class="font-mono text-[10px] text-slate-400 uppercase tracking-widest">Tier_Progress</p>
                    <p id="tier-percent" class="font-mono text-[10px] text-brand-cyan">0%</p>
                </div>
                <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div id="tier-progress-bar" class="h-full bg-brand-cyan shadow-[0_0_15px_#06b6d4] transition-all duration-1000" style="width: 0%"></div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div class="lg:col-span-1 glass-ui p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                
                <div class="flex p-1 bg-black/40 rounded-2xl border border-white/5">
                    <button id="mode-payout" class="flex-1 py-3 rounded-xl text-[9px] font-black font-mono transition-all bg-brand-cyan text-slate-950 uppercase">Payout_Mode</button>
                    <button id="mode-expense" class="flex-1 py-3 rounded-xl text-[9px] font-black font-mono transition-all text-slate-500 hover:text-white uppercase">Expense_Only</button>
                </div>

                <div class="space-y-4">
                    <div id="revenue-container">
                        <label class="block font-mono text-[9px] text-slate-400 uppercase pl-2 mb-2">Pending_Revenue</label>
                        <input type="number" id="payout-revenue" readonly class="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 font-mono text-white outline-none cursor-not-allowed">
                    </div>
                    
                    <div>
                        <label id="expense-label" class="block font-mono text-[9px] text-slate-400 uppercase pl-2 mb-2">Expense_Deductions</label>
                        <input type="number" id="payout-deductions" placeholder="0.00" class="w-full bg-slate-950/50 border border-brand-cyan/20 rounded-2xl px-6 py-4 font-mono text-white focus:border-brand-cyan outline-none transition-all">
                    </div>

                    <div>
                        <label class="block font-mono text-[9px] text-slate-400 uppercase pl-2 mb-2">Memo / Expense_Note</label>
                        <textarea id="payout-note" placeholder="Required for expense tracking..." class="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 font-mono text-[11px] text-white focus:border-brand-cyan outline-none h-24 resize-none transition-all"></textarea>
                    </div>
                </div>

                <button id="confirm-payout-btn" class="group relative w-full py-5 bg-brand-cyan text-slate-950 font-black font-mono text-[11px] uppercase rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden">
                    <span class="relative z-10">Execute_Financial_Log</span>
                    <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                </button>
            </div>

            <div class="lg:col-span-2 space-y-6">
                <div id="share-display-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500">
                    <div class="glass-ui p-8 rounded-[2.5rem] border border-brand-cyan/10 bg-gradient-to-br from-brand-cyan/[0.03] to-transparent flex flex-col justify-between">
                        <p class="font-mono text-[10px] text-brand-cyan uppercase tracking-widest mb-4">Coach_Hilawe_Share</p>
                        <h2 id="display-coach-share" class="text-5xl font-black text-white tracking-tighter">0.00 Br</h2>
                    </div>
                    <div class="glass-ui p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent flex flex-col justify-between">
                        <p class="font-mono text-[10px] text-slate-400 uppercase tracking-widest mb-4">Dagmawi_Share</p>
                        <h2 id="display-dag-share" class="text-5xl font-black text-white tracking-tighter">0.00 Br</h2>
                    </div>
                </div>

                <div class="glass-ui p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.01]">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <p class="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Growth_Velocity</p>
                            <h4 class="text-white font-bold text-sm uppercase italic mt-1">Profit_Trend_Monitor</h4>
                        </div>
                        <div class="flex items-center gap-2 px-3 py-1 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full">
                            <span class="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span>
                            <span class="font-mono text-[8px] text-brand-cyan uppercase">Live_Analytics</span>
                        </div>
                    </div>
                    <div class="h-44 w-full">
                        <canvas id="profitTrendChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="glass-ui rounded-[3rem] overflow-hidden border border-white/5">
            <div class="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h4 class="font-mono text-xs uppercase tracking-[0.4em] font-bold text-slate-400">Payout_Archive</h4>
                <div class="px-4 py-2 bg-black/40 rounded-xl border border-white/10 font-mono text-[9px] text-brand-cyan italic uppercase">
                    Ledger_Sync: Secure
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-white/[0.03] font-mono text-[9px] uppercase tracking-widest text-slate-500">
                        <tr>
                            <th class="p-6">Date</th>
                            <th class="p-6">Type</th>
                            <th class="p-6">Gross Rev</th>
                            <th class="p-6">Expenses</th>
                            <th class="p-6 text-white">Net Profit</th>
                            <th class="p-6 text-brand-cyan">Coach Share</th>
                            <th class="p-6">Dag Share</th>
                            <th class="p-6">Tier</th>
                            <th class="p-6 text-right">Statement</th>
                        </tr>
                    </thead>
                    <tbody id="payout-history-body" class="divide-y divide-white/5 font-mono text-[11px] text-slate-300">
                        </tbody>
                </table>
            </div>
        </div>
    </div>
    `;

    await loadLedgerData();
},
   

    /**
 * HILAWE | SOVEREIGN COMMAND V4 - HYPER-UI EDITION
 * "The Gold Standard of Dashboard Orchestration"
 */

cleanupCharts() {
    Object.values(window.charts || {}).forEach(c => c?.destroy());
    window.charts = {};
},

// --- VIEW: DASHBOARD (HYPER-REFINED) ---
async renderDashboard() {
    const [statsRes, paymentsRes, revenueRes, distRes, nodeIntelRes, topRes] = await Promise.all([
            fetch(`${API_BASE}/stats`),
            fetch(`${API_BASE}/payments/recent`),
            fetch(`${API_BASE}/stats/revenue?days=${revenueFilter}`),
            fetch(`${API_BASE}/stats/distribution`),
            fetch(`${API_BASE}/stats/node-intelligence`), // Ensure this route exists on your API!
            fetch(`${API_BASE}/products/top_sellers?limit=5`)
        ]);
    
    const [stats, payments, revData, distData, rawIntel, topSellers] = await Promise.all([
            statsRes.json(), 
            paymentsRes.json(), 
            revenueRes.json(), 
            distRes.json(), 
            nodeIntelRes.json(), // This now correctly matches the name above
            topRes.json()
        ]);
    const pending = Number(distData.pending || 0);
    const approved = Number(distData.approved || 0);
    const rejected = Number(distData.rejected || 0);
    const totalSignals = pending + approved + rejected;

    const demographicData = {
        lang: { 'EN': rawIntel.lang_en || 0, 'AM': rawIntel.lang_am || 0 },
        gender: { 'MALE': rawIntel.gen_male || 0, 'FEMALE': rawIntel.gen_female || 0 },
        level: { 
            'BEGINNER': rawIntel.lvl_beginner || 0, 
            'INTERMEDIATE': rawIntel.lvl_inter || 0, 
            'ADVANCED': rawIntel.lvl_adv || 0, 
            'GLUTE': rawIntel.lvl_glute || 0 
        },
        freq: { 
        '3 DAYS': rawIntel.freq_2_3 || 0,   // Mapping DB count <= 3
        '4 DAYS': rawIntel.freq_3_4 || 0,   // Mapping DB count = 4
        '5 DAYS': rawIntel.freq_4_5 || 0,   // Mapping DB count = 5
        'DAILY': rawIntel.freq_everyday || 0 // Mapping DB count >= 6
    },
        status: distData
    };

    const kpi = {
        revenue: stats.total_revenue || stats.revenue || 0,
        pending: stats.pending_payments || stats.pending || 0,
        users: stats.active_users || stats.users || 0,
        conversion: stats.conversion_rate || stats.conversion || 0
    };

    const outlet = document.getElementById('router-outlet');

  outlet.innerHTML = `
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in">
        ${this.componentKPI("Total Profit", `${Number(stats.total_revenue || 0).toLocaleString()} Br.`, 'brand-gold', 'fa-vault', 'delay-100')}
        ${this.componentKPI("Active Nodes", stats.active_users || 0, 'brand-cyan', 'fa-network-wired', 'delay-200')}
        ${this.componentKPI("Pending Syncs", stats.pending_payments || 0, 'brand-rose', 'fa-clock-rotate-left', 'delay-300')}
        ${this.componentKPI("Conv. Rate", `${stats.conversion_rate || 0}%`, 'brand-emerald', 'fa-bolt-lightning', 'delay-400')}
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 glass-ui p-10 rounded-[3.5rem] relative group border border-white/5 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
            <div class="flex justify-between items-end mb-12 relative z-10">
                <div>
                    <h4 class="font-mono text-[10px] uppercase tracking-[0.5em] font-black text-brand-cyan/60 mb-2">Market Volatility Index</h4>
                    <h2 class="text-3xl font-black italic text-white tracking-tighter uppercase">Financial_Pulse</h2>
                </div>
                <div class="flex gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                    ${[7, 14, 30].map(d => `
                        <button onclick="updateRevenueFilter(${d})" class="px-5 py-2 rounded-xl font-mono text-[10px] transition-all ${revenueFilter === d ? 'bg-brand-cyan text-black font-black shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-white'}">${d}D</button>
                    `).join('')}
                </div>
            </div>
            <div class="h-[380px] w-full relative z-10"><canvas id="mainChart"></canvas></div>
        </div>

        <div class="flex flex-col gap-8">
            <div class="glass-ui p-10 rounded-[3.5rem] border border-white/5 h-[340px] flex flex-col justify-between relative overflow-hidden group">
                 <div class="absolute inset-0 bg-gradient-to-t from-brand-rose/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                 <h4 class="font-mono text-[10px] uppercase tracking-[0.4em] font-black text-slate-500">Asset Distribution</h4>
                 <div class="h-[200px] relative mt-4">
                    <canvas id="donutChart"></canvas>
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-10px]">
                        <span class="text-slate-500 font-mono text-[8px] uppercase tracking-tighter">Total Signals</span>
                        <span class="text-2xl font-black text-white italic">${totalSignals}</span>
                    </div>
                 </div>
            </div>

            <div class="glass-ui p-8 rounded-[3.5rem] border border-white/5 flex-grow">
                <h4 class="font-mono text-[10px] uppercase tracking-[0.4em] font-black text-slate-500 mb-6">Top_3 Selling Products</h4>
                <div class="space-y-4">
                    ${topSellers.slice(0, 3).map((p, i) => `
                        <div class="flex items-center justify-between group cursor-pointer" onclick="showLifecycle('${p.product_id}')g">
                            <p class="text-[10px] font-black text-white uppercase group-hover:text-brand-cyan transition-colors">${p.title}</p>
                            <p class="font-mono text-[9px] font-black text-brand-emerald">${Number(p.total_revenue).toLocaleString()} Br.</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div class="lg:col-span-1 glass-ui p-10 rounded-[3.5rem] border border-white/5 flex flex-col relative overflow-hidden group">
    <div class="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity">
        <i class="fa-solid fa-microchip text-brand-cyan text-xs"></i>
    </div>
    <div class="flex justify-between items-center mb-8 relative z-10">
        <div>
            <h4 class="font-mono text-[10px] uppercase tracking-[0.4em] font-black text-slate-500">User Data</h4>
            <p class="text-[8px] font-mono text-brand-cyan/60 uppercase italic mt-1">Matrix v4.0</p>
        </div>
        <select id="demo-filter" onchange="window.updateDemoChart(this.value)" class="bg-black/80 border border-white/10 text-brand-cyan font-mono text-[9px] rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-brand-cyan/50 transition-all">
            <option value="level">BY_LEVEL</option>
            <option value="gender">BY_GENDER</option>
            <option value="lang">BY_LANG</option>
            <option value="freq">BY_FREQUENCY</option>
        </select>
    </div>
    <div class="h-[220px] relative z-10">
        <canvas id="demoChart"></canvas>
    </div>
    <div id="demo-legend" class="mt-8 grid grid-cols-2 gap-3 relative z-10"></div>
</div>

        <div class="lg:col-span-2 glass-ui p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden">
            <div class="flex justify-between items-center mb-8">
                <h4 class="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-500 font-black">Incoming_Signals</h4>
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-brand-emerald animate-ping rounded-full shadow-[0_0_10px_#10b981]"></span>
                    <span class="font-mono text-[8px] text-brand-emerald uppercase font-black">Real-time Node Activity</span>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${payments.slice(0, 6).map(p => `
                    <div class="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center hover:bg-brand-cyan/[0.05] transition-all duration-500 group">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan text-xs font-black italic border border-brand-cyan/10">
                                ${p.full_name ? p.full_name[0] : 'A'}
                            </div>
                            <div>
                                <p class="font-mono text-[10px] text-white font-black uppercase">${p.full_name || 'ANON_NODE'}</p>
                                <p class="text-[7px] font-mono text-slate-500 uppercase">${p.product_title || 'SECURE_TRANS'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-mono font-black text-brand-emerald">${Number(p.amount).toLocaleString()} Br.</p>
                            <p class="text-[6px] font-mono text-slate-600 uppercase">CREDIT_CONFIRMED</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>
`;



// SYNC ALL CHARTS
requestAnimationFrame(() => {
this.initCharts(revData, demographicData);});
},

componentKPI(label, value, color, icon, delay) {
    return `
        <div class="glass-ui p-8 rounded-[2.5rem] border border-white/5 border-t-2 border-t-${color} relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 ${delay}">
            <div class="absolute inset-0 bg-gradient-to-br from-${color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p class="font-mono text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mb-1 group-hover:text-white transition-colors">${label}</p>
            <h3 class="text-4xl font-black text-white italic tracking-tighter mt-4 relative z-10 group-hover:translate-x-1 transition-transform duration-500">${value}</h3>
            <div class="absolute right-6 bottom-6 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-${color}/30 group-hover:rotate-12 transition-all duration-700">
                <i class="fa-solid ${icon} text-xl text-white/10 group-hover:text-${color} transition-colors"></i>
            </div>
        </div>
    `;
},

initCharts(revData, demoData) {
    
    const distData = demoData.status || {};    
    const canvasMain = document.getElementById('mainChart');
    const canvasDemo = document.getElementById('demoChart');
    if (!canvasMain || !canvasDemo) {
        console.warn("LIFECYCLE_SYNC_DELAY: Retrying chart render...");
        return;
    }
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const labels = revData.map(r => {
        const d = r.date.includes('/') ? new Date(`${new Date().getFullYear()}/${r.date}`) : new Date(r.date);
        return dayNames[d.getDay()];
    });
    const values = revData.map(r => Number(r.value || 0));

    const ctxLine = document.getElementById('mainChart').getContext('2d');
    const ctxDonut = document.getElementById('donutChart').getContext('2d');

    // --- ULTRA GRADIENT ENGINE ---
    const areaFill = ctxLine.createLinearGradient(0, 0, 0, 400);
    areaFill.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
    areaFill.addColorStop(0.5, 'rgba(34, 211, 238, 0.05)');
    areaFill.addColorStop(1, 'rgba(34, 211, 238, 0)');

    const lineStroke = ctxLine.createLinearGradient(0, 0, 1000, 0);
    lineStroke.addColorStop(0, '#06b6d4');
    lineStroke.addColorStop(0.5, '#22d3ee');
    lineStroke.addColorStop(1, '#34d399'); // Subtle transition to emerald at the end

    this.cleanupCharts();
    window.charts = window.charts || {};

    // --- THE MAIN PULSE (LINE CHART) ---
    window.charts.main = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: values,
                borderColor: lineStroke,
                borderWidth: 5,
                 label: 'PROFIT',
          data: values,
          borderColor: lineStroke, // Emerald Green
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
            pointBackgroundColor: '#fff'

            }]

         
        },
        options: {
    ...this.getChartOptions(),
   
    hover: {
        mode: 'index',
        intersect: false
    },
    plugins: {
        legend: { display: false },
        tooltip: {
            enabled: true,
            position: 'nearest',
            backgroundColor: 'rgba(7, 16, 36, 0.95)', // Deep space navy
            titleFont: { family: 'JetBrains Mono', size: 12, weight: '800' },
            bodyFont: { family: 'JetBrains Mono', size: 14 },
            padding: 15,
            borderColor: 'rgba(34, 211, 238, 0.3)',
            borderWidth: 1,
            displayColors: false,
            // Add a slight delay for that premium feel
            animation: {
                duration: 150
            }
        }
    }
}
    });

    // --- THE CORE (DONUT CHART) ---
    window.charts.donut = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: ['PENDING', 'CONFIRMED', 'REJECTED'],
            datasets: [{
                data: [distData.pending || 1, distData.approved || 1, distData.rejected || 0],
                backgroundColor: ['#facc15', '#10b981', '#f43f5e'],
                borderWidth: 0,
                hoverOffset: 25,
                borderRadius: 10,
                spacing: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '82%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#64748b', font: { family: 'JetBrains Mono', size: 9, weight: 'bold' }, usePointStyle: true, padding: 25 }
                }
            }
        }
    });

    const ctxDemo = document.getElementById('demoChart').getContext('2d');
    
    window.updateDemoChart = (type) => {
    if (window.charts.demo) window.charts.demo.destroy();

    const levelData = demoData.level || {};
    const genderData = demoData.gender || {};
    const langData = demoData.lang || {};
    const freqData = demoData.freq || {};

    const config = {
        level: { labels: Object.keys(levelData), data: Object.values(levelData), color: '#22d3ee' },
        gender: { labels: Object.keys(genderData), data: Object.values(genderData), color: '#fb7185' },
        lang: { labels: Object.keys(langData), data: Object.values(langData), color: '#34d399' },
        freq: { labels: Object.keys(freqData), data: Object.values(freqData), color: '#facc15' }
    }[type];

    window.charts.demo = new Chart(ctxDemo, {
        type: 'radar',
        data: {
            labels: config.labels,
            datasets: [{
                data: config.data,
                backgroundColor: `${config.color}22`, // 10% opacity fill
                borderColor: config.color,
                borderWidth: 2,
                pointBackgroundColor: config.color,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: config.color,
                pointRadius: 4,
                lineTension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    pointLabels: {
                        color: '#64748b',
                        font: { family: 'JetBrains Mono', size: 9, weight: '700' },
                        backdropColor: 'transparent'
                    },
                    ticks: { display: false, stepSize: 1 }, // Keeps it clean
                    suggestedMin: 0
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(7, 16, 36, 0.95)',
                    titleFont: { family: 'JetBrains Mono' },
                    bodyFont: { family: 'JetBrains Mono' },
                    displayColors: false
                }
            }
        }
    });

    // UPDATE THE LEGEND (Now styled as "Active Node Stats")
    const legend = document.getElementById('demo-legend');
    legend.innerHTML = config.labels.map((l, i) => `
        <div class="flex items-center justify-between p-2 bg-white/[0.02] border border-white/5 rounded-xl">
            <div class="flex items-center gap-2">
                <span class="w-1 h-1 rounded-full" style="background:${config.color}"></span>
                <span class="font-mono text-[8px] text-slate-500 uppercase">${l}</span>
            </div>
            <span class="font-mono text-[9px] font-black text-white">${config.data[i]}</span>
        </div>
    `).join('');
};

    // Initialize with 'level'
    updateDemoChart('level');
},

getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
        }
    };
},

    // --- VIEW: PAYMENTS (Optimized Table) ---
    async renderPayments() {
        const res = await fetch(`${API_BASE}/payments/recent`);
        const data = await res.json();
        const outlet = document.getElementById('router-outlet');

        const rows = data.map(p => `
            <tr class="group border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                <td class="p-6">
                    <p class="font-bold text-white text-xs uppercase tracking-tight">${p.full_name || 'Unknown'}</p>
                    <p class="font-mono text-[8px] text-slate-500 uppercase">USR_${p.user_id}</p>
                </td>
                <td class="p-6 font-mono text-[10px] text-slate-300 uppercase">${p.title}</td>
                <td class="p-6"><span class="text-[10px] font-mono font-black text-brand-cyan">${p.amount} Br.</span></td>
                <td class="p-6">
                    <span class="font-mono text-[9px] font-bold uppercase ${p.status === 'pending' ? 'text-brand-gold animate-pulse' : 'text-brand-emerald'}">
                        ● ${p.status}
                    </span>
                </td>
                <td class="p-6 text-right">
                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        ${p.status === 'pending' ? `
                            <button onclick="verifyPayment(${p.id}, 'approved')" class="px-4 py-1.5 bg-brand-cyan text-black font-mono text-[8px] font-black uppercase rounded-lg">Approve</button>
                            <button onclick="verifyPayment(${p.id}, 'rejected')" class="px-4 py-1.5 bg-brand-rose text-white font-mono text-[8px] font-black uppercase rounded-lg">Deny</button>
                        ` : '<span class="text-[8px] font-mono text-slate-600">FINALIZED</span>'}
                    </div>
                </td>
            </tr>
        `).join('');

        outlet.innerHTML = `
            <div class="glass-ui rounded-[3rem] overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-white/[0.02] font-mono text-[9px] uppercase text-slate-500">
                        <tr>
                            <th class="p-6">User</th><th class="p-6">Product</th><th class="p-6">Price</th><th class="p-6">Status</th><th class="p-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">${rows}</tbody>
                </table>
            </div>
        `;
    },

// --- VIEW: PRODUCTS (Tactical Matrix Edition) ---

async renderProducts() {
    const res = await fetch(`${API_BASE}/revenue/products`);
    const allProducts = await res.json();
    const outlet = document.getElementById('router-outlet');

    const langs = [...new Set(allProducts.map(p => p.language))];
    const genders = [...new Set(allProducts.map(p => p.gender))];
    const freqs = [...new Set(allProducts.map(p => p.frequency))].sort();

    outlet.innerHTML = `
        <div class="space-y-8 mb-12 animate-fade-in px-4">
            <div class="relative group">
                <input type="text" id="globalSearch" placeholder="SEARCH..." 
                    class="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-14 pr-40 font-mono text-[10px] text-white focus:outline-none focus:border-brand-cyan/50 focus:bg-brand-cyan/5 transition-all duration-500">
                <i class="fa-solid fa-terminal absolute left-10 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-cyan"></i>
                
                <button onclick="resetFilters()" class="absolute right-8 top-1/2 -translate-y-1/2 px-4 py-2 bg-brand-rose/10 border border-brand-rose/20 text-brand-rose font-mono text-[8px] font-black uppercase rounded-lg hover:bg-brand-rose hover:text-white transition-all">
                    [ CLEAR_FILTER ]
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${this.renderFilterRow('Language', 'lang', langs)}
                ${this.renderFilterRow('Gender', 'gen', genders)}
                ${this.renderFilterRow('Frequency', 'freq', freqs, 'X')}
            </div>
        </div>

        <div id="product-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-4">
            ${this.generateProductCards(allProducts)}
        </div>
    `;

    // ENGINE: Reset
    window.resetFilters = () => {
        activeFilters = { language: 'ALL', gender: 'ALL', frequency: 'ALL', search: '' };
        document.getElementById('globalSearch').value = '';
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'glow-cyan'));
        document.querySelectorAll('.filter-btn[data-val="ALL"]').forEach(b => b.classList.add('active', 'glow-cyan'));
        updateMatrix();
    };

    // ENGINE: Matrix Update
    window.updateMatrix = (type, value) => {
        if(type) activeFilters[type] = value;
        activeFilters.search = document.getElementById('globalSearch').value.toLowerCase();
        
        if(type) {
            const prefix = type === 'language' ? 'lang' : type === 'gender' ? 'gen' : 'freq';
            document.querySelectorAll(`.${prefix}-btn`).forEach(btn => {
                const isActive = btn.getAttribute('data-val') == value;
                btn.classList.toggle('active', isActive);
                btn.classList.toggle('glow-cyan', isActive);
            });
        }

      // Locate this inside updateMatrix in app.js
const filtered = allProducts.filter(p => {
    const mLang = activeFilters.language === 'ALL' || 
                  p.language.toUpperCase() === activeFilters.language.toUpperCase();

    // Normalizing both to UpperCase to match 'MALE' == 'MALE'
    const mGen = activeFilters.gender === 'ALL' || 
                 p.gender.toUpperCase() === activeFilters.gender.toUpperCase();

    const mFreq = activeFilters.frequency === 'ALL' || 
                  Number(p.frequency) === Number(activeFilters.frequency);

    const mSearch = p.title.toLowerCase().includes(activeFilters.search);
    
    return mLang && mGen && mFreq && mSearch;
});

        document.getElementById('product-grid').innerHTML = this.generateProductCards(filtered);
    };

    document.getElementById('globalSearch').addEventListener('input', () => updateMatrix());
},

renderFilterRow(label, prefix, items, suffix='') {
    return `
        <div class="flex items-center gap-4">
            <span class="font-mono text-[8px] text-slate-500 uppercase tracking-[0.3em] w-20">${label}:</span>
            <div class="flex flex-wrap gap-2">
                <button onclick="updateMatrix('${label.toLowerCase()}', 'ALL')" class="filter-btn ${prefix}-btn active" data-val="ALL">ALL</button>
                ${items.map(i => `<button onclick="updateMatrix('${label.toLowerCase()}', '${i}')" class="filter-btn ${prefix}-btn" data-val="${i}">${i}${suffix}</button>`).join('')}
            </div>
        </div>
    `;
},

generateProductCards(products) {
    if (!products.length) return `<div class="col-span-full py-20 text-center font-mono text-slate-600 italic animate-pulse">NO SYSTEMS MATCH THE CURRENT PARAMETERS.</div>`;
    
    return products.map(p => `
        <div class="glass-ui p-10 rounded-[3.5rem] group border border-white/5 hover:border-brand-cyan/30 transition-all duration-700 relative overflow-hidden cursor-pointer" onclick="showLifecycle('${p.product_id}')">
           

            <div class="absolute top-0 right-0 p-8 z-10">
                <div class="w-14 h-14 rounded-2xl border-2 border-brand-cyan/20 flex flex-col items-center justify-center font-black italic text-brand-cyan group-hover:bg-brand-cyan group-hover:text-black transition-all duration-500 rotate-3 group-hover:rotate-0">
                    <span class="text-xl leading-none">${p.frequency}X</span>
                    <span class="text-[7px] font-mono not-italic tracking-tighter">FREQ</span>
                </div>
            </div>

            <div class="space-y-4 relative z-10">
                <div class="flex gap-2">
                    <span class="px-3 py-1 bg-white/5 border border-white/10 text-slate-400 text-[8px] font-mono rounded-lg uppercase tracking-widest">${p.language}</span>
                    <span class="px-3 py-1 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[8px] font-mono rounded-lg uppercase tracking-widest">${p.gender}</span>
                </div>
                
                <h4 class="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-brand-cyan transition-colors">${p.title}</h4>

                <div class="flex gap-6 py-4">
                    <div><p class="text-[7px] font-mono text-slate-500 uppercase">Sales</p><p class="text-xs font-black text-white italic">${p.sales_count || 0} UNITS</p></div>
                    <div><p class="text-[7px] font-mono text-slate-500 uppercase">Revenue</p><p class="text-xs font-black text-brand-emerald italic">${Number(p.total_revenue || 0).toLocaleString()} Br.</p></div>
                </div>
            </div>

            <div class="flex justify-between items-end pt-6 border-t border-white/5 mt-4 relative z-10">
                <div>
                    <p class="font-mono text-[8px] text-slate-500 uppercase">Access_Fee</p>
                    <div class="text-3xl font-black text-white italic">${Number(p.price).toLocaleString()} <span class="text-brand-cyan text-xs">Br.</span></div>
                </div>
                <button onclick="event.stopPropagation(); deleteProduct('${p.product_id}')" class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-brand-rose transition-all">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
                
            </div>
        </div>
    `).join('');
}



};

// --- GLOBAL HELPERS ---

window.updateRevenueFilter = (days) => {
    revenueFilter = days;
    router.renderDashboard();
};


/* --- MODAL & DATA LIFECYCLE --- */

window.openMintModal = () => {
    const form = document.getElementById('mint-form');
    form.reset();
    form.dataset.mode = 'create';
    delete form.dataset.editId;
    document.getElementById('mint-modal-title').innerText = 'NEW_DEPLOYMENT';
    document.getElementById('mint-modal').classList.remove('hidden');
};

window.editProduct = (encodedData) => {
    const p = JSON.parse(decodeURIComponent(encodedData));
    const form = document.getElementById('mint-form');
    
    form.dataset.mode = 'edit';
    form.dataset.editId = p.product_id; // Mapping from revenue API
    
    // Fill form fields
    form.title.value = p.title;
    form.price.value = p.price;
    form.language.value = p.language;
    form.file_id.value = p.telegram_file_id;
    
    document.getElementById('mint-modal-title').innerText = 'EDIT_CONFIGURATION';
    document.getElementById('mint-modal').classList.remove('hidden');
};

document.getElementById('mint-form').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const isEdit = f.dataset.mode === 'edit';
    
    // 1. Show a loading state (prevents double clicking)
    const btn = f.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "UPLINKING...";
    btn.disabled = true;

    const payload = {
        title: f.title.value,
        price: f.price.value,
        language: f.language.value,
        telegram_file_id: f.file_id.value,
        gender: 'ALL', 
        frequency: 3,
        level: 'BEGINNER'
    };

    try {
        const url = isEdit ? `${API_BASE}/products?id=${f.dataset.editId}` : `${API_BASE}/products/create`;
        const method = isEdit ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if(res.ok) {
            document.getElementById('mint-modal').classList.add('hidden');
            // FIX: Use the global dashboard instance, not 'this'
            if (window.dashboard) {
                window.dashboard.renderProducts();
            } else {
                location.reload(); // Fallback if instance isn't found
            }
        } else {
            const err = await res.json();
            alert("CRITICAL_ERROR: " + (err.error || "Unknown Failure"));
        }
    } catch (error) {
        console.error("DEPLOYMENT_FAILED:", error);
        alert("NETWORK_ERROR: Check console.");
    } finally {
        // 2. Unfreeze the button
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

/* --- Update the Delete Function --- */
window.deleteProduct = async (id) => {
    if (!confirm("TERMINATE SYSTEM ACCESS? (DEACTIVATE)")) return;
    // FIX: Added /api/admin prefix to match backend
    const res = await fetch(`${API_BASE}/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
        // Instead of reload, just re-render for that smooth SPA feel
        const dashboard = new Dashboard(); // Or however your instance is named
        dashboard.renderProducts();
    }
};

window.closeMintModal = () => {
    const modal = document.getElementById('mint-modal');
    modal.classList.add('hidden');
    modal.style.opacity = '0';
};

let currentChart = null;

let productLifecycleInstance = null;

window.showLifecycle = async (id) => {
    try {
        const drawer = document.getElementById('lifecycle-drawer');
        const statsContainer = document.getElementById('lifecycle-stats');
        const specMatrix = document.getElementById('spec-matrix');
        
        drawer.classList.add('open');
        drawer.style.transform = 'translateX(0)';

        // 1. Fetch Deep Data
        const res = await fetch(`${API_BASE}/products/lifecycle?id=${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'FETCH_FAILED');

        // 2. Update Basic Info
        document.getElementById('lifecycle-title').innerText = data.product.title;
        document.getElementById('lifecycle-id').innerText = `NODE_ID: ${id.toUpperCase()}`;

        // 3. Inject High-Density Stats
        const totalRev = Number(data.product.total_revenue || 0);
        const avgDaily = (totalRev / (data.sales.length || 1)).toFixed(2);
        
        statsContainer.innerHTML = `
            ${renderMiniKPI('SALES', data.product.sales_count, 'fa-cart-shopping', 'brand-cyan')}
            ${renderMiniKPI('REVENUE', `${totalRev.toLocaleString()} Br`, 'fa-gem', 'brand-emerald')}
            ${renderMiniKPI('AVG_FLOW', `${avgDaily} Br`, 'fa-chart-simple', 'brand-gold')}
        `;

        // 4. Inject Technical Specs
        const p = data.product;
        specMatrix.innerHTML = `
            ${renderSpecRow('LANGUAGE', p.language, 'fa-code')}
            ${renderSpecRow('FREQUENCY', `${p.frequency}x PerWeek `, 'fa-microchip')}
            ${renderSpecRow('STATUS', 'ACTIVE', 'fa-shield-halved')}
            ${renderSpecRow('FILE_ID', p.telegram_file_id.substring(0, 15) + '...', 'fa-fingerprint')}
        `;

        // 5. Action Bindings
      
        document.getElementById('delete-btn-trigger').onclick = () => deleteProduct(p.product_id);

        // 6. Cyber-Pulse Chart
        renderLifecycleChart(data.dates, data.sales);

    } catch (err) {
        console.error("LIFECYCLE_CRITICAL_FAILURE:", err);
        toast("UI Layer Desync", "error");
    }
};

// --- SUB-COMPONENTS FOR HIGH-END UI ---

function renderMiniKPI(label, value, icon, color) {
    return `
        <div class="bg-white/[0.03] border border-white/5 p-4 rounded-3xl group">
            <i class="fa-solid ${icon} text-[10px] text-slate-600 mb-2 block group-hover:text-${color} transition-colors"></i>
            <p class="text-[14px] font-black text-white italic tracking-tighter">${value}</p>
            <p class="text-[7px] font-mono text-slate-500 uppercase tracking-widest">${label}</p>
        </div>
    `;
}

function renderSpecRow(label, value, icon) {
    return `
        <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.05] transition-all">
            <div class="flex items-center gap-3">
                <i class="fa-solid ${icon} text-[10px] text-slate-700"></i>
                <span class="font-mono text-[8px] text-slate-400 uppercase tracking-widest">${label}</span>
            </div>
            <span class="font-mono text-[9px] text-white font-bold uppercase">${value}</span>
        </div>
    `;
}

/**
 * REVENUE COMMAND CENTER - LEDGER & ANALYTICS
 */
async function loadLedgerData() {
    try {
        const [statsRes, historyRes] = await Promise.all([
            fetch(`${API_BASE}/payouts/pending`),
            fetch(`${API_BASE}/payouts/history`)
        ]);

        const data = await statsRes.json();
        const history = await historyRes.json();
        
        // UI Elements Mapping
        const revInput = document.getElementById('payout-revenue'); 
        const dedInput = document.getElementById('payout-deductions'); 
        const noteInput = document.getElementById('payout-note');
        const cumDisplay = document.getElementById('cumulative-profit-display'); 
        const tierDisplay = document.getElementById('display-tier');
        const historyBody = document.getElementById('payout-history-body');
        const confirmBtn = document.getElementById('confirm-payout-btn');

        // KPI Elements
        const kpiGross = document.getElementById('kpi-gross');
        const kpiBurn = document.getElementById('kpi-burn');
        const kpiEff = document.getElementById('kpi-efficiency');
        const progBar = document.getElementById('tier-progress-bar');
        const progLabel = document.getElementById('tier-label');
        const progPercent = document.getElementById('tier-percent');

        let currentMode = 'payout'; 

        // --- 1. INITIAL DATA INJECTION (NET-FIRST LOGIC) ---
        // CRITICAL CHANGE: We set the input to Cumulative Profit, not Pending Revenue.
        // This ensures you are splitting what is ACTUALLY in the chest.
        revInput.value = data.cumulative_profit.toFixed(2);
        
        cumDisplay.innerText = `${data.cumulative_profit.toLocaleString()} Br`;
        
        // Lifetime KPIs
        kpiGross.innerText = `${data.lifetime_gross.toLocaleString()} Br`;
        kpiBurn.innerText = `${data.lifetime_burn.toLocaleString()} Br`;
        kpiEff.innerText = `${data.efficiency}%`; 

        // Tier Progress
        progBar.style.width = `${data.tier_progress}%`;
        progPercent.innerText = `${data.tier_progress}%`;
        progLabel.innerText = data.current_tier === 1 ? "Progress_to_Tier_2" : "Tier_2_Active_Limitless";

        if (data.trend_labels && data.trend_data) {
            initTrendChart(data.trend_labels, data.trend_data);
        }

        // --- 2. THE CALCULATION ENGINE ---
        const updateCalculations = () => {
            const availableNet = parseFloat(revInput.value) || 0; 
            const currentExp = parseFloat(dedInput.value) || 0;
            const tier = data.current_tier;

            const coachRatio = tier === 1 ? 0.6 : 0.7;
            const dagRatio = tier === 1 ? 0.4 : 0.3;

            const coachShareEl = document.getElementById('display-coach-share');
            const dagShareEl = document.getElementById('display-dag-share');
            const shareGrid = document.getElementById('share-display-grid');
            const revenueContainer = document.getElementById('payout-revenue-container');

            if (currentMode === 'expense_only') {
                coachShareEl.innerText = "0.00 Br";
                dagShareEl.innerText = "0.00 Br";
                shareGrid.style.opacity = "0.1"; 
                revenueContainer?.classList.add('opacity-30');
                
                tierDisplay.innerText = "MODE // STANDALONE_EXPENSE_LOG";
                confirmBtn.innerText = "Log_Expense_Only";
                confirmBtn.classList.replace('bg-brand-cyan', 'bg-brand-rose');
            } else {
                // Distribute whatever is in the field minus current new deductions
                const distributable = Math.max(0, availableNet - currentExp);
                
                const coachAmount = (distributable * coachRatio).toFixed(2);
                const dagAmount = (distributable * dagRatio).toFixed(2);

                coachShareEl.innerText = `${parseFloat(coachAmount).toLocaleString()} Br`;
                dagShareEl.innerText = `${parseFloat(dagAmount).toLocaleString()} Br`;

                shareGrid.style.opacity = "1";
                revenueContainer?.classList.remove('opacity-30');
                
                tierDisplay.innerText = `ACTIVE // TIER_${tier} (${(coachRatio * 100).toFixed(0)}/${(dagRatio * 100).toFixed(0)}_SPLIT)`;
                confirmBtn.innerText = "Complete_Payout_&_Save";
                confirmBtn.classList.replace('bg-brand-rose', 'bg-brand-cyan');
            }
        };

        // --- 3. MODE TOGGLE LOGIC ---
        const btnPayoutMode = document.getElementById('mode-payout');
        const btnExpenseMode = document.getElementById('mode-expense');

        btnPayoutMode.onclick = () => {
            currentMode = 'payout';
            btnPayoutMode.className = "flex-1 py-3 rounded-xl text-[9px] font-black font-mono transition-all bg-brand-cyan text-slate-950 uppercase";
            btnExpenseMode.className = "flex-1 py-3 rounded-xl text-[9px] font-black font-mono transition-all text-slate-500 hover:text-white uppercase";
            revInput.disabled = false;
            updateCalculations();
        };

        btnExpenseMode.onclick = () => {
            currentMode = 'expense_only';
            btnExpenseMode.className = "flex-1 py-3 rounded-xl text-[9px] font-black font-mono transition-all bg-brand-rose text-white uppercase";
            btnPayoutMode.className = "flex-1 py-3 rounded-xl text-[9px] font-black font-mono transition-all text-slate-500 hover:text-white uppercase";
            revInput.disabled = true;
            updateCalculations();
        };

        dedInput.addEventListener('input', updateCalculations);
        revInput.addEventListener('input', updateCalculations);
        updateCalculations();

        // --- 4. RENDER HISTORY ---
        renderHistory(history, historyBody);

        // --- 5. EXECUTION HANDLER ---
        confirmBtn.onclick = async () => {
            const amount = currentMode === 'payout' ? parseFloat(revInput.value) : parseFloat(dedInput.value);
            const deductions = currentMode === 'payout' ? parseFloat(dedInput.value) : 0;
            const note = noteInput.value.trim();

            if (amount <= 0 && currentMode === 'payout') return toast("ENTER FUNDS TO SPLIT", "error");
            if (amount <= 0 && currentMode === 'expense_only') return toast("ENTER EXPENSE AMOUNT", "error");
            if (!note) return toast("MEMO REQUIRED", "error");

            const confirmMsg = currentMode === 'payout' 
                ? "Authorize Payout? This splits profit and reduces the War Chest."
                : "Log Standalone Expense? This hits the War Chest without share split.";
            
            if(!confirm(confirmMsg)) return;
            
            confirmBtn.disabled = true;
            confirmBtn.innerText = "SYNCING...";

            try {
                const response = await fetch(`${API_BASE}/payouts/confirm`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        amount,      
                        deductions,  
                        note,
                        entry_type: currentMode
                    })
                });

                if(response.ok) {
                    toast(currentMode === 'payout' ? "FINANCIAL_SYNC_COMPLETE" : "EXPENSE_ARCHIVED");
                    dedInput.value = "";
                    noteInput.value = "";
                    await loadLedgerData(); 
                } else {
                    toast("LOGIC_GATE_REJECTED", "error");
                }
            } catch (err) {
                toast("NETWORK_SYNC_FAILURE", "error");
            } finally {
                confirmBtn.disabled = false;
            }
        };

    } catch (e) { 
        console.error("🛑 SYNC ERROR:", e);
        toast("FINANCIAL_OFFLINE", "error"); 
    }
}
/**
 * CHART ENGINE - Visualizes Profit Growth
 */

/**
 * Renders the financial history table with high-end glassmorphism styling
 */
function renderHistory(history, container) {
    if (!history || history.length === 0) {
        container.innerHTML = `<tr><td colspan="9" class="p-10 text-center text-slate-600 italic uppercase font-mono text-[10px] tracking-widest">No_Historical_Records_Found</td></tr>`;
        return;
    }

    container.innerHTML = history.map(log => {
        const isExpense = log.entry_type === 'expense_only';
        
        // Define the Visual Theme for the row
        const rowOpacity = isExpense ? 'opacity-60' : 'opacity-100';
        const typeBadge = isExpense 
            ? 'bg-brand-rose/10 text-brand-rose border-brand-rose/20' 
            : 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20';
        
        // Format values to avoid double negatives in UI
        const gross = parseFloat(log.gross_revenue);
        const burn = Math.abs(parseFloat(log.operational_deductions));
        const net = parseFloat(log.net_profit);
        const coach = parseFloat(log.coach_share);
        const dag = parseFloat(log.dagmawi_share);

        return `
        <tr class="hover:bg-white/[0.02] transition-colors group border-b border-white/5 ${rowOpacity}">
            <td class="p-6 text-slate-500 font-mono text-[10px]">${new Date(log.payout_date).toLocaleDateString()}</td>
            
            <td class="p-6">
                <span class="px-2 py-0.5 rounded-[4px] text-[8px] font-black border uppercase tracking-tighter ${typeBadge}">
                    ${log.entry_type.replace('_', ' ')}
                </span>
            </td>
            
            <td class="p-6 font-mono text-[11px] ${isExpense ? 'text-slate-700' : 'text-white'}">
                ${isExpense ? '---' : `${gross.toLocaleString()} Br`}
            </td>
            
            <td class="p-6">
                <div class="font-mono text-[11px] ${isExpense ? 'text-brand-rose font-bold' : 'text-slate-500'}">
                    -${burn.toLocaleString()} Br
                </div>
                ${log.expense_note ? `<div class="text-[9px] text-slate-400 lowercase mt-1 italic tracking-tight font-light">"${log.expense_note}"</div>` : ''}
            </td>
            
            <td class="p-6 font-black font-mono text-[11px] ${net < 0 ? 'text-brand-rose' : 'text-white'}">
                ${net < 0 ? '-' : '+'}${Math.abs(net).toLocaleString()} Br
            </td>
            
            <td class="p-6 text-[10px] font-mono ${isExpense ? 'text-slate-800' : 'text-brand-cyan font-bold'}">
                ${isExpense ? '0.00' : `${coach.toLocaleString()} Br`}
            </td>
            <td class="p-6 text-[10px] font-mono ${isExpense ? 'text-slate-800' : 'text-slate-400'}">
                ${isExpense ? '0.00' : `${dag.toLocaleString()} Br`}
            </td>
            
            <td class="p-6 text-center">
                <span class="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-slate-500">
                    T${log.tier_applied}
                </span>
            </td>
            
            <td class="p-6 text-right">
                <button onclick='generatePayoutPDF(${JSON.stringify(log)})' 
                        class="p-2 hover:bg-white/10 rounded-lg text-slate-600 hover:text-white transition-all">
                    <i class="fa-solid fa-file-invoice-dollar text-[12px]"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

function initTrendChart(labels, dataPoints) {
    const ctx = document.getElementById('profitTrendChart').getContext('2d');
    if (window.trendChartInstance) window.trendChartInstance.destroy();

    window.trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Profit',
                data: dataPoints,
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.05)',
                borderWidth: 3,
                pointBackgroundColor: '#06b6d4',
                pointRadius: 4,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9, family: 'monospace' } } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 9, family: 'monospace' } } }
            }
        }
    });
}

/**
 * PDF ENGINE - Generates Official Statements
 */
async function generatePayoutPDF(log) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header Style
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(24);
    doc.text("HILAWE_REVENUE", 15, 30);
    doc.setFontSize(10); doc.setFont("courier", "normal");
    doc.text(`CERTIFIED_STATEMENT: #LGR-${log.id}-${Math.random().toString(36).substr(2,4).toUpperCase()}`, 15, 40);

    // Distribution Table
    doc.autoTable({
        startY: 60,
        head: [['PARAMETER', 'VALUE']],
        body: [
            ['Transaction Date', new Date(log.payout_date).toLocaleDateString()],
            ['Gross Revenue', `${parseFloat(log.gross_revenue).toLocaleString()} Br`],
            ['Deductions', `${parseFloat(log.operational_deductions).toLocaleString()} Br`],
            ['Net Profit', `${parseFloat(log.net_profit).toLocaleString()} Br`],
            ['Tier Applied', `Tier ${log.tier_applied}`],
            ['Coach Share', `${parseFloat(log.coach_share).toLocaleString()} Br`],
            ['Dagmawi Share', `${parseFloat(log.dagmawi_share).toLocaleString()} Br`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212], textColor: 255 },
        styles: { font: 'courier', fontSize: 10 }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    // Add to generatePayoutPDF
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287); // Border
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold"); doc.text("OFFICIAL_AUDIT_NOTE:", 15, finalY);
    doc.setFont("helvetica", "italic"); doc.setFontSize(9);
    doc.text(log.expense_note || "No specific operational deductions recorded.", 15, finalY + 8);

    doc.save(`Payout_Statement_${log.payout_date.split('T')[0]}.pdf`);
}


function renderLifecycleChart(labels, values) {
    if (productLifecycleInstance instanceof Chart) productLifecycleInstance.destroy();
    
    const ctx = document.getElementById('lifecycleChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

    productLifecycleInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                borderColor: '#22d3ee',
                borderWidth: 3,
                pointBackgroundColor: '#22d3ee',
                pointBorderColor: '#000',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { size: 9, family: 'JetBrains Mono' } } },
                x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 8, family: 'JetBrains Mono' } } }
            }
        }
    });
}

window.closeLifecycle = () => {
    const drawer = document.getElementById('lifecycle-drawer');
    drawer.style.transform = 'translateX(100%)';
    setTimeout(() => drawer.classList.remove('open'), 700);
};


async function verifyPayment(id, status) {
    try {
        const res = await fetch(`${API_BASE}/payments/${id}/verify`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            toast(`SIGNAL ${status.toUpperCase()} SUCCESSFUL`);
            router.navigate('payments');
        }
    } catch (e) { toast("Uplink Interrupted", "error"); }
}



// Ensure your router handles the 'ledger' view





// --- INIT ---

// --- INIT ENGINE ---

window.addEventListener('DOMContentLoaded', () => {
    // 1. Get view from URL (e.g., #products -> products)
    const savedView = window.location.hash.replace('#', '');
    
    // 2. If valid view exists in URL, go there; otherwise default to dashboard
    const initialView = ['dashboard', 'payments', 'products', 'testimonials', 'ledger'].includes(savedView) 
    ? savedView 
    : 'dashboard';

    router.navigate(initialView);
});

// Handle browser Back/Forward buttons
window.addEventListener('hashchange', () => {
    const view = window.location.hash.replace('#', '');
    if (view && view !== router.currentView) {
        router.navigate(view);
    }
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default anchor jump
        router.navigate(link.getAttribute('data-view'));
    });
});