-- ============================================================
-- Seed Data for Multi-Salesman Daily Sales Management System
-- Run this in Supabase SQL Editor after applying migrations 001-004
-- ============================================================

-- Note: In Supabase, auth users are created via the Auth API or Auth Dashboard.
-- This script creates demo profile records assuming auth users exist, or you can
-- insert demo auth records for local Supabase development.

-- 1. Insert Initial Demo Profiles
-- Replace these UUIDs with actual auth.users UUIDs if testing with Supabase Auth
INSERT INTO profiles (id, username, full_name, role, status, employee_id)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin_manager', 'Store Manager', 'manager', 'active', 'EMP-1001'),
  ('a0000000-0000-0000-0000-000000000002', 'rahim_sales', 'Md. Rahim Uddin', 'salesman', 'active', 'EMP-1002'),
  ('a0000000-0000-0000-0000-000000000003', 'karim_sales', 'Md. Karim Hossain', 'salesman', 'active', 'EMP-1003'),
  ('a0000000-0000-0000-0000-000000000004', 'tania_sales', 'Tania Akter', 'salesman', 'active', 'EMP-1004')
ON CONFLICT (username) DO NOTHING;

-- 2. Insert Sample Sales for Current and Recent Business Dates
INSERT INTO sales (
  sale_number, salesman_id, salesman_name, model_name,
  quantity, unit_purchase_price, unit_selling_price,
  business_date, status, idempotency_key
)
VALUES
  -- Today's sales by Rahim
  ('SL-001001', 'a0000000-0000-0000-0000-000000000002', 'Md. Rahim Uddin', 'Samsung Galaxy A55 5G', 2, 38000.00, 42500.00, CURRENT_DATE, 'active', 'idem-001'),
  ('SL-001002', 'a0000000-0000-0000-0000-000000000002', 'Md. Rahim Uddin', 'Redmi Note 13 Pro', 3, 26000.00, 29500.00, CURRENT_DATE, 'active', 'idem-002'),
  
  -- Today's sales by Karim
  ('SL-001003', 'a0000000-0000-0000-0000-000000000003', 'Md. Karim Hossain', 'iPhone 15 Pro 128GB', 1, 125000.00, 138000.00, CURRENT_DATE, 'active', 'idem-003'),
  ('SL-001004', 'a0000000-0000-0000-0000-000000000003', 'Md. Karim Hossain', 'Realme 12 Plus', 2, 24000.00, 27500.00, CURRENT_DATE, 'active', 'idem-004'),

  -- Today's sales by Tania
  ('SL-001005', 'a0000000-0000-0000-0000-000000000004', 'Tania Akter', 'Vivo V30 5G', 2, 34000.00, 38500.00, CURRENT_DATE, 'active', 'idem-005'),

  -- Today's sale by Manager directly
  ('SL-001006', 'a0000000-0000-0000-0000-000000000001', 'Store Manager', 'OnePlus 12R', 1, 52000.00, 58000.00, CURRENT_DATE, 'active', 'idem-006'),

  -- Yesterday's sales
  ('SL-001007', 'a0000000-0000-0000-0000-000000000002', 'Md. Rahim Uddin', 'Xiaomi 14', 1, 68000.00, 75000.00, (CURRENT_DATE - 1), 'active', 'idem-007'),
  ('SL-001008', 'a0000000-0000-0000-0000-000000000003', 'Md. Karim Hossain', 'Samsung Galaxy S24', 1, 85000.00, 94000.00, (CURRENT_DATE - 1), 'active', 'idem-008')
ON CONFLICT (idempotency_key) DO NOTHING;

-- 3. Insert Sample Expenses for Current Business Date
INSERT INTO expenses (
  expense_number, recipient_name, purpose, amount,
  expense_date, business_date, status, notes, created_by
)
VALUES
  ('EX-001001', 'DESCO', 'Shop Electricity Bill (Monthly)', 4200.00, CURRENT_DATE, CURRENT_DATE, 'active', 'Meter #829104', 'a0000000-0000-0000-0000-000000000001'),
  ('EX-001002', 'Al-Madina Tea Stall', 'Customer tea, mineral water & snacks', 450.00, CURRENT_DATE, CURRENT_DATE, 'active', 'Daily refreshments', 'a0000000-0000-0000-0000-000000000001'),
  ('EX-001003', 'Paper & Stationery Mart', 'Receipt books & invoice paper rolls', 680.00, CURRENT_DATE, CURRENT_DATE, 'active', 'Store supplies', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (expense_number) DO NOTHING;
