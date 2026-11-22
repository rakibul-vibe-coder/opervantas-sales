-- ============================================================
-- Migration 004: Additional Helper Functions & Views
-- ============================================================

-- ============================================================
-- FUNCTION: Monthly report aggregation
-- ============================================================

CREATE OR REPLACE FUNCTION get_monthly_report(p_year INTEGER, p_month INTEGER)
RETURNS TABLE (
  business_date         DATE,
  total_sales           NUMERIC,
  total_purchase_cost   NUMERIC,
  gross_profit          NUMERIC,
  total_expenses        NUMERIC,
  net_profit            NUMERIC,
  total_quantity        BIGINT,
  total_transactions    BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH sales_data AS (
    SELECT
      s.business_date,
      SUM(s.total_selling_amount) AS total_sales,
      SUM(s.total_purchase_cost) AS total_purchase_cost,
      SUM(s.gross_profit) AS gross_profit,
      SUM(s.quantity)::BIGINT AS total_quantity,
      COUNT(*)::BIGINT AS total_transactions
    FROM sales s
    WHERE
      EXTRACT(YEAR FROM s.business_date) = p_year
      AND EXTRACT(MONTH FROM s.business_date) = p_month
      AND s.status = 'active'
    GROUP BY s.business_date
  ),
  expense_data AS (
    SELECT
      e.business_date,
      SUM(e.amount) AS total_expenses
    FROM expenses e
    WHERE
      EXTRACT(YEAR FROM e.business_date) = p_year
      AND EXTRACT(MONTH FROM e.business_date) = p_month
      AND e.status = 'active'
    GROUP BY e.business_date
  )
  SELECT
    COALESCE(sd.business_date, ed.business_date) AS business_date,
    COALESCE(sd.total_sales, 0),
    COALESCE(sd.total_purchase_cost, 0),
    COALESCE(sd.gross_profit, 0),
    COALESCE(ed.total_expenses, 0),
    COALESCE(sd.gross_profit, 0) - COALESCE(ed.total_expenses, 0) AS net_profit,
    COALESCE(sd.total_quantity, 0),
    COALESCE(sd.total_transactions, 0)
  FROM sales_data sd
  FULL OUTER JOIN expense_data ed ON sd.business_date = ed.business_date
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- FUNCTION: Date range report
-- ============================================================

CREATE OR REPLACE FUNCTION get_date_range_report(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  total_sales           NUMERIC,
  total_purchase_cost   NUMERIC,
  gross_profit          NUMERIC,
  total_expenses        NUMERIC,
  net_profit            NUMERIC,
  total_quantity        BIGINT,
  total_transactions    BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(s.total_selling_amount), 0),
    COALESCE(SUM(s.total_purchase_cost), 0),
    COALESCE(SUM(s.gross_profit), 0),
    COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.business_date BETWEEN p_start_date AND p_end_date AND e.status = 'active'), 0),
    COALESCE(SUM(s.gross_profit), 0) - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.business_date BETWEEN p_start_date AND p_end_date AND e.status = 'active'), 0),
    COALESCE(SUM(s.quantity), 0)::BIGINT,
    COUNT(*)::BIGINT
  FROM sales s
  WHERE s.business_date BETWEEN p_start_date AND p_end_date
    AND s.status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_monthly_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_date_range_report TO authenticated;

-- ============================================================
-- Trigger: Auto-generate sale_number on insert
-- ============================================================

CREATE OR REPLACE FUNCTION auto_generate_sale_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := generate_sale_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_auto_number
  BEFORE INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION auto_generate_sale_number();

-- ============================================================
-- Trigger: Auto-generate expense_number on insert
-- ============================================================

CREATE OR REPLACE FUNCTION auto_generate_expense_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expense_number IS NULL OR NEW.expense_number = '' THEN
    NEW.expense_number := generate_expense_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_auto_number
  BEFORE INSERT ON expenses
  FOR EACH ROW EXECUTE FUNCTION auto_generate_expense_number();

-- ============================================================
-- Trigger: Audit log for sales
-- ============================================================

CREATE OR REPLACE FUNCTION audit_sales_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_performer_name TEXT;
BEGIN
  SELECT full_name INTO v_performer_name FROM profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, performed_by_name, new_data)
    VALUES ('sale.created', 'sale', NEW.id, auth.uid(), v_performer_name, row_to_json(NEW)::JSONB);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, performed_by_name, old_data, new_data)
    VALUES ('sale.updated', 'sale', NEW.id, auth.uid(), v_performer_name, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_sales
  AFTER INSERT OR UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION audit_sales_changes();

-- ============================================================
-- Trigger: Audit log for profile changes
-- ============================================================

CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_performer_name TEXT;
BEGIN
  SELECT full_name INTO v_performer_name FROM profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, performed_by_name, new_data)
    VALUES ('profile.created', 'profile', NEW.id, auth.uid(), v_performer_name, row_to_json(NEW)::JSONB);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, performed_by_name, old_data, new_data)
    VALUES ('profile.updated', 'profile', NEW.id, auth.uid(), v_performer_name, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_profile_changes();
