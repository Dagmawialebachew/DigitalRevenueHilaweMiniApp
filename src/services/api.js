/**
 * HILAWE SOVEREIGN COMMAND // API CLIENT
 * Resilient decoupled client interfacing with DigitalRevenueHilawe backend
 */

export const API_BASE = "https://digitalrevenuehilawe.onrender.com/api/admin";
export const API_ROOT = "https://digitalrevenuehilawe.onrender.com/api";

const defaultHeaders = {
  "Content-Type": "application/json",
};

async function handleResponse(res) {
  if (!res.ok) {
    let errBody = {};
    try {
      errBody = await res.json();
    } catch (_) {}
    throw new Error(errBody.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // --- Dashboard & Analytics ---
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse(res);
  },

  async getRevenueStats(days = 7) {
    const res = await fetch(`${API_BASE}/stats/revenue?days=${days}`);
    return handleResponse(res);
  },

  async getDistribution() {
    const res = await fetch(`${API_BASE}/stats/distribution`);
    return handleResponse(res);
  },

  async getNodeIntelligence() {
    const res = await fetch(`${API_BASE}/stats/node-intelligence`);
    return handleResponse(res);
  },

  async getTopSellers(limit = 5) {
    const res = await fetch(`${API_BASE}/products/top_sellers?limit=${limit}`);
    return handleResponse(res);
  },

  // --- Payments ---
  async getRecentPayments(limit = 50) {
    const res = await fetch(`${API_BASE}/payments/recent?limit=${limit}`);
    return handleResponse(res);
  },

  async verifyPayment(paymentId, status) {
    const res = await fetch(`${API_BASE}/payments/${paymentId}/verify`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // --- Products ---
  async getProducts(limit = 100, offset = 0) {
    const res = await fetch(`${API_BASE}/products?limit=${limit}&offset=${offset}`);
    return handleResponse(res);
  },

  async createProduct(productData) {
    const res = await fetch(`${API_ROOT}/products`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify(productData),
    });
    return handleResponse(res);
  },

  async inactivateProduct(productId) {
    const res = await fetch(`${API_ROOT}/products`, {
      method: "DELETE",
      headers: defaultHeaders,
      body: JSON.stringify({ id: productId }),
    });
    return handleResponse(res);
  },

  async getProductLifecycle(productId) {
    const res = await fetch(`${API_BASE}/products/lifecycle?product_id=${productId}`);
    return handleResponse(res);
  },

  // --- Testimonials ---
  async getTestimonials() {
    const res = await fetch(`${API_BASE}/testimonials`);
    return handleResponse(res);
  },

  async getTestimonialStats() {
    const res = await fetch(`${API_BASE}/testimonials/stats`);
    return handleResponse(res);
  },

  // --- Financial Ledger & Payouts ---
  async getPendingPayout() {
    const res = await fetch(`${API_BASE}/payouts/pending`);
    return handleResponse(res);
  },

  async getPayoutHistory() {
    const res = await fetch(`${API_BASE}/payouts/history`);
    return handleResponse(res);
  },

  async confirmPayout(payload) {
    const res = await fetch(`${API_BASE}/payouts/confirm`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
};
