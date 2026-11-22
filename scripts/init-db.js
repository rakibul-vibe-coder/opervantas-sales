const { PGlite } = require('@electric-sql/pglite')
const path = require('path')
const crypto = require('crypto')

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function init() {
  const dbPath = path.join(process.cwd(), '.pgdata')
  console.log('Connecting to PostgreSQL database at:', dbPath)
  const db = new PGlite(dbPath)

  // 1. Create auth schema and auth.users table
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE,
      password_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      raw_user_meta_data JSONB
    );
  `)

  // 2. Create Enums
  await db.exec(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('manager', 'salesman');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'hold', 'archived');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status') THEN
        CREATE TYPE sale_status AS ENUM ('active', 'voided');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status') THEN
        CREATE TYPE expense_status AS ENUM ('active', 'deleted');
      END IF;
    END $$;
  `)

  // 3. Create profiles table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id            UUID PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      full_name     TEXT NOT NULL,
      role          user_role NOT NULL DEFAULT 'salesman',
      status        user_status NOT NULL DEFAULT 'active',
      employee_id   TEXT NOT NULL UNIQUE,
      created_by    UUID,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // 4. Create sales table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sale_number           TEXT NOT NULL UNIQUE,
      salesman_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
      salesman_name         TEXT NOT NULL,
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
      voided_by             UUID,
      voided_at             TIMESTAMPTZ
    );
  `)

  // 5. Create expenses table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
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
      updated_by      UUID,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // 6. Create audit_logs table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action            TEXT NOT NULL,
      entity_type       TEXT NOT NULL,
      entity_id         UUID,
      performed_by      UUID,
      performed_by_name TEXT,
      old_data          JSONB,
      new_data          JSONB,
      ip_address        TEXT,
      user_agent        TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // 7. Seed Accounts
  const managerId = 'a0000000-0000-0000-0000-000000000001'
  const rahimId = 'a0000000-0000-0000-0000-000000000002'
  const karimId = 'a0000000-0000-0000-0000-000000000003'

  // Insert auth users
  await db.exec(`
    INSERT INTO auth.users (id, email, password_hash)
    VALUES
      ('${managerId}', 'manager@salesmanager.internal', '${hashPassword('manager123')}'),
      ('${rahimId}', 'rahim_sales@salesmanager.internal', '${hashPassword('salesman123')}'),
      ('${karimId}', 'karim_sales@salesmanager.internal', '${hashPassword('salesman123')}')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
  `)

  // Insert profiles
  await db.exec(`
    INSERT INTO profiles (id, username, full_name, role, status, employee_id)
    VALUES
      ('${managerId}', 'admin_manager', 'Store Manager', 'manager', 'active', 'EMP-1001'),
      ('${rahimId}', 'rahim_sales', 'Md. Rahim Uddin', 'salesman', 'active', 'EMP-1002'),
      ('${karimId}', 'karim_sales', 'Md. Karim Hossain', 'salesman', 'active', 'EMP-1003')
    ON CONFLICT (username) DO NOTHING;
  `)

  // No seed sales or expenses — all data starts at 0 as requested
  const userCount = await db.query('SELECT count(*) FROM profiles')
  const salesCount = await db.query('SELECT count(*) FROM sales')
  const expensesCount = await db.query('SELECT count(*) FROM expenses')

  console.log('PostgreSQL database initialized successfully!')
  console.log('- Profiles in database:', userCount.rows[0].count)
  console.log('- Sales in database (should be 0):', salesCount.rows[0].count)
  console.log('- Expenses in database (should be 0):', expensesCount.rows[0].count)
}

init().catch(err => {
  console.error('Database initialization failed:', err)
  process.exit(1)
})
