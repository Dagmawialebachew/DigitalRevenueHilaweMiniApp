# ⚡ API & DATABASE CONTRACT SPECIFICATIONS
### For the `DigitalRevenueHilawe` (Telegram Bot & Backend API) Team
### Governed by the Signed Digital Fitness Partnership Agreement (August 10, 2026 – March 2, 2029)

> **Author:** Kupachata (MiniApp Control Room Architect)  
> **Date:** September 2026  
> **Objective:** Synchronize backend data integrity, REST APIs, and automated bot fulfillment with the Executive Dashboard.

---

## 1. DUAL-STREAM PARTNERSHIP FINANCIAL SPECIFICATION

### A. Contract Terms ([FINAL_DIGITAL_FITNESS_PARTNERSHIP_AGREEMENT_FULLY_SIGNED.pdf](file:///D:/Downloads/FINAL_DIGITAL_FITNESS_PARTNERSHIP_AGREEMENT_FULLY_SIGNED.pdf))
* **Effective Date:** August 10, 2026 (Active until March 2, 2029).
* **Accounting Window:** Applies to all activity immediately following Settlement **#40** on **August 8, 2026 18:00:48 UTC**.
* **Stream A (Digital Product Sales - Section 6.1):**
  * **Coach Hilawe Semma: 70%**
  * **Dagmawi Tewodros: 30%**
  * *Fixed for the full 3-year term. No sliding tiers.*
* **Stream B (Hilawe Transformation Club - Section 6.2):**
  * **Initial Stage (< 50,000 ETB cumulative Club revenue):** **60% Coach / 40% Dagmawi**
  * **Mature Stage (>= 50,000 ETB cumulative Club revenue):** **65% Coach / 35% Dagmawi** (non-retroactive).
  * *Current Status:* 20,930.00 ETB recorded across 70 members (41.9% progress toward 50k ETB milestone).
* **Operational & Production Deductions (Section 5):**
  * **Actual Incurred Operating Deductions:** Covered from partnership revenue before profit split (Servers, Neon DB, Render, Bot hosting, USD FX conversions exceeding 195 ETB/$, API services). Logged at actual cost with no artificial software cap.
  * **Product & Video Production Costs:** Covers media, asset production, and video editing.
  * **Pro-Rata Apportionment:** Deductions are split proportionally between Products and Club based on their respective gross revenue contribution during the accounting period.

---

## 2. DATABASE SCHEMA MIGRATION (EXECUTED)

The `public.payout_history` table on Neon PostgreSQL has been patched with the following audit columns:

```sql
ALTER TABLE payout_history
  ADD COLUMN IF NOT EXISTS products_gross NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS club_gross NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS club_stage VARCHAR(50) DEFAULT 'initial_60_40',
  ADD COLUMN IF NOT EXISTS club_cumulative_at_payout NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS infra_deductions NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS production_deductions NUMERIC DEFAULT 0;
```

### Additional Required Cleanups
```sql
-- Enforce clean payment statuses (eradicating typo records like 'just rejected')
ALTER TABLE payments DROP CONSTRAINT IF EXISTS chk_payments_status;
ALTER TABLE payments ADD CONSTRAINT chk_payments_status 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- High-performance query indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at_desc ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_payments_processed_at ON club_payments(processed_at DESC);
```

---

## 3. CORE FINANCIAL REST API CONTRACTS

### A. `GET /api/admin/payouts/pending`
Returns dual-stream settlement balances since `last_payout_at`:

```json
{
  "pending_revenue": 31091.0,
  "pending_deductions": 0.0,
  "net_distributable": 31091.0,
  "coach_total_payout": 21434.8,
  "dagmawi_total_payout": 9656.2,
  "last_payout_at": "2026-08-08T18:00:48.474330+00:00",
  "products_stream": {
    "gross": 27802.0,
    "count": 49,
    "deductions": 0.0,
    "net": 27802.0,
    "coach_rate": 0.7,
    "dagmawi_rate": 0.3,
    "coach_share": 19461.4,
    "dagmawi_share": 8340.6,
    "clause": "Section 6.1 (Fixed 70/30)"
  },
  "club_stream": {
    "gross": 3289.0,
    "count": 11,
    "deductions": 0.0,
    "net": 3289.0,
    "stage": "initial_60_40",
    "coach_rate": 0.6,
    "dagmawi_rate": 0.4,
    "coach_share": 1973.4,
    "dagmawi_share": 1315.6,
    "cumulative_all_time": 20930.0,
    "target_milestone": 50000.0,
    "progress_pct": 41.9,
    "clause": "Section 6.2 (Initial 60/40 until 50k ETB, then 65/35)"
  },
  "infrastructure_cap": {
    "monthly_limit": 5000.0,
    "monthly_used": 0.0,
    "monthly_remaining": 5000.0,
    "cap_utilized_pct": 0.0,
    "clause": "Section 5.1 (5,000 ETB/mo cap)"
  },
  "lifetime_gross": 294579.0,
  "lifetime_burn": 45017.0,
  "reserve_balance": 31091.0
}
```

### B. `POST /api/admin/payouts/confirm`
Executes partner distribution or logs operational expense.

#### 1. Executing Partner Distribution:
```json
{
  "entry_type": "payout",
  "products_amount": 27802.00, // optional override; defaults to DB unsettled
  "club_amount": 3289.00,       // optional override; defaults to DB unsettled
  "deductions": 2000.00,        // optional deduction applied pro-rata
  "note": "Bi-Weekly Partner Settlement"
}
```

#### 2. Logging Operational Expense:
```json
{
  "entry_type": "expense_only",
  "category": "video_production", // or 'infra'
  "amount": 2500.00,              // If video_production, automatically applies 50% rule (1,250 ETB)
  "note": "Qualifying transformation workout video 7"
}
```

### C. `GET /api/admin/payouts/history`
Returns history sorted by `payout_date DESC, id DESC` with stream isolation:
```json
[
  {
    "id": 41,
    "entry_type": "payout",
    "gross_revenue": 31091.00,
    "products_gross": 27802.00,
    "club_gross": 3289.00,
    "operational_deductions": 0.00,
    "net_profit": 31091.00,
    "coach_share": 21434.80,
    "dagmawi_share": 9656.20,
    "club_stage": "initial_60_40",
    "club_cumulative_at_payout": 20930.00,
    "payout_date": "2026-09-05T10:00:00Z",
    "expense_note": "Saturday Partner Settlement"
  }
]
```

---

## 4. BOT AUTO-FULFILLMENT HOOKS
* When `POST /api/admin/payments/{id}/verify` is called with `status = 'approved'`:
  1. Telegram Bot delivers the digital PDF meal/workout guide file immediately.
  2. If `status = 'rejected'`, bot sends user an actionable notification to submit a legible bank transfer slip.
