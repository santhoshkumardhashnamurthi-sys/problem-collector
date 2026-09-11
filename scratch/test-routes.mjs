const routes = [
  '/',
  '/about',
  '/how-it-works',
  '/submit',
  '/explore',
  '/insights',
  '/landscape',
  '/live',
  '/locations',
  '/categories',
  '/problems/category/transport',
  '/admin',
  '/profile',
];

async function checkRoutes() {
  console.log('Testing all ARTIX routes on http://localhost:3001...\n');
  let passed = 0;
  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3001${r}`);
      console.log(`[${res.status}] ${r}`);
      if (res.status === 200) passed++;
    } catch (e) {
      console.log(`[ERR] ${r}:`, e.message);
    }
  }
  console.log(`\nResults: ${passed}/${routes.length} routes responded with 200 OK.`);
}

checkRoutes();
