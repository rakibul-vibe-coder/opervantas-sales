const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vnwqbedkszbgzrnfkspj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZud3FiZWRrc3piZ3pybmZrc3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTMxMTEyMCwiZXhwIjoyMTEwODg3MTIwfQ.utb_vG_YBbRm8w-G-Tdzx3gZCXPU_Y3n5MpfXCWHYMI';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('Retrieving users from Supabase Auth...');
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;

  const usersMap = {};
  for (const u of listData.users) {
    usersMap[u.email] = u.id;
  }

  const profilesToSeed = [
    {
      email: 'manager@opervantas.com',
      username: 'admin_manager',
      full_name: 'Store Manager',
      role: 'manager',
      employee_id: 'EMP-1001',
    },
    {
      email: 'rahim@opervantas.com',
      username: 'rahim_sales',
      full_name: 'Md. Rahim Uddin',
      role: 'salesman',
      employee_id: 'EMP-1002',
    },
    {
      email: 'karim@opervantas.com',
      username: 'karim_sales',
      full_name: 'Md. Karim Hossain',
      role: 'salesman',
      employee_id: 'EMP-1003',
    },
  ];

  for (const p of profilesToSeed) {
    const userId = usersMap[p.email];
    if (!userId) {
      console.error(`User ID not found for ${p.email}`);
      continue;
    }

    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: p.username,
        full_name: p.full_name,
        role: p.role,
        status: 'active',
        employee_id: p.employee_id,
      }, { onConflict: 'username' })
      .select()
      .single();

    if (profErr) {
      console.error(`Error creating profile for ${p.username}:`, profErr);
    } else {
      console.log(`✓ Profile linked successfully: ${p.username} (${p.full_name}, ID: ${userId})`);
    }
  }

  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: salesCount } = await supabase.from('sales').select('*', { count: 'exact', head: true });
  const { count: expCount } = await supabase.from('expenses').select('*', { count: 'exact', head: true });

  console.log('\n--- FINAL SUPABASE CLOUD STATUS ---');
  console.log('✓ Registered Profiles:', userCount);
  console.log('✓ Total Sales in Cloud DB:', salesCount);
  console.log('✓ Total Expenses in Cloud DB:', expCount);
}

seed().catch(console.error);
