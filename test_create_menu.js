const MenuService = require('./src/services/MenuService');
const DishService = require('./src/services/DishService');

async function test() {
    try {
        console.log('--- TEST CREATE MENU ---');
        // Get some dish IDs
        const { dishes } = await DishService.getAll({ limit: 2 });
        if (dishes.length === 0) {
            console.log('No dishes found to create menu');
            return;
        }
        const dishIds = dishes.map(d => d.id);
        console.log('Using dishes:', dishIds);

        const name = 'MENU TEST ' + Date.now();
        const menu = await MenuService.create({
            name,
            description: 'Test description',
            base_price: 50.50,
            price_model: 'pax',
            dishIds,
            images: [],
            badges: ['NUEVO']
        });
        console.log('✅ Menu created successfully:', menu.id, menu.name);
    } catch (err) {
        console.error('❌ Error creating menu:', err);
    } finally {
        process.exit();
    }
}

test();
