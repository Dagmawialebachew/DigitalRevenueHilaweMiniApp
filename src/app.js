/**
 * HILAWE | SOVEREIGN COMMAND V3
 * Ultra High-End Admin Control Logic
 */



/**<div class="flex gap-4 mt-2 flex-wrap">
        <span class="flex items-center gap-1.5 font-mono text-[9px] text-slate-500">
            <span style="width:5px;height:5px;border-radius:50%;background:#378ADD;display:inline-block;flex-shrink:0;"></span>
            // Sales: <span id="kpi-net-sales">0</span> Br
        </span>
        <span class="flex items-center gap-1.5 font-mono text-[9px] text-slate-500">
            <span style="width:5px;height:5px;border-radius:50%;background:#d4a200;display:inline-block;flex-shrink:0;"></span>
            // Club: <span id="kpi-net-club">0</span> Br
        </span>
    </div>
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
    <div id="kpi-gross-breakdown" class="flex gap-4 mt-2">
        <span class="flex items-center gap-1.5 font-mono text-[9px] text-slate-500">
            <span style="width:5px;height:5px;border-radius:50%;background:#d4a200;display:inline-block;flex-shrink:0;"></span>
            Club: <span id="kpi-gross-club">0</span> Br
        </span>
        <span class="flex items-center gap-1.5 font-mono text-[9px] text-slate-500">
            <span style="width:5px;height:5px;border-radius:50%;background:#378ADD;display:inline-block;flex-shrink:0;"></span>
            Sales: <span id="kpi-gross-sales">0</span> Br
        </span>
    </div>
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
    /NOte/
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

    // Calculate dynamic breakdown and combined total
    const clubRevenue = Number(stats.club_revenue || 0);
    const salesRevenue = Number(stats.total_revenue || 0);

    const totalRevenueSum = clubRevenue + salesRevenue;

    const kpi = {
        revenue: totalRevenueSum,
        pending: stats.pending_payments || stats.pending || 0,
        users: stats.active_users || stats.users || 0,
        conversion: stats.conversion_rate || stats.conversion || 0
    };

    const outlet = document.getElementById('router-outlet');

  outlet.innerHTML = `
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in">
    ${this.componentKPI(
        "Total Revenue",
        `${totalRevenueSum.toLocaleString()} Br.`,
        'brand-gold',
        'fa-vault',
        'delay-100',
        { club: clubRevenue, sales: salesRevenue }
    )}
    ${this.componentKPI("Active Users", stats.active_users || 0, 'brand-cyan', 'fa-network-wired', 'delay-200')}
    ${this.componentKPI("Pending Transaction", stats.pending_payments || 0, 'brand-rose', 'fa-clock-rotate-left', 'delay-300')}
    ${this.componentKPI("Conv. Rate", `${stats.conversion_rate || 0}%`, 'brand-emerald', 'fa-bolt-lightning', 'delay-400')}
</section>

   <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 bg-[#030712]">
    <div class="lg:col-span-8 bg-white/[0.03] backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 relative group overflow-hidden shadow-2xl">
        <div class="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-700"></div>
        
        <div class="flex justify-between items-start mb-10 relative z-10">
            <div>
                <p class="text-[10px] tracking-[0.3em] font-bold text-cyan-400/50 uppercase mb-1">Market Velocity</p>
                <h2 class="text-2xl font-black tracking-tight text-white uppercase italic">Revenue & Reach</h2>
            </div>
            
            <div class="flex items-center gap-3">
                <button onclick="generatePremiumPDF()" class="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-lg transition-all active:scale-95">
                    <i class="fa-solid fa-arrow-up-right-from-square text-cyan-400 text-[10px]"></i>
                    <span class="font-mono text-[9px] font-bold text-white uppercase">Export</span>
                </button>

                <div class="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    ${[7, 14, 30, 60, 90].map(d => `
                        <button onclick="updateRevenueFilter(${d})" 
                            class="px-4 py-1.5 rounded-lg font-mono text-[10px] transition-all 
                            ${revenueFilter === d ? 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}">
                            ${d}D
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="h-[380px] w-full relative z-10">
            <canvas id="mainChart"></canvas>
        </div>
    </div>

    <div class="lg:col-span-4 flex flex-col gap-6">
        <div class="bg-white/[0.03] backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 flex-grow relative overflow-hidden group">
            <div class="flex justify-between items-center mb-6">
                <p class="text-[10px] tracking-widest font-bold text-slate-500 uppercase">Asset_Mix</p>
                <span class="bg-rose-500/10 text-rose-400 text-[9px] px-2 py-0.5 rounded-full border border-rose-500/20">Live</span>
            </div>

            <div class="h-[200px] relative">
                <canvas id="donutChart"></canvas>
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span class="text-slate-500 font-mono text-[9px] uppercase">Signals</span>
                    <span class="text-3xl font-black text-white italic tracking-tighter">${totalSignals}</span>
                </div>
            </div>
        </div>

        <div class="bg-white/[0.03] backdrop-blur-xl p-8 rounded-[2rem] border border-white/10">
            <p class="text-[10px] tracking-widest font-bold text-slate-500 uppercase mb-6">Top_Performers</p>
            <div class="space-y-3">
                ${topSellers.slice(0, 3).map((p, i) => `
                    <div class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer group" onclick="showLifecycle('${p.product_id}')">
                        <div class="flex items-center gap-3">
                            <span class="text-slate-600 font-mono text-[9px]">0${i+1}</span>
                            <p class="text-[11px] font-bold text-white/80 group-hover:text-cyan-400 uppercase transition-colors">${p.title}</p>
                        </div>
                        <p class="font-mono text-[10px] font-black text-emerald-400">${Number(p.total_revenue).toLocaleString()} <span class="text-[8px] opacity-50">ETB</span></p>
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
componentKPI(label, value, color, icon, delay, breakdown = null) {
    const breakdownHTML = breakdown ? `
        <div style="display:flex; gap:10px; margin-top:10px; align-items:center;">
            <span style="display:flex; align-items:center; gap:5px; font-size:11px; color:rgba(255,255,255,0.45);">
                <span style="width:6px;height:6px;border-radius:50%;background:#d4a200;flex-shrink:0;"></span>
                ${breakdown.club.toLocaleString()} Br.
            </span>
            <span style="color:rgba(255,255,255,0.15); font-size:10px;">|</span>
            <span style="display:flex; align-items:center; gap:5px; font-size:11px; color:rgba(255,255,255,0.45);">
                <span style="width:6px;height:6px;border-radius:50%;background:#378ADD;flex-shrink:0;"></span>
                ${breakdown.sales.toLocaleString()} Br.
            </span>
        </div>
    ` : '';

    return `
        <div class="glass-ui p-8 rounded-[2.5rem] border border-white/5 border-t-2 border-t-${color} relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 ${delay}">
            <div class="absolute inset-0 bg-gradient-to-br from-${color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p class="font-mono text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mb-1 group-hover:text-white transition-colors">${label}</p>
            <h3 class="text-4xl font-black text-white italic tracking-tighter mt-4 relative z-10 group-hover:translate-x-1 transition-transform duration-500">${value}</h3>
            ${breakdownHTML}
            <div class="absolute right-6 bottom-6 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-${color}/30 group-hover:rotate-12 transition-all duration-700">
                <i class="fa-solid ${icon} text-xl text-white/10 group-hover:text-${color} transition-colors"></i>
            </div>
        </div>
    `;
},

initCharts(data, demoData) {
    const canvasMain = document.getElementById('mainChart');
    if (!canvasMain) return;

    // Define the elements first
    const canvasDonut = document.getElementById('donutChart');
    const canvasDemo = document.getElementById('demoChart');

    // Safety check: if any are missing, stop
    if (!canvasMain || !canvasDonut || !canvasDemo) return;

    // Now define the contexts
    const ctxLine = canvasMain.getContext('2d');
    const ctxDonut = canvasDonut.getContext('2d');
    const ctxDemo = canvasDemo.getContext('2d');

    // Define distData (which was missing in your snippet)
    const distData = demoData.status || {};
    // --- GRADIENT ENGINES ---
    const revFill = ctxLine.createLinearGradient(0, 0, 0, 400);
    revFill.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
    revFill.addColorStop(1, 'rgba(34, 211, 238, 0)');

    const userFill = ctxLine.createLinearGradient(0, 0, 0, 400);
    userFill.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
    userFill.addColorStop(1, 'rgba(16, 185, 129, 0)');

    this.cleanupCharts();
    window.charts = window.charts || {};

   window.charts.main = createPremiumMainChart(ctxLine, data, { externalTooltip: 'tooltip-container', onPointClick: payload => console.log(payload) });
   

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
    // expose the current chart data globally so inline onclick can use it
window.currentRevenueData = {
  labels: Array.isArray(data.labels) ? data.labels : [],
  revenue_products: Array.isArray(data.revenue_products) ? data.revenue_products : [],
  revenue_club: Array.isArray(data.revenue_club) ? data.revenue_club : [],
  users: Array.isArray(data.users) ? data.users : [],
  days_limit: data.days_limit || (Array.isArray(data.labels) ? data.labels.length : 0)
};

// optional debug snapshot for quick console checks
window.currentRevenueSnapshot = {
  totalRev: (window.currentRevenueData.revenue || []).reduce((a,b) => a + (Number(b)||0), 0),
  totalUsers: (window.currentRevenueData.users || []).reduce((a,b) => a + (Number(b)||0), 0),
  arpu: (window.currentRevenueData.users || []).reduce((a,b)=>a+(Number(b)||0),0) > 0
        ? ((window.currentRevenueData.revenue || []).reduce((a,b)=>a+(Number(b)||0),0) / (window.currentRevenueData.users || []).reduce((a,b)=>a+(Number(b)||0),0))
        : 0
};

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

window.updateRevenueFilter = async (days) => {
    // 1. Update the local state
    revenueFilter = days;

    try {
        // 2. Fetch the new dual-stream data (Revenue + Users)
        const res = await fetch(`${API_BASE}/stats/revenue?days=${days}`);
        const data = await res.json();
        
        // 3. Store data globally so generatePremiumPDF() can access it later
        window.currentRevenueData = data; 
        
        /** * 4. Update the UI. 
         * We call renderDashboard but pass the fresh data 
         * to avoid a second redundant fetch inside the render function.
         */
        router.renderDashboard(data);

    } catch (error) {
        console.error("CRITICAL_SYNC_ERROR: Could not update revenue filter.", error);
    }
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
        
        // UI Elements
        const revInput    = document.getElementById('payout-revenue'); 
        const dedInput    = document.getElementById('payout-deductions'); 
        const noteInput   = document.getElementById('payout-note');
        const cumDisplay  = document.getElementById('cumulative-profit-display'); 
        const tierDisplay = document.getElementById('display-tier');
        const historyBody = document.getElementById('payout-history-body');
        const confirmBtn  = document.getElementById('confirm-payout-btn');
        const kpiGross    = document.getElementById('kpi-gross');
        const kpiBurn     = document.getElementById('kpi-burn');
        const kpiEff      = document.getElementById('kpi-efficiency');
        const progBar     = document.getElementById('tier-progress-bar');
        const progLabel   = document.getElementById('tier-label');
        const progPercent = document.getElementById('tier-percent');

        let currentMode = 'payout'; 

        // --- 1. CORE NUMBERS ---
        const ltGross = data.lifetime_gross            || 0;
        const ltProd  = data.lifetime_products_gross   || 0;
        const ltClub  = data.lifetime_club_gross       || 0;
        const ltBurn  = data.lifetime_burn             || 0;
        const netProfit = data.cumulative_profit       || 0;

        const netFromClub  = ltClub;
        const netFromSales = netProfit - ltClub;

        // --- 2. INJECT KPI CARDS ---
        revInput.value = netProfit.toFixed(2);
        cumDisplay.innerText = `${netProfit.toLocaleString()} Br`;

        kpiGross.innerText = `${ltGross.toLocaleString()} Br`;
        kpiBurn.innerText  = `${ltBurn.toLocaleString()} Br`;
        kpiEff.innerText   = `${data.efficiency}%`;

        // Gross breakdown
        const grossClubEl  = document.getElementById('kpi-gross-club');
        const grossSalesEl = document.getElementById('kpi-gross-sales');
        if (grossClubEl)  grossClubEl.innerText  = ltClub.toLocaleString();
        if (grossSalesEl) grossSalesEl.innerText = ltProd.toLocaleString();

        // Net breakdown (each stream's gross minus its share of burn)
        const netSalesEl = document.getElementById('kpi-net-sales');
        const netClubEl  = document.getElementById('kpi-net-club');
        if (netSalesEl) netSalesEl.innerText = netFromSales.toLocaleString(undefined, { maximumFractionDigits: 0 });
        if (netClubEl)  netClubEl.innerText  = netFromClub.toLocaleString(undefined,  { maximumFractionDigits: 0 });

        // --- 3. TIER PROGRESS ---
        progBar.style.width  = `${data.tier_progress}%`;
        progPercent.innerText = `${data.tier_progress}%`;
        progLabel.innerText   = data.current_tier === 1 ? "Progress_to_Tier_2" : "Tier_2_Active_Limitless";

        if (data.trend_labels && data.trend_data) {
            initTrendChart(data.trend_labels, data.trend_data);
        }

        // --- 4. CALCULATION ENGINE ---
        const updateCalculations = () => {
            const availableNet = parseFloat(revInput.value) || 0; 
            const currentExp   = parseFloat(dedInput.value) || 0;
            const tier         = data.current_tier;
            const coachRatio   = tier === 1 ? 0.6 : 0.7;
            const dagRatio     = tier === 1 ? 0.4 : 0.3;

            const coachShareEl    = document.getElementById('display-coach-share');
            const dagShareEl      = document.getElementById('display-dag-share');
            const shareGrid       = document.getElementById('share-display-grid');
            const revenueContainer = document.getElementById('payout-revenue-container');

            if (currentMode === 'expense_only') {
                coachShareEl.innerText = "0.00 Br";
                dagShareEl.innerText   = "0.00 Br";
                shareGrid.style.opacity = "0.1"; 
                revenueContainer?.classList.add('opacity-30');
                tierDisplay.innerText = "MODE // STANDALONE_EXPENSE_LOG";
                confirmBtn.innerText  = "Log_Expense_Only";
                confirmBtn.classList.replace('bg-brand-cyan', 'bg-brand-rose');
            } else {
                const distributable = Math.max(0, availableNet - currentExp);
                coachShareEl.innerText = `${(distributable * coachRatio).toLocaleString(undefined, { maximumFractionDigits: 2 })} Br`;
                dagShareEl.innerText   = `${(distributable * dagRatio).toLocaleString(undefined,   { maximumFractionDigits: 2 })} Br`;
                shareGrid.style.opacity = "1";
                revenueContainer?.classList.remove('opacity-30');
                tierDisplay.innerText = `ACTIVE // TIER_${tier} (${(coachRatio*100).toFixed(0)}/${(dagRatio*100).toFixed(0)}_SPLIT)`;
                confirmBtn.innerText  = "Complete_Payout_&_Save";
                confirmBtn.classList.replace('bg-brand-rose', 'bg-brand-cyan');
            }
        };

        // --- 5. MODE TOGGLES ---
        document.getElementById('mode-payout').onclick = () => {
            currentMode = 'payout';
            document.getElementById('mode-payout').className  = "flex-1 py-3 rounded-xl text-[9px] font-black font-mono transition-all bg-brand-cyan text-slate-950 uppercase";
            document.getElementById('mode-expense').className = "flex-1 py-3 rounded-xl text-[9px] font-black font-mono transition-all text-slate-500 hover:text-white uppercase";
            revInput.disabled = false;
            updateCalculations();
        };

        document.getElementById('mode-expense').onclick = () => {
            currentMode = 'expense_only';
            document.getElementById('mode-expense').className = "flex-1 py-3 rounded-xl text-[9px] font-black font-mono transition-all bg-brand-rose text-white uppercase";
            document.getElementById('mode-payout').className  = "flex-1 py-3 rounded-xl text-[9px] font-black font-mono transition-all text-slate-500 hover:text-white uppercase";
            revInput.disabled = true;
            updateCalculations();
        };

        dedInput.addEventListener('input', updateCalculations);
        revInput.addEventListener('input', updateCalculations);
        updateCalculations();

        // --- 6. RENDER HISTORY ---
        renderHistory(history, historyBody);

        // --- 7. EXECUTION HANDLER ---
        confirmBtn.onclick = async () => {
            const amount     = currentMode === 'payout' ? parseFloat(revInput.value) : parseFloat(dedInput.value);
            const deductions = currentMode === 'payout' ? parseFloat(dedInput.value) : 0;
            const note       = noteInput.value.trim();

            if (amount <= 0 && currentMode === 'payout')      return toast("ENTER FUNDS TO SPLIT", "error");
            if (amount <= 0 && currentMode === 'expense_only') return toast("ENTER EXPENSE AMOUNT", "error");
            if (!note) return toast("MEMO REQUIRED", "error");

            if (!confirm(currentMode === 'payout'
                ? "Authorize Payout? This splits profit and reduces the War Chest."
                : "Log Standalone Expense? This hits the War Chest without share split."
            )) return;
            
            confirmBtn.disabled = true;
            confirmBtn.innerText = "SYNCING...";

            try {
                const response = await fetch(`${API_BASE}/payouts/confirm`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, deductions, note, entry_type: currentMode })
                });

                if (response.ok) {
                    toast(currentMode === 'payout' ? "FINANCIAL_SYNC_COMPLETE" : "EXPENSE_ARCHIVED");
                    dedInput.value  = "";
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





/**
 * Data‑Dense Technical Report PDF exporter
 * - Inline-friendly: call with no args (reads window.currentRevenueData and window.logoDataUrl)
 * - Defensive normalization and clear user feedback
 * - Uses Chart.js instance image when available (window.charts.main.toBase64Image())
 * - Avoids invalid jsPDF color/alpha calls; uses GState for opacity when supported
 * - Returns { doc, blob, filename } and auto-downloads by default
 */
async function generatePremiumPDF({ data = null, onProgress = () => {}, autoDownload = true } = {}) {
  const progress = pct => {
    try { onProgress(Math.max(0, Math.min(100, Math.round(pct)))); } catch (e) {}
  };

  // Validate jsPDF
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('Export unavailable: jsPDF not loaded.');
    return Promise.reject(new Error('Missing jsPDF'));
  }

  // Acquire and normalize data
  data = data || window.currentRevenueData || {};
  const labels = Array.isArray(data.labels) ? data.labels.slice() : [];
    const revenue_products = (Array.isArray(data.revenue_products) ? data.revenue_products : []).map(v => Number(v) || 0);
    const revenue_club = (Array.isArray(data.revenue_club) ? data.revenue_club : []).map(v => Number(v) || 0);
    const revenue = revenue_products.map((v, i) => v + (revenue_club[i] || 0)); // combined for KPI math
    const users = (Array.isArray(data.users) ? data.users.slice() : new Array(labels.length).fill(0)).map(v => Number(v) || 0);
  const days = data.days_limit || labels.length || 0;

  if (labels.length === 0) {
    alert('No data to export. Please load the chart first.');
    return Promise.reject(new Error('No labels'));
  }

  progress(10);

  // Analytics
  const totalRevenue = revenue.reduce((a, b) => a + b, 0);
  const totalUsers = users.reduce((a, b) => a + b, 0);
  const arpu = totalUsers > 0 ? (totalRevenue / totalUsers) : 0;

  const mid = Math.floor(revenue.length / 2);
  const prevPeriodRev = revenue.slice(0, mid).reduce((a, b) => a + b, 0);
  const currentPeriodRev = revenue.slice(mid).reduce((a, b) => a + b, 0);
  const revenueGrowth = prevPeriodRev > 0 ? ((currentPeriodRev - prevPeriodRev) / prevPeriodRev) * 100 : 0;

  const prevUsers = users.slice(0, mid).reduce((a, b) => a + b, 0);
  const currentUsers = users.slice(mid).reduce((a, b) => a + b, 0);
  const userGrowth = prevUsers > 0 ? ((currentUsers - prevUsers) / prevUsers) * 100 : 0;

  progress(30);

  // Prepare PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  // Color tokens (RGB arrays)
  const TOKENS = {
    bg: [3, 7, 18],         // deep obsidian
    surface: [17, 24, 39],  // slate surface
    accent: [34, 211, 238], // cyan
    text: [248, 250, 252],  // near-white
    muted: [100, 116, 139], // slate muted
    pos: [16, 185, 129],    // emerald
    neg: [244, 63, 94]      // danger
  };

  // Safe helper: set text color from array or numbers
  const setTextColorSafe = (c) => {
    if (Array.isArray(c)) doc.setTextColor(...c);
    else if (typeof c === 'string') doc.setTextColor(c);
    else doc.setTextColor(0, 0, 0);
  };

  // Watermark helper (uses GState if available)
  function addWatermark(pageNum) {
    try {
      doc.setPage(pageNum);
      doc.setFontSize(40);
      // Try to apply opacity via GState if supported
      if (typeof doc.GState === 'function') {
        try {
          const g = new doc.GState({ opacity: 0.06 });
          doc.setGState(g);
        } catch (e) {
          // ignore if constructor not supported
        }
      }
      setTextColorSafe([220, 220, 220]);
      doc.text('REVENUE PERFORMANCE', 105, 150, { align: 'center', angle: 45 });
      // Reset GState if possible
      if (typeof doc.GState === 'function') {
        try {
          const gReset = new doc.GState({ opacity: 1 });
          doc.setGState(gReset);
        } catch (e) {}
      }
    } catch (err) {
      // Fail silently — watermark is decorative
      console.warn('Watermark skipped', err);
    }
  }

  // Draw background full page
  const drawBackground = () => {
    doc.setFillColor(...TOKENS.bg);
    doc.rect(0, 0, 210, 297, 'F');
  };

  // --- Page 1: Header + KPI grid + chart snapshot ---
  drawBackground();

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setTextColorSafe(TOKENS.text);
  doc.text('REVENUE PERFORMANCE REPORT', 15, 18);

  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  setTextColorSafe(TOKENS.accent);
  doc.text(`INTERVAL: ${labels.length} DAYS  |  GENERATED: ${new Date().toISOString().split('T')[0]}`, 15, 24);

  // KPI cards (3 columns)
  const cardW = 60, cardH = 34, cardY = 32, gap = 8, startX = 15;
  const drawCard = (x, title, main, sub, trendPositive) => {
    // card background (subtle surface)
    doc.setFillColor(...TOKENS.surface);
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F');

    // title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTextColorSafe(TOKENS.muted);
    doc.text(title.toUpperCase(), x + 4, cardY + 7);

    // main value
    doc.setFontSize(13);
    setTextColorSafe(TOKENS.text);
    doc.text(main, x + 4, cardY + 20);

    // sub / trend
    doc.setFontSize(8);
    setTextColorSafe(trendPositive ? TOKENS.pos : TOKENS.neg);
    doc.text(sub, x + 4, cardY + 28);
  };

  drawCard(startX, 'Total Revenue', `${totalRevenue.toLocaleString()} ETB`, `${revenueGrowth.toFixed(1)}% vs prev`, revenueGrowth >= 0);
  drawCard(startX + cardW + gap, 'User Acquisition', `${totalUsers.toLocaleString()} Users`, `${userGrowth.toFixed(1)}% vs prev`, userGrowth >= 0);
  drawCard(startX + (cardW + gap) * 2, 'ARPU', `${arpu.toFixed(2)} ETB`, 'Revenue per user', true);

  // Chart snapshot: prefer Chart.js instance image, fallback to generated chart if needed
  try {
    if (window.charts && window.charts.main && typeof window.charts.main.toBase64Image === 'function') {
      const chartImg = window.charts.main.toBase64Image();
      doc.addImage(chartImg, 'PNG', 15, 80, 180, 85);
    } else if (window.Chart) {
      // attempt to render a fresh high-res chart to canvas and embed
      const canvas = document.createElement('canvas');
      const DPR = Math.max(1, window.devicePixelRatio || 1);
      const w = 1200, h = 480;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      ctx.scale(DPR, DPR);
      // Minimal chart for snapshot (no tooltips)
      new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ data: revenue, borderColor: 'rgba(34,211,238,0.95)', backgroundColor: 'rgba(34,211,238,0.08)', fill: true, tension: 0.28, pointRadius: 2 }] },
        options: { responsive: false, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
      });
      await new Promise(r => setTimeout(r, 80));
      const dataUrl = canvas.toDataURL('image/png', 0.92);
      doc.addImage(dataUrl, 'PNG', 15, 80, 180, 85);
    } else {
      // no chart available
      doc.setFontSize(10);
      setTextColorSafe([180, 180, 180]);
      doc.text('Chart snapshot unavailable', 105, 120, { align: 'center' });
    }
  } catch (e) {
    console.warn('Chart embed failed', e);
    doc.setFontSize(10);
    setTextColorSafe([180, 180, 180]);
    doc.text('Chart snapshot unavailable', 105, 120, { align: 'center' });
  }

  progress(70);

  // --- Page 2: Detailed table (monospaced) ---
  doc.addPage();
  drawBackground();

  // Table header
  const tableStartY = 30;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  setTextColorSafe(TOKENS.accent);
    doc.text('DATE'.padEnd(20) + 'PROD_REV'.padStart(12) + '  CLUB_REV'.padStart(12) + '  USERS'.padStart(8) + '  ARPU'.padStart(10), 15, tableStartY);

  // Table rows (monospaced alignment)
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  setTextColorSafe([220, 220, 220]);

  let y = tableStartY + 8;
  const lineHeight = 6;
  const pageBottom = 280;

  for (let i = 0; i < labels.length; i++) {
    if (y > pageBottom) {
      doc.addPage();
      drawBackground();
      y = 20;
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      setTextColorSafe(TOKENS.accent);
      doc.text('DATE'.padEnd(20) + 'REVENUE'.padStart(12) + '  NEW_USERS'.padStart(12) + '  ARPU'.padStart(10), 15, y);
      y += 8;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      setTextColorSafe([220, 220, 220]);
    }

    const date = String(labels[i]).padEnd(20);
    const prodStr = revenue_products[i].toLocaleString().padStart(12);
    const clubStr = revenue_club[i].toLocaleString().padStart(12);
    const usersStr = users[i].toLocaleString().padStart(8);
    const arpuStr = (users[i] > 0 ? (revenue[i] / users[i]).toFixed(2) : '0.00').padStart(10);
    doc.text(`${date}${prodStr}  ${clubStr}  ${usersStr}  ${arpuStr}`, 15, y);
    y += lineHeight;
  }

  progress(90);

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTextColorSafe(TOKENS.muted);
    doc.text(`CONFIDENTIAL • INTERNAL USE ONLY  •  PAGE ${p} OF ${pageCount}`, 105, 292, { align: 'center' });
    addWatermark(p);
  }

  progress(100);

  // Output
  const filename = `Revenue_Performance_${labels.length}D_${Date.now()}.pdf`;
  const blob = doc.output ? doc.output('blob') : null;

  if (autoDownload) {
    try {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        // fallback to jsPDF save
        doc.save(filename);
      }
    } catch (e) {
      console.warn('Auto-download failed', e);
    }
  }

  return { doc, blob, filename };
}

      
function createPremiumMainChart(ctx, data, opts = {}) {
  // High-DPI safety: ensure canvas is crisp (caller may already scale; this is defensive)
  (function ensureHiDPI(canvas) {
    try {
      const DPR = Math.max(1, window.devicePixelRatio || 1);
      const w = canvas.clientWidth || 900;
      const h = canvas.clientHeight || 420;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      const ctx2 = canvas.getContext('2d');
      ctx2.setTransform(DPR, 0, 0, DPR, 0, 0);
    } catch (e) {}
  })(ctx.canvas);

  // Shared tokens
  const TOKENS = {
    revenue: '#22d3ee',
    revenueGlow: 'rgba(34,211,238,0.18)',
    user: '#10b981',
    ghostBar: 'rgba(255,255,255,0.03)',
    tooltipBg: 'rgba(7,16,36,0.95)',
    axis: '#475569',
    font: 'JetBrains Mono, monospace'
  };

  // Custom plugin: glow + shadow for the line and halo points
  const glowPlugin = {
    id: 'glowPlugin',
    beforeDatasetDraw(chart, args, pluginOptions) {
      const { ctx: c } = chart;
      const dataset = chart.data.datasets[args.index];
      if (dataset.type !== 'line') return;

      c.save();
      // draw glow by stroking the line multiple times with increasing blur
      c.shadowColor = pluginOptions.shadowColor || TOKENS.revenueGlow;
      c.shadowBlur = pluginOptions.shadowBlur || 18;
      c.globalCompositeOperation = 'lighter';
      // draw the line path again to create glow
      chart.getDatasetMeta(args.index).dataset.draw(c);
      c.restore();
    }
  };

  // Custom plugin: halo points (draw large translucent ring behind points)
  const haloPlugin = {
    id: 'haloPlugin',
    afterDatasetDraw(chart, args) {
      const { ctx: c } = chart;
      const meta = chart.getDatasetMeta(0); // assume revenue is dataset 0
      if (!meta || !meta.data) return;
      c.save();
      meta.data.forEach((point, i) => {
        const p = point.getProps(['x', 'y'], true);
        // subtle halo only for visible points
        c.beginPath();
        c.arc(p.x, p.y, 10, 0, Math.PI * 2);
        c.fillStyle = 'rgba(34,211,238,0.06)';
        c.fill();
      });
      c.restore();
    }
  };

  // External tooltip handler (renders a polished HTML tooltip)
  function createExternalTooltip(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return (context) => {};
    container.style.pointerEvents = 'none';
    container.classList.add('chart-external-tooltip');
    return function externalTooltip(context) {
      const tooltipModel = context.tooltip;
      if (tooltipModel.opacity === 0) {
        container.style.opacity = 0;
        return;
      }
      const title = tooltipModel.title || [];
      const body = tooltipModel.body || [];
      container.innerHTML = `
        <div style="background:${TOKENS.tooltipBg};color:#fff;padding:10px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,0.45);font-family:${TOKENS.font};min-width:140px;">
          <div style="font-weight:700;margin-bottom:6px;">${title.join(' ')}</div>
          ${body.map(b => `<div style="font-size:13px;">${b.lines.join('')}</div>`).join('')}
        </div>
      `;
      container.style.opacity = 1;
    };
  }

  // Build chart
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
  {
    type: 'line',
    label: 'PRODUCT SALES (BR)',
    data: data.revenue_products,
    borderColor: TOKENS.revenue,
    borderWidth: 3,
    tension: 0.36,
    fill: true,
    backgroundColor: (ctxLine) => {
      try {
        const c = ctxLine.chart.ctx;
        const g = c.createLinearGradient(0, 0, 0, ctxLine.chart.height);
        g.addColorStop(0, 'rgba(34,211,238,0.22)');
        g.addColorStop(1, 'rgba(34,211,238,0)');
        return g;
      } catch (e) { return TOKENS.revenueGlow; }
    },
    pointBackgroundColor: TOKENS.revenue,
    pointBorderColor: 'rgba(34,211,238,0.4)',
    pointBorderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 4,
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderWidth: 12,
    yAxisID: 'yRevenue',
    order: 1
  },
  {
    type: 'line',
    label: 'CLUB REVENUE (BR)',
    data: data.revenue_club,
    borderColor: '#f59e0b',
    borderWidth: 2,
    borderDash: [5, 4],
    tension: 0.36,
    fill: false,
    pointBackgroundColor: '#f59e0b',
    pointBorderColor: 'rgba(245,158,11,0.4)',
    pointBorderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
    pointHoverBackgroundColor: '#fff',
    yAxisID: 'yRevenue',
    order: 2
  },
  {
    type: 'bar',
    label: 'NEW USERS',
    data: data.users,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    hoverBackgroundColor: 'rgba(99, 102, 241, 0.55)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
    borderWidth: 1,
    borderRadius: 6,
    barPercentage: 0.42,
    yAxisID: 'yUsers',
    order: 3
  },
]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1600,
        easing: 'easeOutQuart'
      },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: TOKENS.axis, font: { family: TOKENS.font, size: 10 } }
        },
        yRevenue: {
          position: 'left',
          grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
          ticks: {
            color: TOKENS.revenue,
            font: { family: TOKENS.font, size: 10 },
            callback: v => (Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : v)
          }
        },
        yUsers: {
          display: false
        }
      },
      plugins: {
        legend: {
        display: true, // Turn it back on
        position: 'top',
        align: 'end',
        labels: {
            color: '#94a3b8', // Slate-400
            font: { family: TOKENS.font, size: 10, weight: '600' },
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20
        },
        // This adds a "dimming" effect to the one you aren't looking at
        onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            const meta = ci.getDatasetMeta(index);

            // Toggle visibility
            meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
            
            ci.update();
        }
    },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: TOKENS.tooltipBg,
          borderColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          padding: 10,
          titleFont: { family: TOKENS.font, size: 11, weight: '700' },
          bodyFont: { family: TOKENS.font, size: 12 },
          callbacks: {
  label: function(context) {
    const label = context.dataset.label || '';
    const value = context.parsed.y;
    if (label.includes('REVENUE') || label.includes('SALES')) {
      return `${label}: ${Intl.NumberFormat().format(value)} Br.`;
    }
    return `${label}: ${value}`;
  },
  afterBody: function(items) {
    const idx = items[0]?.dataIndex;
    const rev = (data.revenue_products[idx] || 0) + (data.revenue_club[idx] || 0);
    const usr = data.users[idx] || 0;
    const combined = `COMBINED: ${Intl.NumberFormat().format(rev)} Br.`;
    if (usr > 0) return [combined, `ARPU: ${(rev / usr).toFixed(1)} Br.`];
    return [combined];
  }
},
          external: opts.externalTooltip ? createExternalTooltip(opts.externalTooltip) : undefined
        }
      },
      onClick(evt, elements) {
        if (!elements.length) return;
        const el = elements[0];
        const idx = el.index;
        const payload = { index: idx, label: data.labels[idx], revenue: data.revenue[idx], users: data.users[idx] };
        // user callback
        if (typeof opts.onPointClick === 'function') opts.onPointClick(payload);
        // analytics event
        try { window.analytics?.track?.('chart_point_click', payload); } catch (e) {}
      }
    },
    plugins: [glowPlugin, haloPlugin]
  });

  // Keyboard navigation (left/right) to focus points and show tooltip
  (function attachKeyboardNav(chartInstance) {
    let focused = 0;
    function showFocus(i) {
      focused = Math.max(0, Math.min(chartInstance.data.labels.length - 1, i));
      chartInstance.setActiveElements([{ datasetIndex: 0, index: focused }]);
      chartInstance.tooltip.setActiveElements([{ datasetIndex: 0, index: focused }], { x: 0, y: 0 });
      chartInstance.update();
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { showFocus(focused + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { showFocus(focused - 1); e.preventDefault(); }
      if (e.key === 'Enter') {
        const idx = focused;
        const payload = { index: idx, label: chartInstance.data.labels[idx], revenue: data.revenue[idx], users: data.users[idx] };
        if (typeof opts.onPointClick === 'function') opts.onPointClick(payload);
      }
    });
  })(chart);

  // Export helper: returns a high-res PNG dataURL for embedding in PDFs
  async function exportHighRes(width = 1600, height = 800) {
    const DPR = Math.max(1, window.devicePixelRatio || 1);
    const off = document.createElement('canvas');
    off.width = Math.round(width * DPR);
    off.height = Math.round(height * DPR);
    off.style.width = `${width}px`;
    off.style.height = `${height}px`;
    const offCtx = off.getContext('2d');
    offCtx.scale(DPR, DPR);
    const img = new Image();
    img.src = chart.toBase64Image('image/png', 1);
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    offCtx.drawImage(img, 0, 0, width, height);
    return off.toDataURL('image/png', 0.92);
  }

  // Attach export helper and snapshot to chart instance for convenience
  chart.exportHighRes = exportHighRes;
  chart.snapshot = () => {
    const totalRev = (data.revenue || []).reduce((a, b) => a + (b || 0), 0);
    const totalUsers = (data.users || []).reduce((a, b) => a + (b || 0), 0);
    return { totalRev, totalUsers, arpu: totalUsers ? (totalRev / totalUsers) : 0 };
  };

  return chart;
}
