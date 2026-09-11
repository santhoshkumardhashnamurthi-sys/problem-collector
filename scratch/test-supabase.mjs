import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim();
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log('Testing Supabase with URL:', url);
const sbAdmin = createClient(url, serviceRoleKey);
const sbAnon = createClient(url, anonKey);

async function test() {
  console.log('--- Testing Service Role ---');
  const resProblems = await sbAdmin.from('problems').select('*').limit(1);
  console.log('Admin problems table:', resProblems);

  const resCategories = await sbAdmin.from('problem_categories').select('*').limit(1);
  console.log('Admin problem_categories table:', resCategories);

  console.log('--- Testing Anon ---');
  const anonProblems = await sbAnon.from('problems').select('*').limit(1);
  console.log('Anon problems table:', anonProblems);
}

test().catch(console.error);
