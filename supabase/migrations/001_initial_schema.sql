-- ============================================================
-- Migration 001: Initial Schema
-- Multi-Salesman Daily Sales & Business Management System
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('manager', 'salesman');
CREATE TYPE user_status AS ENUM ('active', 'hold', 'archived');
CREATE TYPE sale_status AS ENUM ('active', 'voided');
CREATE TYPE expense_status AS ENUM ('active', 'deleted');

-- ============================================================
-- TABLE: profiles
-- Extends Supabase auth.users with business-specific fields
-- ============================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'salesman',
  status        user_status NOT NULL DEFAULT 'active',
  employee_id   TEXT NOT NULL UNIQUE,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: sales
-- ============================================================

CREATE TABLE sales (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number           TEXT NOT NULL UNIQUE,
  salesman_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  salesman_name         TEXT NOT NULL,       -- snapshot at time of sale
  model_name            TEXT NOT NULL,
  quantity              INTEGER NOT NULL CHECK (quantity > 0),
  unit_purchase_price   NUMERIC(15,2) NOT NULL CHECK (unit_purchase_price >= 0),
  unit_selling_price    NUMERIC(15,2) NOT NULL CHECK (unit_selling_price >= 0),
  total_purchase_cost   NUMERIC(15,2) NOT NULL GENERATED ALWAYS AS (quantity * unit_purchase_price) STORED,
  total_selling_amount  NUMERIC(15,2) NOT NULL GENERATED ALWAYS AS (quantity * unit_selling_price) STORED,
  gross_profit          NUMERIC(15,2) NOT NULL GENERATED ALWAYS AS ((quantity * unit_selling_price) - (quantity * unit_purchase_price)) STORED,
  business_date         DATE NOT NULL,
  status                sale_status NOT NULL DEFAULT 'active',
  idempotency_key       TEXT NOT NULL UNIQUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voided_by             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  voided_at             TIMESTAMPTZ
);

-- ============================================================
-- TABLE: expenses
-- ============================================================

CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number  TEXT NOT NULL UNIQUE,
  recipient_name  TEXT NOT NULL,
  purpose         TEXT NOT NULL,
  amount          NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  expense_date    DATE NOT NULL,
  business_date   DATE NOT NULL,
  status          expense_status NOT NULL DEFAULT 'active',
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================

CREATE TABLE audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action            TEXT NOT NULL,
  entity_type       TEXT NOT NULL,
  entity_id         UUID,
  performed_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  performed_by_name TEXT,
  old_data          JSONB,
  new_data          JSONB,
  ip_address        TEXT,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEQUENCES for human-readable IDs
-- ============================================================

CREATE SEQUENCE sale_number_seq START 1000;
CREATE SEQUENCE expense_number_seq START 1000;
CREATE SEQUENCE employee_id_seq START 1001;

-- ============================================================
-- FUNCTIONS: Updated timestamp trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTION: Handle new Supabase Auth user
-- Auto-creates a profile row when auth.users gets a new entry
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if metadata is provided (managed signups)
  -- Direct signups without metadata are handled by the API
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Get current business date in Asia/Dhaka timezone
-- Business day resets at 1:00 AM Bangladesh time
-- ============================================================

CREATE OR REPLACE FUNCTION get_business_date(ts TIMESTAMPTZ DEFAULT NOW())
RETURNS DATE AS $$
DECLARE
  dhaka_time TIMESTAMPTZ;
  dhaka_hour INTEGER;
BEGIN
  -- Convert to Asia/Dhaka timezone (UTC+6)
  dhaka_time := ts AT TIME ZONE 'Asia/Dhaka';
  dhaka_hour := EXTRACT(HOUR FROM dhaka_time);

  -- If before 1:00 AM, it belongs to the previous calendar day
  IF dhaka_hour < 1 THEN
    RETURN (dhaka_time::DATE - INTERVAL '1 day')::DATE;
  ELSE
    RETURN dhaka_time::DATE;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- FUNCTION: Generate sale number
-- ============================================================

CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'SL-' || LPAD(nextval('sale_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Generate expense number
-- ============================================================

CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EX-' || LPAD(nextval('expense_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Generate employee ID
-- ============================================================

CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EMP-' || LPAD(nextval('employee_id_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Create salesman (called by manager via API)
-- Creates auth user + profile atomically
-- ============================================================

CREATE OR REPLACE FUNCTION create_salesman_profile(
  p_id          UUID,
  p_username    TEXT,
  p_full_name   TEXT,
  p_role        user_role,
  p_created_by  UUID
)
RETURNS profiles AS $$
DECLARE
  v_employee_id TEXT;
  v_profile     profiles;
BEGIN
  v_employee_id := generate_employee_id();

  INSERT INTO profiles (id, username, full_name, role, status, employee_id, created_by)
  VALUES (p_id, p_username, p_full_name, p_role, 'active', v_employee_id, p_created_by)
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Dashboard summary for a business date
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_summary(p_business_date DATE)
RETURNS TABLE (
  total_sales           NUMERIC,
  total_purchase_cost   NUMERIC,
  total_gross_profit    NUMERIC,
  total_expenses        NUMERIC,
  net_profit            NUMERIC,
  total_quantity        BIGINT,
  total_transactions    BIGINT,
  active_salespeople    BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(s.total_sales, 0),
    COALESCE(s.total_purchase_cost, 0),
    COALESCE(s.total_gross_profit, 0),
    COALESCE(e.total_expenses, 0),
    COALESCE(s.total_gross_profit, 0) - COALESCE(e.total_expenses, 0),
    COALESCE(s.total_quantity, 0),
    COALESCE(s.total_transactions, 0),
    COALESCE(a.active_salespeople, 0)
  FROM
    (SELECT
      SUM(total_selling_amount) AS total_sales,
      SUM(total_purchase_cost) AS total_purchase_cost,
      SUM(gross_profit) AS total_gross_profit,
      SUM(quantity) AS total_quantity,
      COUNT(*) AS total_transactions
    FROM sales
    WHERE business_date = p_business_date AND status = 'active') s,
    (SELECT SUM(amount) AS total_expenses
    FROM expenses
    WHERE business_date = p_business_date AND status = 'active') e,
    (SELECT COUNT(DISTINCT salesman_id) AS active_salespeople
    FROM sales
    WHERE business_date = p_business_date AND status = 'active') a;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FUNCTION: Per-salesman performance for a date
-- ============================================================

CREATE OR REPLACE FUNCTION get_salesman_performance(p_business_date DATE)
RETURNS TABLE (
  salesman_id         UUID,
  salesman_name       TEXT,
  employee_id         TEXT,
  transactions        BIGINT,
  total_quantity      BIGINT,
  total_sales         NUMERIC,
  total_purchase_cost NUMERIC,
  gross_profit        NUMERIC,
  last_sale_at        TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.salesman_id,
    s.salesman_name,
    p.employee_id,
    COUNT(*)::BIGINT AS transactions,
    SUM(s.quantity)::BIGINT AS total_quantity,
    SUM(s.total_selling_amount) AS total_sales,
    SUM(s.total_purchase_cost) AS total_purchase_cost,
    SUM(s.gross_profit) AS gross_profit,
    MAX(s.created_at) AS last_sale_at
  FROM sales s
  JOIN profiles p ON p.id = s.salesman_id
  WHERE s.business_date = p_business_date AND s.status = 'active'
  GROUP BY s.salesman_id, s.salesman_name, p.employee_id
  ORDER BY gross_profit DESC;
END;
$$ LANGUAGE plpgsql STABLE;
