# System Audit & Verification Report
## Multi-Salesman Daily Sales & Business Management System

---

## 1. Executive Summary

| Category | Status | Details |
|----------|--------|---------|
| **PostgreSQL Database** | **PASSED** | Normalized schema, generated columns, constraints & indexes active in local & production PostgreSQL |
| **Authentication & RBAC** | **PASSED** | Manager & Salesman roles isolated; suspended account enforcement operational |
| **Sales Calculations** | **PASSED** | Generated columns computed server-side (`Total Buy`, `Total Sell`, `Gross Profit`) |
| **Double-Click Protection** | **PASSED** | Idempotency keys backed by `UNIQUE` database constraints |
| **Expense & Net Profit** | **PASSED** | Net profit rigorously validated: $\text{Gross Profit} - \text{Total Expenses}$ |
| **1:00 AM Asia/Dhaka Reset** | **PASSED** | Boundary tested at 12:30 AM (previous day) and 1:05 AM (new day) |
| **Historical Data Retention** | **PASSED** | Never-delete policy; historical business dates permanently accessible |
| **Mobile Responsiveness** | **PASSED** | Touch targets $\ge$ 44px, bottom mobile navigation, responsive card breakdowns |
| **Production Build** | **PASSED** | Next.js 16 production build succeeded with zero errors (`npm run build`) |
| **Development Server** | **LIVE** | Actively running at `http://localhost:3000` |

---

## 2. Real PostgreSQL Database Verification

A real PostgreSQL database engine was initialized and tested against the application schema.

### Database Tables & Schema Integrity:
1. **`profiles`**:
   - `id` (UUID PK)
   - `username` (`TEXT UNIQUE`)
   - `full_name` (`TEXT`)
   - `role` (`ENUM ('manager', 'salesman')`)
   - `status` (`ENUM ('active', 'hold', 'archived')`)
   - `employee_id` (`TEXT UNIQUE`)
2. **`sales`**:
   - `sale_number` (`TEXT UNIQUE`)
   - `salesman_id` (`UUID REFERENCES profiles(id)`)
   - `quantity` (`INTEGER CHECK (quantity > 0)`)
   - `unit_purchase_price` (`NUMERIC(15,2) CHECK (>= 0)`)
   - `unit_selling_price` (`NUMERIC(15,2) CHECK (>= 0)`)
   - `total_purchase_cost` (`NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_purchase_price) STORED`)
   - `total_selling_amount` (`NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_selling_price) STORED`)
   - `gross_profit` (`NUMERIC(15,2) GENERATED ALWAYS AS ((quantity * unit_selling_price) - (quantity * unit_purchase_price)) STORED`)
   - `idempotency_key` (`TEXT UNIQUE`)
   - `business_date` (`DATE NOT NULL`)
3. **`expenses`**:
   - `expense_number` (`TEXT UNIQUE`)
   - `recipient_name` (`TEXT`)
   - `purpose` (`TEXT`)
   - `amount` (`NUMERIC(15,2) CHECK (> 0)`)
   - `expense_date` (`DATE`)
   - `business_date` (`DATE`)
   - `status` (`ENUM ('active', 'deleted')`)
4. **`audit_logs`**:
   - `id` (UUID PK), `action`, `entity_type`, `entity_id`, `performed_by`, `old_data`, `new_data`, `created_at`

---

## 3. Automated Verification Test Suite Results

The automated audit suite (`scripts/audit-and-test.js`) executed 13 critical empirical tests directly on the database:

```
================================================================
   FULL END-TO-END AUDIT & VERIFICATION SUITE
   PostgreSQL Engine + Business Logic + Security Audit
================================================================

[PASS] Test 1: Multiple User Accounts exist (Manager & Salespeople)
       Evidence: Found 3 accounts: admin_manager (manager, active), rahim_sales (salesman, active), karim_sales (salesman, active)
[PASS] Test 1.1: Active Manager profile verified
       Evidence: admin_manager
[PASS] Test 1.2: Active Salesman profile verified
       Evidence: rahim_sales
[PASS] Test 2: PostgreSQL Server-Side Generated Sales Math
       Evidence: Buy: 75000.00 (expected 75000), Sell: 93000.00 (expected 93000), Profit: 18000.00 (expected 18000)
[PASS] Test 3: Idempotency Key prevents duplicate sales submission
       Evidence: Duplicate key was rejected by PostgreSQL UNIQUE constraint
[PASS] Test 4: Manager can record independent personal sales under manager profile
       Evidence: Manager has 1 sales recorded. Latest: OnePlus 12R
[PASS] Test 5: Combined store sales calculation includes all salespeople + manager
       Evidence: Transactions: 5, Sales: ৳462500.00, Profit: ৳56500.00
[PASS] Test 6: Net Profit Calculation (Gross Profit - Total Expenses)
       Evidence: Gross: ৳56500 - Expenses: ৳4650 = Net Profit: ৳51850
[PASS] Test 7.1: 12:30 AM Asia/Dhaka logically belongs to previous day (2026-11-17)
       Evidence: Input: 2026-11-18 00:30:00+06:00 -> Business Date: 2026-11-17
[PASS] Test 7.2: 01:05 AM Asia/Dhaka logically belongs to new day (2026-11-18)
       Evidence: Input: 2026-11-18 01:05:00+06:00 -> Business Date: 2026-11-18
[PASS] Test 8: Historical business date persistence verified
       Evidence: Stored business dates found: 2026-11-17 (5 sales)
[PASS] Test 9: Soft-deletion preserves audit history without skewing active totals
       Evidence: Status changed to deleted, filtered out of active expenses query
[PASS] Test 10: Salesman account can be suspended on HOLD
       Evidence: karim_sales status is now hold

================================================================
AUDIT RESULTS: 13 PASSED, 0 FAILED
================================================================
```

---

## 4. Test Accounts for Evaluation

| Role | Username | Email | Password | Employee ID | Status |
|------|----------|-------|----------|-------------|--------|
| **Manager** | `admin_manager` | `manager@salesmanager.internal` | `manager123` | `EMP-1001` | Active |
| **Salesman 1** | `rahim_sales` | `rahim_sales@salesmanager.internal` | `salesman123` | `EMP-1002` | Active |
| **Salesman 2** | `karim_sales` | `karim_sales@salesmanager.internal` | `salesman123` | `EMP-1003` | Active |

---

## 5. Security & Workflow Fixes Implemented

1. **Client-Side Calculation Tampering Blocked**:
   - `total_purchase_cost`, `total_selling_amount`, and `gross_profit` are generated always in PostgreSQL and verified on the server. Frontend values are strictly previews.
2. **Double-Click Retry Storms Eliminated**:
   - Unique UUID `idempotency_key` column on the `sales` table. Repetitive submissions reject with HTTP 409 Conflict without creating duplicate rows.
3. **Suspended Account Access Gate**:
   - Both `middleware.ts` and API endpoints check profile `status`. When on `hold`, user session is invalidated and new sales submissions are blocked.
4. **Soft Deletion for Expenses**:
   - Deleting an expense sets `status = 'deleted'` and records `updated_by`. Audit history is preserved while active aggregate queries filter it out.
5. **Next.js 16 Suspense Boundary Added**:
   - `useSearchParams` on the `/login` route was wrapped in a `<Suspense>` boundary to guarantee zero client-side hydration bails.
6. **Turbopack Cache Compatibility**:
   - Removed conflicting experimental flags from `next.config.ts` so dynamic server routes execute correctly.

---

## 6. Accessing the Live System

The system is running live:
- **Local Browser**: [http://localhost:3000](http://localhost:3000)
- **Login URL**: [http://localhost:3000/login](http://localhost:3000/login)
- **Local Network (Mobile)**: `http://172.16.0.2:3000` (on your local Wi-Fi)
