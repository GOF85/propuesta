
const VenueService = require('./src/services/VenueService');

async function runSync() {
  try {
    console.log('Running full sync from website...');
    const result = await VenueService.syncVenuesFromWebsite();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    process.exit(0);
  }
}

runSync();
