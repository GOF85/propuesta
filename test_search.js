
require('dotenv').config();
const DishService = require('./src/services/DishService');

async function testSearch() {
  try {
    console.log('Testing search for "Test"...');
    const results = await DishService.search('Test');
    console.log('Results:', JSON.stringify(results, null, 2));
    
    console.log('\nTesting search for "chisme"...');
    const results2 = await DishService.search('chisme');
    console.log('Results:', JSON.stringify(results2, null, 2));
  } catch (err) {
    console.error('Error testing search:', err);
  } finally {
    process.exit();
  }
}

testSearch();
