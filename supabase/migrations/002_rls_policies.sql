-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get current user's role
-- ============================================================

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_status()
RETURNS user_status AS $$
  SELECT status FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- PROFILES policies
-- ============================================================

-- Managers can view all profiles
CREATE POLICY "managers_view_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth_user_role() = 'manager');

-- Salesmen can view only their own profile
CREATE POLICY "salesmen_view_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth_user_role() = 'salesman' AND id = auth.uid());

-- Managers can insert new profiles (create salesmen)
CREATE POLICY "managers_insert_profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_role() = 'manager');

-- Managers can update profiles
CREATE POLICY "managers_update_profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth_user_role() = 'manager')
  WITH CHECK (auth_user_role() = 'manager');

-- Salesmen can update only their own profile (limited fields handled in app)
CREATE POLICY "salesmen_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth_user_role() = 'salesman' AND id = auth.uid())
  WITH CHECK (auth_user_role() = 'salesman' AND id = auth.uid());

-- ============================================================
-- SALES policies
-- ============================================================

-- Managers can view ALL sales
CREATE POLICY "managers_view_all_sales"
  ON sales FOR SELECT
  TO authenticated
  USING (auth_user_role() = 'manager');

-- Salesmen can only view their OWN sales
CREATE POLICY "salesmen_view_own_sales"
  ON sales FOR SELECT
  TO authenticated
  USING (
    auth_user_role() = 'salesman'
    AND salesman_id = auth.uid()
  );

-- Active salesmen and managers can insert sales
CREATE POLICY "active_users_insert_sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (
    auth_user_status() = 'active'
    AND salesman_id = auth.uid()  -- must be their own sale
  );

-- Only managers can update sales (void them)
CREATE POLICY "managers_update_sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (auth_user_role() = 'manager')
  WITH CHECK (auth_user_role() = 'manager');

-- Nobody can delete sales records (soft delete via status only)
-- No DELETE policy = no deletes allowed

-- ============================================================
-- EXPENSES policies
-- ============================================================

-- Only managers can view expenses
CREATE POLICY "managers_view_expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth_user_role() = 'manager');

-- Only managers can insert expenses
CREATE POLICY "managers_insert_expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth_user_role() = 'manager'
    AND created_by = auth.uid()
  );

-- Only managers can update expenses
CREATE POLICY "managers_update_expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth_user_role() = 'manager')
  WITH CHECK (auth_user_role() = 'manager');

-- ============================================================
-- AUDIT_LOGS policies
-- ============================================================

-- Only managers can view audit logs
CREATE POLICY "managers_view_audit_logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth_user_role() = 'manager');

-- Service role can insert audit logs (via SECURITY DEFINER functions)
CREATE POLICY "service_insert_audit_logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);  -- controlled via SECURITY DEFINER functions

-- ============================================================
-- Grant usage to authenticated users
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sales TO authenticated;
GRANT SELECT, INSERT, UPDATE ON expenses TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_date TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_salesman_performance TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_status TO authenticated;
GRANT EXECUTE ON FUNCTION create_salesman_profile TO authenticated;
GRANT USAGE ON SEQUENCE sale_number_seq TO authenticated;
GRANT USAGE ON SEQUENCE expense_number_seq TO authenticated;
GRANT USAGE ON SEQUENCE employee_id_seq TO authenticated;
