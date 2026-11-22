const { Client } = require('pg');

const connectionString = 'postgresql://postgres.vnwqbedkszbgzrnfkspj:Opervantas2026SalesManagementDb99@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

async function grantPermissions() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Granting permissions on public schema...');
  const sql = `
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
  `;

  await client.query(sql);
  console.log('✓ Public schema permissions granted successfully!');
  await client.end();
}

grantPermissions().catch(console.error);
