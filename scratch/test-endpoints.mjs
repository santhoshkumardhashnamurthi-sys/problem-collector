import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim();
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const endpoints = [
  { url: `${url}/rest/v1/rpc/exec_sql`, method: 'POST', body: JSON.stringify({ query: 'SELECT 1;' }) },
  { url: `${url}/rest/v1/rpc/execute_sql`, method: 'POST', body: JSON.stringify({ sql: 'SELECT 1;' }) },
  { url: `${url}/pg/query`, method: 'POST', body: JSON.stringify({ query: 'SELECT 1;' }) },
  { url: `${url}/database/query`, method: 'POST', body: JSON.stringify({ query: 'SELECT 1;' }) },
];

async function test() {
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: ep.body
      });
      console.log(ep.url, '=> Status:', res.status, 'Body:', (await res.text()).slice(0, 100));
    } catch (e) {
      console.log(ep.url, '=> Error:', e.message);
    }
  }
}

test();
