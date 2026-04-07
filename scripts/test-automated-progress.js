const fetch = require('node-fetch');

const BASE = 'http://localhost:3000';
const HASH = '63ee3130644f42fdbf174787ea0bc058';

async function getJson() {
  const res = await fetch(`${BASE}/p/${HASH}/json`);
  const data = await res.json();
  return data;
}

async function postStatus(serviceId, status) {
  const res = await fetch(`${BASE}/p/${HASH}/milestone/${serviceId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.json();
}

async function postSelectOption(serviceId, optionId) {
  const res = await fetch(`${BASE}/p/${HASH}/select-option`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId, optionId })
  });
  return res.json();
}

async function run() {
  console.log('Starting automated progress test for', HASH);

  const before = await getJson();
  console.log('Initial progress:', before.stats.progress_percentage);

  // Find a multichoice service (prefer pending, otherwise pick any and reset it)
  let svc = (before.proposal.services || []).find(s => s.is_multichoice && (s.selected_option_index === null || s.selected_option_index === undefined));
  if (!svc) {
    svc = (before.proposal.services || []).find(s => s.is_multichoice);
    if (!svc) {
      console.error('No multichoice service found to test. Aborting.');
      process.exit(2);
    }
    console.log('Found multichoice service already selected — cancelling it first to create a pending state');
    await postStatus(svc.id, 'cancelled');
    // refresh state
    await new Promise(r => setTimeout(r, 300));
  }

  // refresh data and pick the service again to ensure correct indices
  const mid = await getJson();
  svc = (mid.proposal.services || []).find(s => s.is_multichoice && (s.id === svc.id));
  console.log('Testing service:', svc.id, svc.title);

  // Select an option (first option)
  const optId = svc.options && svc.options[0] && svc.options[0].id;
  if (!optId) {
    console.error('No option id available for service', svc.id);
    process.exit(2);
  }

  console.log(`Selecting option ${optId} for service ${svc.id}...`);
  const sel = await postSelectOption(svc.id, optId);
  console.log('Select response:', sel);

  const afterSelect = await getJson();
  console.log('Progress after select:', afterSelect.stats.progress_percentage);

  // Now cancel the service via milestone endpoint
  console.log('Cancelling service via milestone endpoint...');
  const cancelled = await postStatus(svc.id, 'cancelled');
  console.log('Cancel response:', cancelled);

  const afterCancel = await getJson();
  console.log('Progress after cancel:', afterCancel.stats.progress_percentage);

  // Results summary
  console.log('\n=== Summary ===');
  console.log('Initial:', before.stats.progress_percentage);
  console.log('After select:', afterSelect.stats.progress_percentage);
  console.log('After cancel:', afterCancel.stats.progress_percentage);

  const ok = (afterSelect.stats.progress_percentage > before.stats.progress_percentage) && (afterCancel.stats.progress_percentage < afterSelect.stats.progress_percentage || afterCancel.stats.progress_percentage === before.stats.progress_percentage);
  if (ok) {
    console.log('\nTest PASSED: progress moved dynamically as expected');
    process.exit(0);
  } else {
    console.error('\nTest FAILED: progress did not change as expected');
    process.exit(3);
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
