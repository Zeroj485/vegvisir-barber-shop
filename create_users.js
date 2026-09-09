// create_users.js
// Node script to create barber user accounts and profiles in Supabase using the service_role key.
// USAGE (run locally):
//   export SUPABASE_URL="https://qtdfvsoahsezalwnfaly.supabase.co"
//   export SERVICE_ROLE_KEY="<your service_role_key_here>"
//   node create_users.js

const fetch = global.fetch || require('node:fetch');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qtdfvsoahsezalwnfaly.supabase.co';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
if(!SERVICE_ROLE_KEY){
  console.error('ERROR: Set SERVICE_ROLE_KEY env var before running.');
  process.exit(1);
}

const users = [
  { email: 'alejandro@vegvisir.local', password: 'Vegv2026!', username: 'alejandro', full_name: 'Alejandro' },
  { email: 'karel@vegvisir.local', password: 'Vegv2026!', username: 'karel', full_name: 'Karel' },
  { email: 'leo@vegvisir.local', password: 'Vegv2026!', username: 'leo', full_name: 'Leo' },
  { email: 'marco@vegvisir.local', password: 'Vegv2026!', username: 'marco', full_name: 'Marco' },
  { email: 'chino@vegvisir.local', password: 'Vegv2026!', username: 'chino', full_name: 'Chino' }
];

async function createUser(user){
  const url = `${SUPABASE_URL}/auth/v1/admin/users`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { username: user.username, full_name: user.full_name, role: 'barber' }
    })
  });
  const data = await res.json();
  if(!res.ok){
    console.error('Failed creating user', user.email, data);
    return null;
  }
  console.log('Created user', user.email, 'id=', data.id);
  return data;
}

async function createProfile(profile){
  const url = `${SUPABASE_URL}/rest/v1/profiles`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(profile)
  });
  const data = await res.json();
  if(!res.ok){
    console.error('Failed creating profile', profile, data);
    return null;
  }
  console.log('Created profile', data);
  return data;
}

(async ()=>{
  for(const u of users){
    const created = await createUser(u);
    if(created && created.id){
      await createProfile({ id: created.id, username: u.username, full_name: u.full_name, role: 'barber' });
    }
  }
  console.log('Done. Barbero accounts created. Inform users to login with the provided email and password.');
})();
