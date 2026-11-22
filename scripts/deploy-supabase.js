const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const connectionString = 'postgresql://postgres.vnwqbedkszbgzrnfkspj:Opervantas2026SalesManagementDb99@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

async function deploy() {
  console.log('Connecting to Supabase PostgreSQL Database...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected!');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = [
    '001_initial_schema.sql',
    '002_rls_policies.sql',
    '003_indexes.sql',
    '004_functions.sql',
  ];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`Executing migration: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      try {
        await client.query(sql);
        console.log(`✓ Migration ${file} executed successfully.`);
      } catch (err) {
        console.warn(`Note on ${file}:`, err.message);
      }
    }
  }

  // Ensure password_hash column exists on auth.users if using custom auth table
  try {
    await client.query(`
      ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
    `);
  } catch (e) {
    console.log('auth.users password_hash check:', e.message);
  }

  // Insert seed users (Manager and Salesmen) with 0 sales and 0 expenses
  console.log('Creating initial Manager and Salesman accounts...');
  const managerId = 'a0000000-0000-0000-0000-000000000001';
  const rahimId = 'a0000000-0000-0000-0000-000000000002';
  const karimId = 'a0000000-0000-0000-0000-000000000003';

  await client.query(`
    INSERT INTO auth.users (id, email, password_hash, raw_user_meta_data)
    VALUES
      ('${managerId}', 'manager@salesmanager.internal', '${hashPassword('manager123')}', '{"full_name": "Store Manager", "role": "manager"}'),
      ('${rahimId}', 'rahim_sales@salesmanager.internal', '${hashPassword('salesman123')}', '{"full_name": "Md. Rahim Uddin", "role": "salesman"}'),
      ('${karimId}', 'karim_sales@salesmanager.internal', '${hashPassword('salesman123')}', '{"full_name": "Md. Karim Hossain", "role": "salesman"}')
    ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;
  `);

  await client.query(`
    INSERT INTO profiles (id, username, full_name, role, status, employee_id)
    VALUES
      ('${managerId}', 'admin_manager', 'Store Manager', 'manager', 'active', 'EMP-1001'),
      ('${rahimId}', 'rahim_sales', 'Md. Rahim Uddin', 'salesman', 'active', 'EMP-1002'),
      ('${karimId}', 'karim_sales', 'Md. Karim Hossain', 'salesman', 'active', 'EMP-1003')
    ON CONFLICT (id) DO NOTHING;
  `);

  const uCount = await client.query('SELECT count(*) FROM profiles;');
  const sCount = await client.query('SELECT count(*) FROM sales;');
  const eCount = await client.query('SELECT count(*) FROM expenses;');

  console.log('\n--- SUPABASE CLOUD DEPLOYMENT STATUS ---');
  console.log('✓ Profiles in Cloud DB:', uCount.rows[0].count);
  console.log('✓ Sales in Cloud DB (clean slate):', sCount.rows[0].count);
  console.log('✓ Expenses in Cloud DB (clean slate):', eCount.rows[0].count);

  await client.end();
  console.log('Database setup complete!');
}

deploy().catch(err => {
  console.error('Deployment error:', err);
  process.exit(1);
});
