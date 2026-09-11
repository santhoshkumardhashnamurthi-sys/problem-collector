async function test() {
  const payload = {
    raw_description: 'Commuters have no sheltered bus stops along the highway resulting in heat exhaustion and rain delays.',
    category: 'Transport',
    user_type: 'Working Professionals',
    frequency: 'Daily',
    location: 'Bengaluru, Electronic City',
    is_anonymous: true,
  };

  console.log('Sending submission payload...');
  const res = await fetch('http://localhost:3001/api/problems', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', JSON.stringify(data, null, 2));

  console.log('\nFetching updated stats...');
  const statsRes = await fetch('http://localhost:3001/api/stats');
  const statsData = await statsRes.json();
  console.log('UPDATED STATS:', JSON.stringify(statsData, null, 2));
}

test().catch(console.error);
