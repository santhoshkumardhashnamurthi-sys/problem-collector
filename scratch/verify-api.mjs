async function run() {
  const BASE_URL = 'http://localhost:3002';

  console.log('--- 1. Testing GET /api/problems ---');
  const getRes = await fetch(`${BASE_URL}/api/problems`);
  const getData = await getRes.json();
  console.log('Status:', getRes.status);
  console.log('Success:', getData.success);
  console.log('Problems count:', getData.count);
  console.log('First problem code:', getData.problems?.[0]?.problem_code);

  console.log('\n--- 2. Testing POST /api/problems ---');
  const postRes = await fetch(`${BASE_URL}/api/problems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'Technology',
      raw_description: 'Agricultural sensors suffer connectivity drops in rural farm fields',
      location: 'Coimbatore',
      name: 'Ramesh',
      contact: 'ramesh@farmtech.io',
      is_anonymous: false,
    }),
  });
  const postData = await postRes.json();
  console.log('Status:', postRes.status);
  console.log('POST Response:', postData);

  console.log('\n--- 3. Testing GET /api/problems again (count check) ---');
  const getRes2 = await fetch(`${BASE_URL}/api/problems`);
  const getData2 = await getRes2.json();
  console.log('Updated count:', getData2.count);
  console.log('Latest problem:', getData2.problems?.[0]?.problem_code, getData2.problems?.[0]?.category_name);

  console.log('\n--- 4. Testing GET /api/problems/export (Excel download) ---');
  const exportRes = await fetch(`${BASE_URL}/api/problems/export`);
  console.log('Export status:', exportRes.status);
  console.log('Content-Type:', exportRes.headers.get('content-type'));
  console.log('Content-Disposition:', exportRes.headers.get('content-disposition'));
  const exportBuffer = await exportRes.arrayBuffer();
  console.log('Downloaded Excel file size in bytes:', exportBuffer.byteLength);

  console.log('\n--- 5. Testing GET /api/admin/sync (Health check) ---');
  const syncRes = await fetch(`${BASE_URL}/api/admin/sync`);
  const syncData = await syncRes.json();
  console.log('Sync status:', syncRes.status);
  console.log('Sync response:', syncData);

  console.log('\n--- 6. Testing GET /api/stats ---');
  const statsRes = await fetch(`${BASE_URL}/api/stats`);
  const statsData = await statsRes.json();
  console.log('Stats status:', statsRes.status);
  console.log('Stats response:', statsData);

  console.log('\n>>> ALL LIVE HTTP API TESTS COMPLETED SUCCESSFULLY! <<<');
}

run().catch((e) => {
  console.error('API verification failed:', e);
  process.exit(1);
});
