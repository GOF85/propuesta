
const DishService = require('./src/services/DishService');

async function simulateApi() {
  const mockReqNoQ = { query: { limit: 500 } };
  const mockReqWithQ = { query: { q: 'Test', limit: 10 } };
  
  console.log('Simulating /api/dishes (no q):');
  if (!mockReqNoQ.query.q || mockReqNoQ.query.q.trim().length < 2) {
    console.log('Response: { dishes: [] }');
  } else {
    const dishes = await DishService.search(mockReqNoQ.query.q, mockReqNoQ.query.limit);
    console.log('Response:', dishes);
  }

  console.log('\nSimulating /api/dishes?q=Test:');
  if (!mockReqWithQ.query.q || mockReqWithQ.query.q.trim().length < 2) {
    console.log('Response: { dishes: [] }');
  } else {
    const dishes = await DishService.search(mockReqWithQ.query.q, mockReqWithQ.query.limit);
    console.log('Response:', JSON.stringify(dishes, null, 2));
  }
}

simulateApi();
