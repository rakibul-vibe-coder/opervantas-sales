-- ============================================================
-- Migration 003: Indexes for Performance
-- ============================================================

-- ============================================================
-- PROFILES indexes
-- ============================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_employee_id ON profiles(employee_id);

-- ============================================================
-- SALES indexes
-- ============================================================

-- Primary query pattern: filter by business_date
CREATE INDEX idx_sales_business_date ON sales(business_date DESC);

-- Filter by salesman
CREATE INDEX idx_sales_salesman_id ON sales(salesman_id);

-- Combined: salesman + date (most common for salesman's own view)
CREATE INDEX idx_sales_salesman_business_date ON sales(salesman_id, business_date DESC);

-- Sort/filter by creation time
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);

-- Filter by status (active vs voided)
CREATE INDEX idx_sales_status ON sales(status);

-- Search by model name (text search)
CREATE INDEX idx_sales_model_name ON sales USING gin(to_tsvector('english', model_name));

-- Idempotency key lookup
CREATE UNIQUE INDEX idx_sales_idempotency ON sales(idempotency_key);

-- Dashboard aggregate: business_date + status (most critical)
CREATE INDEX idx_sales_date_status ON sales(business_date, status);

-- Composite for monthly/weekly reports
CREATE INDEX idx_sales_date_salesman_status ON sales(business_date, salesman_id, status);

-- ============================================================
-- EXPENSES indexes
-- ============================================================

CREATE INDEX idx_expenses_business_date ON expenses(business_date DESC);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_expenses_recipient ON expenses(recipient_name);
CREATE INDEX idx_expenses_date_status ON expenses(business_date, status);

-- ============================================================
-- AUDIT_LOGS indexes
-- ============================================================

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_performed_by ON audit_logs(performed_by);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
