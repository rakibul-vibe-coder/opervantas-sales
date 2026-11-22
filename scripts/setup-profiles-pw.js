const { Client } = require('pg');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const connectionString = 'postgresql://postgres.vnwqbedkszbgzrnfkspj:Opervantas2026SalesManagementDb99@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

async function setup() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Adding password_hash column to profiles...');
  await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;');

  await client.query('UPDATE profiles SET password_hash = $1 WHERE username = $2', [hashPassword('manager123'), 'admin_manager']);
  await client.query('UPDATE profiles SET password_hash = $1 WHERE username = $2', [hashPassword('salesman123'), 'rahim_sales']);
  await client.query('UPDATE profiles SET password_hash = $1 WHERE username = $2', [hashPassword('salesman123'), 'karim_sales']);

  const res = await client.query('SELECT username, full_name, role, status, employee_id, (password_hash IS NOT NULL) as has_password FROM profiles;');
  console.log('Verified Supabase Cloud Profiles:');
  console.table(res.rows);

  await client.end();
}

setup().catch(console.error);
