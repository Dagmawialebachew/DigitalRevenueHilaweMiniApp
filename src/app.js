/**
 * HILAWE | SOVEREIGN COMMAND V3
 * Ultra High-End Admin Control Logic
 */

const API_BASE = "https://digitalrevenuehilawe.onrender.com/api/admin";
let charts = {}; 
let revenueFilter = 7; // Default filter state

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
            }
        } catch (err) {
            console.error("Navigation Failure:", err);
            toast("Connection Terminated", "error");
        }
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
    const [statsRes, paymentsRes, revenueRes, distributionRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/payments/recent`),
        fetch(`${API_BASE}/stats/revenue?days=${revenueFilter}`),
        fetch(`${API_BASE}/stats/distribution`)
    ]);
    
    const [stats, payments, revData, distData] = await Promise.all([
        statsRes.json(), paymentsRes.json(), revenueRes.json(), distributionRes.json()
    ]);
    const pending = Number(distData.pending || 0);
    const approved = Number(distData.approved || 0);
    const rejected = Number(distData.rejected || 0);
    const totalSignals = pending + approved + rejected;

    const kpi = {
        revenue: stats.total_revenue || stats.revenue || 0,
        pending: stats.pending_payments || stats.pending || 0,
        users: stats.active_users || stats.users || 0,
        conversion: stats.conversion_rate || stats.conversion || 0
    };

    const outlet = document.getElementById('router-outlet');

    outlet.innerHTML = `
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in">
            ${this.componentKPI("Total Profit", `${Number(kpi.revenue).toLocaleString()} Br.`, 'brand-gold', 'fa-vault', 'delay-100')}
            ${this.componentKPI("Pending Payments", kpi.pending, 'brand-cyan', 'fa-clock-rotate-left', 'delay-200')}
            ${this.componentKPI("Total Users", kpi.users, 'slate-400', 'fa-network-wired', 'delay-300')}
            ${this.componentKPI("Conversion rate", `${kpi.conversion}%`, 'brand-emerald', 'fa-bolt-lightning', 'delay-400')}
        </section>

        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 glass-ui p-10 rounded-[3.5rem] relative group border border-white/5 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                
                <div class="flex justify-between items-end mb-12 relative z-10">
                    <div>
                        <h4 class="font-mono text-[10px] uppercase tracking-[0.5em] font-black text-brand-cyan/60 mb-2">Market Volatility Index</h4>
                        <div class="flex items-center gap-3">
                            <h2 class="text-3xl font-black italic text-white tracking-tighter">FINANCIAL PULSE</h2>
                            <span class="px-2 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-mono text-[8px] animate-pulse">LIVE SYNC</span>
                        </div>
                    </div>
                    <div class="flex gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                        ${[7, 14, 30].map(d => `
                            <button onclick="updateRevenueFilter(${d})" 
                                class="px-5 py-2 rounded-xl font-mono text-[10px] uppercase transition-all duration-500 
                                ${revenueFilter === d ? 'bg-brand-cyan text-black font-black shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}">
                                ${d}D
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="h-[380px] w-full relative z-10">
                    <canvas id="mainChart"></canvas>
                </div>
            </div>
            
            <div class="flex flex-col gap-8">
                <div class="glass-ui p-10 rounded-[3.5rem] border border-white/5 h-[340px] flex flex-col justify-between">
                     <h4 class="font-mono text-[10px] uppercase tracking-[0.4em] font-black text-slate-500">Asset Distribution</h4>
                     <div class="h-[200px] relative mt-4">
                        <canvas id="donutChart"></canvas>
                        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-10px]">
                            <span class="text-slate-500 font-mono text-[8px] uppercase tracking-tighter">Total Signals</span>
                            <span class="text-2xl font-black text-white italic">${pending + approved + rejected}</span>
                        </div>
                     </div>
                </div>

                <div class="glass-ui p-8 rounded-[3.5rem] border border-white/5 flex-grow overflow-hidden relative">
                    <div class="flex justify-between items-center mb-6">
                        <h4 class="font-mono text-[10px] uppercase tracking-[0.4em] font-black text-slate-500">Signal Feed</h4>
                        <i class="fa-solid fa-satellite-dish text-brand-cyan animate-pulse text-[10px]"></i>
                    </div>
                    <div class="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                        ${payments.length ? payments.slice(0, 6).map(p => `
                            <div class="p-4 bg-white/[0.03] border border-white/5 rounded-[1.5rem] flex items-center justify-between hover:bg-brand-cyan/[0.04] hover:border-brand-cyan/20 transition-all duration-300 group cursor-crosshair">
                                <div class="flex items-center gap-4">
                                    <div class="w-1.5 h-1.5 rounded-full ${p.status === 'pending' ? 'bg-brand-gold shadow-[0_0_10px_#facc15]' : 'bg-brand-emerald shadow-[0_0_10px_#10b981]'}"></div>
                                    <div>
                                        <p class="font-mono text-[10px] text-white uppercase font-black tracking-tight">${p.full_name || 'ANON_NODE'}</p>
                                        <p class="text-[8px] font-mono text-slate-600 uppercase">UID: ${Math.random().toString(36).substr(2, 5).toUpperCase()}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-[11px] font-mono font-black text-brand-cyan group-hover:scale-110 transition-transform">${Number(p.amount).toLocaleString()} Br.</p>
                                    <p class="text-[7px] font-mono text-slate-500 uppercase">ACCEPTED</p>
                                </div>
                            </div>
                        `).join('') : '<p class="text-center font-mono text-[10px] text-slate-700 py-10">NO ACTIVE SIGNALS</p>'}
                    </div>
                </div>
            </div>
        </section>
    `;

    this.initCharts(revData, distData);
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

initCharts(revData, distData) {
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

    async renderProducts() {
        const res = await fetch(`${API_BASE}/products`);
        const products = await res.json();
        const outlet = document.getElementById('router-outlet');

        outlet.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                ${products.map(p => `
                    <div class="glass-ui p-8 rounded-[3rem] group border border-white/5 hover:border-brand-cyan/30 transition-all duration-500">
                        <div class="flex justify-between items-start mb-6">
                            <span class="px-3 py-1 bg-white/5 text-slate-400 text-[8px] font-mono rounded-full uppercase italic">${p.language}</span>
                            <i class="fa-solid fa-microchip text-slate-700 group-hover:text-brand-cyan transition-colors"></i>
                        </div>
                        <h4 class="text-xl font-black text-white italic uppercase tracking-tighter mb-4">${p.title}</h4>
                        <div class="flex justify-between items-end">
                            <div class="text-2xl font-black text-white italic">${p.price} Br.</div>
                            <button class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 hover:text-brand-rose transition-all">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

// --- GLOBAL HELPERS ---

window.updateRevenueFilter = (days) => {
    revenueFilter = days;
    router.renderDashboard();
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

// --- INIT ---

window.addEventListener('DOMContentLoaded', () => {
    router.navigate('dashboard');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => router.navigate(link.getAttribute('data-view')));
});