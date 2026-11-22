# Multi-Salesman Daily Sales & Business Management System

A production-grade, mobile-first Daily Sales and Financial Management System built for retail businesses in Bangladesh.

---

## Key Highlights

- **Mobile-First Responsive Interface**: Optimized for touchscreens, handheld phones, tablets, and full desktop displays.
- **Role-Based Access Control (RBAC)**: Distinct, isolated workflows for **Managers** and **Salespeople** enforced at both API and PostgreSQL Row-Level Security (RLS) layers.
- **1:00 AM Asia/Dhaka Logical Business Day Reset**: Automatic calculation based on Bangladesh Standard Time (UTC+6). Transactions between 12:00 AM and 12:59:59 AM attach to the preceding business day. Zero risk of wiping historical data.
- **Real-Time Manager Dashboard**: 8 live KPI summary cards, live salesperson activity tracking, and instant profit calculations.
- **Master Daily Sales Performance Table**: Complete ranking table with sorting by highest sales/profit, visual rank badges (🥇), individual contribution percentages, and combined total sum row.
- **Daily Expense Tracking**: Complete management of operational costs with net profit calculation (`Net Profit = Gross Profit - Total Expenses`).
- **Data Protection & Data Integrity**: Server-side price and profit computation, double-click idempotency protection, and tamper-proof audit trails.
- **Comprehensive Analytics & Export**: Graphical charts (Recharts) for sales trends, profit curves, expense distribution, and one-click CSV export.

---

## Technology Stack

| Layer | Framework / Library |
|-------|--------------------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui design tokens |
| State & Query | TanStack Query v5 |
| Form Validation | Zod + React Hook Form |
| Icons | Lucide React |
| Charts | Recharts |
| Database & Auth | PostgreSQL + Supabase (RLS enabled) |
| Timezone Engine | Asia/Dhaka (1:00 AM logical boundary) |

---

## Directory Structure

```
sales-management/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx               # Secure role-aware login
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                   # Responsive sidebar & bottom nav shell
│   │   ├── manager/
│   │   │   ├── page.tsx                 # Real-time manager dashboard (8 KPIs)
│   │   │   ├── add-sale/page.tsx        # Manager sale entry
│   │   │   ├── add-expense/page.tsx     # Operational expense entry
│   │   │   ├── daily-performance/page.tsx # Master performance table
│   │   │   ├── all-sales/page.tsx       # Paginated sales history with CSV
│   │   │   ├── expense-history/page.tsx # Expense logs and deletions
│   │   │   ├── salesman-management/page.tsx # Create/hold/activate salesmen
│   │   │   ├── reports/page.tsx         # Analytical charts & comparisons
│   │   │   ├── monthly-reports/page.tsx # Historical calendar statement
│   │   │   ├── audit-logs/page.tsx      # Immutable operation logs
│   │   │   └── settings/page.tsx        # Business rule engine info
│   │   └── salesman/
│   │       ├── page.tsx                 # Salesman mobile overview
│   │       ├── add-sale/page.tsx        # Rapid touch-friendly sale input
│   │       ├── my-sales/page.tsx        # Individual transactions
│   │       ├── my-performance/page.tsx  # Salesman metrics & milestones
│   │       └── profile/page.tsx         # Salesman credentials & ID
│   ├── api/
│   │   ├── sales/                       # GET (paginated), POST (with idempotency)
│   │   ├── sales/[id]/                  # Voiding operations (manager only)
│   │   ├── expenses/                    # GET & POST expense items
│   │   ├── expenses/[id]/               # Soft deletion & updates
│   │   ├── users/                       # User management & account creation
│   │   ├── users/[id]/                  # Hold/Reactivate/Archive account
│   │   ├── dashboard/summary/           # Aggregated real-time metrics
│   │   ├── reports/daily/               # Daily performance report
│   │   ├── reports/monthly/             # Monthly historical statement
│   │   ├── export/sales/                # CSV export for sales
│   │   ├── export/expenses/             # CSV export for expenses
│   │   └── audit-logs/                  # Audit trail records
│   ├── layout.tsx                       # Root layout & providers
│   ├── page.tsx                         # Role redirector
│   └── globals.css                      # Tailwind CSS & theme tokens
├── components/
│   ├── ui/                              # Complete shadcn/ui components
│   ├── layout/                          # Sidebar & MobileNav components
│   ├── dashboard/                       # MetricCard and summary widgets
│   ├── sales/                           # SaleEntryForm (auto calculations)
│   ├── expenses/                        # ExpenseForm
│   └── providers/                       # TanStack Query & Theme providers
├── lib/
│   ├── business-date.ts                 # 1:00 AM Asia/Dhaka boundary logic
│   ├── calculations.ts                  # Monetary calculations (safe numbers)
│   ├── utils.ts                         # Currency formatting (৳ BDT) & helpers
│   ├── supabase/                        # Browser, Server & Admin clients
│   └── validations/                     # Zod validation schemas
├── supabase/
│   ├── migrations/                      # 001-004 SQL schema, RLS & triggers
│   └── seed.sql                         # Demo users and sales records
├── .env.local.example                   # Environment configuration guide
├── middleware.ts                        # Next.js route protection & RBAC
└── package.json
```

---

## 1:00 AM Asia/Dhaka Business Day Logic

The application implements a logical date engine in `lib/business-date.ts` and in PostgreSQL function `get_business_date()`.

- **Timezone**: `Asia/Dhaka` (UTC+6)
- **Cutoff Time**: Exactly `01:00:00 AM`
- **Rule**:
  - `01:00:00 AM` to `11:59:59 PM` $\rightarrow$ Belongs to the current calendar date.
  - `12:00:00 AM` to `12:59:59 AM` $\rightarrow$ Belongs to the previous calendar business day.
- **Historical Data**: Permanent. Records are never deleted or truncated at reset; dashboard metrics query the filtered business day index automatically.

---

## Database Setup & Initialization

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql` (Tables, enums, sequences, auto calculations)
   - `supabase/migrations/002_rls_policies.sql` (Row-Level Security rules)
   - `supabase/migrations/003_indexes.sql` (Performance indexes on `business_date`, `salesman_id`, etc.)
   - `supabase/migrations/004_functions.sql` (Audit triggers and reporting stored procedures)
4. (Optional) Run `supabase/seed.sql` to populate sample data.

---

## Environment Configuration

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your project credentials:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-private-key
NEXT_PUBLIC_BUSINESS_TIMEZONE=Asia/Dhaka
NEXT_PUBLIC_BUSINESS_DAY_RESET_HOUR=1
```

---

## Running the Application

### Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

---

## Security Features

1. **Server-Side Financial Calculations**: Unit prices, quantities, and totals are computed server-side to prevent client tampering.
2. **Double-Click Idempotency Protection**: Every sale requires a UUID `idempotency_key`, preventing duplicate charge submissions over slow networks.
3. **Database RLS Policies**:
   - Salespeople can only SELECT their own records and INSERT under their verified Auth ID.
   - Managers have complete visibility over all salespeople and store expenses.
   - Deleted sales and archived profiles use soft states to retain legal accounting history.
4. **Audit Logging**: Automatic trigger recording of mutations to `sales`, `expenses`, and `profiles`.
