const API_BASE = "http://localhost:8000/api/admin";

const router = {
    currentPage: 'dashboard',

    async navigate(page) {
        this.currentPage = page;
        document.getElementById('page-title').innerText = page;
        
        // Update Sidebar Active State
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if(el.innerText.toLowerCase().includes(page)) el.classList.add('active');
        });

        const outlet = document.getElementById('router-outlet');
        outlet.innerHTML = `<div class="flex justify-center py-20"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div></div>`;

        if (page === 'dashboard') await this.renderDashboard();
        if (page === 'payments') await this.renderPayments();
    },

    async renderDashboard() {
        try {
            const res = await fetch(`${API_BASE}/stats`);
            const stats = await res.json();

            document.getElementById('router-outlet').innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    ${this.statCard("Total Revenue", `$${stats.total_revenue}`, "fa-sack-dollar", "text-green-400")}
                    ${this.statCard("Pending Approvals", stats.pending_payments, "fa-clock", "text-orange-400")}
                    ${this.statCard("Active Users", stats.active_users, "fa-users", "text-blue-400")}
                    ${this.statCard("Conversion", `${stats.conversion_rate}%`, "fa-bolt", "text-brand-gold")}
                </div>
                
                <div class="glass-card p-8">
                    <h3 class="text-white font-bold mb-6">Recent Activity</h3>
                    <div id="recent-payments-list" class="space-y-4">
                        <p class="text-slate-500 text-sm italic">Accessing database uplink...</p>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error("Uplink failed", e);
        }
    },

    statCard(title, value, icon, iconColor) {
        return `
            <div class="glass-card p-6 border-t-2 border-transparent hover:border-brand-gold transition-all duration-500">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[10px] uppercase tracking-widest text-slate-500 font-bold">${title}</span>
                    <i class="fa-solid ${icon} ${iconColor} opacity-50"></i>
                </div>
                <div class="text-3xl font-800 text-white tracking-tighter">${value}</div>
            </div>
        `;
    },

    async renderPayments() {
        const res = await fetch(`${API_BASE}/payments/recent`);
        const data = await res.json();
        
        const rows = data.map(p => `
            <tr class="table-row-hover">
                <td class="py-4 px-4 text-sm text-white font-medium">${p.full_name}</td>
                <td class="py-4 px-4 text-xs text-slate-400 font-mono">${p.title}</td>
                <td class="py-4 px-4 text-sm font-bold text-brand-gold">$${p.amount}</td>
                <td class="py-4 px-4">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-400'}">
                        ${p.status}
                    </span>
                </td>
                <td class="py-4 px-4 text-right">
                    <button onclick="verifyPayment(${p.id}, 'approved')" class="text-[10px] font-bold uppercase text-slate-400 hover:text-white mr-4">Approve</button>
                    <button onclick="verifyPayment(${p.id}, 'rejected')" class="text-[10px] font-bold uppercase text-rose-500/70 hover:text-rose-500">Reject</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('router-outlet').innerHTML = `
            <div class="glass-card overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-white/[0.02] border-b border-white/5">
                        <tr>
                            <th class="py-4 px-4 text-[10px] uppercase tracking-widest text-slate-500">Client</th>
                            <th class="py-4 px-4 text-[10px] uppercase tracking-widest text-slate-500">Product</th>
                            <th class="py-4 px-4 text-[10px] uppercase tracking-widest text-slate-500">Amount</th>
                            <th class="py-4 px-4 text-[10px] uppercase tracking-widest text-slate-500">Status</th>
                            <th class="py-4 px-4 text-right text-[10px] uppercase tracking-widest text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }
};

// Global verification function
async function verifyPayment(id, status) {
    await fetch(`${API_BASE}/payments/${id}/verify`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ status })
    });
    router.navigate('payments'); // Refresh view
}

// Initial Load
window.addEventListener('DOMContentLoaded', () => router.navigate('dashboard'));