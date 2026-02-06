#!/usr/bin/env node

/**
 * Script: Seed Test Data - DATOS DUMMY COMPLETOS
 * Purpose: Inserta datos de prueba COMPLETOS para ver todo el funcionamiento
 * Usage: npm run seed
 */

require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { pool } = require('../src/config/db');

// ════════════════════════════════════════════════════════════════
// DATOS DE PRUEBA COMPLETOS
// ════════════════════════════════════════════════════════════════

const DUMMY_DATA = {
  // USUARIOS
  users: [
    {
      name: 'Juan Pérez',
      email: 'juan@micecatering.eu',
      password: 'password123',
      role: 'commercial',
      phone: '+34 600 123 456',
      avatar_url: '/uploads/avatars/juan.jpg'
    },
    {
      name: 'María González',
      email: 'maria@micecatering.eu',
      password: 'password123',
      role: 'commercial',
      phone: '+34 600 654 321',
      avatar_url: '/uploads/avatars/maria.jpg'
    },
    {
      name: 'Admin User',
      email: 'admin@micecatering.eu',
      password: 'admin123',
      role: 'admin',
      phone: '+34 600 999 999',
      avatar_url: null
    }
  ],

  // VENUES (Catálogo)
  venues: [
    {
      name: 'Sala Modernista Barcelona',
      description: 'Espacio diáfano con techos altos y luz natural. Perfecto para eventos corporativos y presentaciones.',
      capacity_cocktail: 200,
      capacity_banquet: 120,
      capacity_theater: 150,
      features: JSON.stringify(['Luz natural', 'Wifi 1Gbps', 'Proyector 4K', 'Aire acondicionado', 'Acceso discapacitados']),
      address: 'Passeig de Gràcia, 85, Barcelona',
      map_iframe: 'https://maps.google.com/?q=Barcelona',
      external_url: 'https://micecatering.com/venues/sala-modernista',
      images: JSON.stringify(['/uploads/venues/sala-modernista-1.webp', '/uploads/venues/sala-modernista-2.webp'])
    },
    {
      name: 'Hotel Boutique Terraza Madrid',
      description: 'Terraza panorámica con vistas espectaculares. Ideal para cocktails y eventos al aire libre.',
      capacity_cocktail: 150,
      capacity_banquet: 80,
      capacity_theater: 100,
      features: JSON.stringify(['Vista panorámica', 'Wifi', 'Toldo retráctil', 'Calefacción exterior', 'Bar integrado']),
      address: 'Gran Vía, 32, Madrid',
      map_iframe: 'https://maps.google.com/?q=Madrid',
      external_url: 'https://micecatering.com/venues/hotel-boutique',
      images: JSON.stringify(['/uploads/venues/terraza-madrid-1.webp'])
    },
    {
      name: 'Centro de Convenciones Valencia',
      description: 'Espacios versátiles con capacidad modular. Perfecto para grandes eventos corporativos.',
      capacity_cocktail: 500,
      capacity_banquet: 300,
      capacity_theater: 400,
      features: JSON.stringify(['Wifi', 'Proyección múltiple', 'Catering integrado', 'Parking 200 plazas', 'Acceso VIP']),
      address: 'Avenida de las Ciencias, 1, Valencia',
      map_iframe: 'https://maps.google.com/?q=Valencia',
      external_url: 'https://micecatering.com/venues/centro-convenciones',
      images: JSON.stringify(['/uploads/venues/valencia-1.webp', '/uploads/venues/valencia-2.webp'])
    }
  ],

  // PLATOS (Catálogo)
  dishes: [
    // ENTRANTES
    { name: 'Ensalada César', description: 'Lechuga romana, croutons, parmesano, salsa César casera', category: 'entrante', allergens: JSON.stringify(['gluten', 'lacteos', 'huevo']), badges: JSON.stringify([]), image_url: '/uploads/dishes/ensalada-cesar.webp', base_price: 8.50 },
    { name: 'Carpaccio de ternera', description: 'Láminas finas con rúcula, parmesano y vinagreta de mostaza', category: 'entrante', allergens: JSON.stringify(['lacteos', 'mostaza']), badges: JSON.stringify([]), image_url: '/uploads/dishes/carpaccio.webp', base_price: 12.00 },
    { name: 'Crema de calabaza', description: 'Con aceite de trufa y semillas tostadas', category: 'entrante', allergens: JSON.stringify(['frutos secos']), badges: JSON.stringify(['vegano', 'sin gluten']), image_url: '/uploads/dishes/crema-calabaza.webp', base_price: 7.00 },
    { name: 'Tabla de quesos artesanales', description: 'Selección de 5 quesos con mermeladas y frutos secos', category: 'entrante', allergens: JSON.stringify(['lacteos', 'frutos secos']), badges: JSON.stringify([]), image_url: '/uploads/dishes/tabla-quesos.webp', base_price: 15.00 },
    
    // PRINCIPALES
    { name: 'Solomillo de ternera', description: 'Con reducción de oporto y puré de patata trufado', category: 'principal', allergens: JSON.stringify(['lacteos']), badges: JSON.stringify(['premium']), image_url: '/uploads/dishes/solomillo.webp', base_price: 28.00 },
    { name: 'Lubina al horno', description: 'Con verduras mediterráneas y salsa de azafrán', category: 'principal', allergens: JSON.stringify(['pescado']), badges: JSON.stringify(['sin gluten']), image_url: '/uploads/dishes/lubina.webp', base_price: 24.00 },
    { name: 'Risotto de setas', description: 'Con boletus, shiitake y parmesano rallado', category: 'principal', allergens: JSON.stringify(['lacteos', 'setas']), badges: JSON.stringify(['vegetariano']), image_url: '/uploads/dishes/risotto.webp', base_price: 18.00 },
    { name: 'Pollo al curry thai', description: 'Con arroz basmati y verduras salteadas', category: 'principal', allergens: JSON.stringify(['lacteos']), badges: JSON.stringify(['picante']), image_url: '/uploads/dishes/curry-thai.webp', base_price: 16.00 },
    
    // POSTRES
    { name: 'Tarta de queso New York', description: 'Con coulis de frutos rojos', category: 'postre', allergens: JSON.stringify(['lacteos', 'gluten', 'huevo']), badges: JSON.stringify([]), image_url: '/uploads/dishes/cheesecake.webp', base_price: 6.50 },
    { name: 'Brownie de chocolate', description: 'Con helado de vainilla y salsa de caramelo', category: 'postre', allergens: JSON.stringify(['lacteos', 'gluten', 'huevo', 'frutos secos']), badges: JSON.stringify([]), image_url: '/uploads/dishes/brownie.webp', base_price: 7.00 },
    { name: 'Sorbete de limón', description: 'Refrescante y ligero', category: 'postre', allergens: JSON.stringify([]), badges: JSON.stringify(['vegano', 'sin gluten']), image_url: '/uploads/dishes/sorbete.webp', base_price: 5.00 }
  ]
};


// ════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════════

async function seedData() {
  let conn;
  const insertedIds = {
    users: [],
    venues: [],
    dishes: [],
    proposals: []
  };

  try {
    conn = await pool.getConnection();
    console.log('🌱 Iniciando seed de DATOS DUMMY COMPLETOS...\n');

    // ═══════════════════════════════════════════════════════════
    // 1. INSERTAR USUARIOS
    // ═══════════════════════════════════════════════════════════
    console.log('👥 Insertando usuarios...');
    for (const user of DUMMY_DATA.users) {
      const existing = await conn.query('SELECT id FROM users WHERE email = ?', [user.email]);
      if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const result = await conn.query(
          `INSERT INTO users (name, email, password_hash, phone, avatar_url, role, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [user.name, user.email, hashedPassword, user.phone, user.avatar_url, user.role]
        );
        insertedIds.users.push({ id: result.insertId, email: user.email, name: user.name });
        console.log(`  ✅ ${user.name} (${user.email})`);
      } else {
        insertedIds.users.push({ id: existing[0].id, email: user.email, name: user.name });
        console.log(`  ℹ️  ${user.name} ya existe`);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 2. INSERTAR VENUES (Catálogo)
    // ═══════════════════════════════════════════════════════════
    console.log('\n🏛️  Insertando venues...');
    for (const venue of DUMMY_DATA.venues) {
      const existing = await conn.query('SELECT id FROM venues WHERE name = ?', [venue.name]);
      if (existing.length === 0) {
        const result = await conn.query(
          `INSERT INTO venues (name, description, capacity_cocktail, capacity_banquet, 
           capacity_theater, features, address, map_iframe, external_url, images, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [venue.name, venue.description, venue.capacity_cocktail, venue.capacity_banquet,
           venue.capacity_theater, venue.features, venue.address, venue.map_iframe,
           venue.external_url, venue.images]
        );
        insertedIds.venues.push({ id: result.insertId, name: venue.name });
        console.log(`  ✅ ${venue.name}`);
      } else {
        insertedIds.venues.push({ id: existing[0].id, name: venue.name });
        console.log(`  ℹ️  ${venue.name} ya existe`);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 3. INSERTAR PLATOS (Catálogo)
    // ═══════════════════════════════════════════════════════════
    console.log('\n🍽️  Insertando platos...');
    for (const dish of DUMMY_DATA.dishes) {
      const existing = await conn.query('SELECT id FROM dishes WHERE name = ?', [dish.name]);
      if (existing.length === 0) {
        const result = await conn.query(
          `INSERT INTO dishes (name, description, category, allergens, badges, image_url, base_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [dish.name, dish.description, dish.category, dish.allergens, dish.badges, dish.image_url, dish.base_price]
        );
        insertedIds.dishes.push({ id: result.insertId, name: dish.name });
        console.log(`  ✅ ${dish.name} (${dish.category})`);
      } else {
        insertedIds.dishes.push({ id: existing[0].id, name: dish.name });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 4. CREAR PROPUESTAS COMPLETAS
    // ═══════════════════════════════════════════════════════════
    console.log('\n📋 Creando propuestas completas...');
    
    const comercial1 = insertedIds.users.find(u => u.email === 'juan@micecatering.eu');
    const comercial2 = insertedIds.users.find(u => u.email === 'maria@micecatering.eu');

    // PROPUESTA 1: Amazon (COMPLETA con servicios y platos)
    const proposal1 = await createCompleteProposal(conn, {
      user_id: comercial1.id,
      client_name: 'Amazon Web Services',
      event_date: '2026-03-15',
      pax: 120,
      status: 'sent',
      brand_color: '#FF9900',
      logo_url: '/uploads/logos/amazon.png',
      legal_conditions: 'Válido hasta 30 días. Precios sujetos a cambios según disponibilidad.',
      venues: [insertedIds.venues[0].id], // Sala Modernista
      services: [
        {
          title: 'Welcome Coffee',
          type: 'gastronomy',
          start_time: '09:00',
          end_time: '10:00',
          vat_rate: 10.00,
          options: [
            {
              name: 'Opción Estándar',
              price_pax: 5.50,
              dishes: [insertedIds.dishes[2].id] // Crema calabaza
            }
          ]
        },
        {
          title: 'Almuerzo Ejecutivo',
          type: 'gastronomy',
          start_time: '14:00',
          end_time: '16:00',
          vat_rate: 10.00,
          is_multichoice: true,
          options: [
            {
              name: 'Opción Carne',
              price_pax: 32.00,
              dishes: [insertedIds.dishes[0].id, insertedIds.dishes[4].id, insertedIds.dishes[8].id]
            },
            {
              name: 'Opción Pescado',
              price_pax: 28.00,
              dishes: [insertedIds.dishes[0].id, insertedIds.dishes[5].id, insertedIds.dishes[10].id]
            }
          ]
        },
        {
          title: 'Coffee Break Tarde',
          type: 'gastronomy',
          start_time: '17:00',
          end_time: '17:30',
          vat_rate: 10.00,
          options: [
            {
              name: 'Dulces y Café',
              price_pax: 4.50,
              dishes: [insertedIds.dishes[9].id]
            }
          ]
        }
      ]
    });
    console.log(`  ✅ Propuesta #${proposal1.id} - Amazon Web Services (con 3 servicios)`);

    // PROPUESTA 2: Google (BORRADOR simple)
    const proposal2 = await createSimpleProposal(conn, {
      user_id: comercial1.id,
      client_name: 'Google Spain',
      event_date: '2026-04-20',
      pax: 80,
      status: 'draft',
      brand_color: '#4285F4',
      venues: [insertedIds.venues[1].id]
    });
    console.log(`  ✅ Propuesta #${proposal2.id} - Google Spain (borrador)`);

    // PROPUESTA 3: Microsoft (ACEPTADA)
    const proposal3 = await createCompleteProposal(conn, {
      user_id: comercial2.id,
      client_name: 'Microsoft Iberia',
      event_date: '2026-02-28',
      pax: 150,
      status: 'accepted',
      brand_color: '#00A4EF',
      venues: [insertedIds.venues[2].id],
      services: [
        {
          title: 'Cocktail de Bienvenida',
          type: 'gastronomy',
          start_time: '19:00',
          end_time: '21:00',
          vat_rate: 10.00,
          options: [
            {
              name: 'Premium',
              price_pax: 45.00,
              dishes: [insertedIds.dishes[1].id, insertedIds.dishes[3].id, insertedIds.dishes[4].id]
            }
          ]
        }
      ]
    });
    console.log(`  ✅ Propuesta #${proposal3.id} - Microsoft Iberia (aceptada)`);

    // PROPUESTA 4: Telefónica (ENVIADA con chat)
    const proposal4 = await createCompleteProposal(conn, {
      user_id: comercial2.id,
      client_name: 'Telefónica S.A.',
      event_date: '2026-05-10',
      pax: 200,
      status: 'sent',
      brand_color: '#019DF4',
      venues: [insertedIds.venues[0].id, insertedIds.venues[2].id],
      services: [
        {
          title: 'Desayuno de Trabajo',
          type: 'gastronomy',
          start_time: '08:30',
          end_time: '10:00',
          vat_rate: 10.00,
          options: [
            {
              name: 'Continental',
              price_pax: 12.00,
              dishes: [insertedIds.dishes[2].id, insertedIds.dishes[10].id]
            }
          ]
        },
        {
          title: 'Almuerzo Gala',
          type: 'gastronomy',
          start_time: '14:00',
          end_time: '17:00',
          vat_rate: 10.00,
          is_multichoice: true,
          options: [
            {
              name: 'Menú Premium',
              price_pax: 55.00,
              dishes: [insertedIds.dishes[1].id, insertedIds.dishes[4].id, insertedIds.dishes[9].id]
            },
            {
              name: 'Menú Vegetariano',
              price_pax: 48.00,
              dishes: [insertedIds.dishes[0].id, insertedIds.dishes[6].id, insertedIds.dishes[10].id]
            }
          ]
        }
      ]
    });
    console.log(`  ✅ Propuesta #${proposal4.id} - Telefónica (con opciones multichoice)`);

    // Agregar mensajes de chat a propuesta 4
    await conn.query(
      `INSERT INTO messages (proposal_id, sender_role, message_body, created_at)
       VALUES (?, 'commercial', 'Hola, adjunto la propuesta para su evento del 10 de mayo. Quedamos atentos a cualquier consulta.', NOW())`,
      [proposal4.id]
    );
    await conn.query(
      `INSERT INTO messages (proposal_id, sender_role, message_body, is_read, created_at)
       VALUES (?, 'client', '¿Es posible incluir opciones veganas en el menú premium?', 0, NOW())`,
      [proposal4.id]
    );
    console.log(`  💬 2 mensajes de chat agregados a propuesta #${proposal4.id}`);

    // ═══════════════════════════════════════════════════════════
    // 5. RESUMEN FINAL
    // ═══════════════════════════════════════════════════════════
    console.log('\n✨ Seed completado exitosamente!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE DATOS INSERTADOS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Usuarios:    ${insertedIds.users.length}`);
    console.log(`✅ Venues:      ${insertedIds.venues.length}`);
    console.log(`✅ Platos:      ${insertedIds.dishes.length}`);
    console.log(`✅ Propuestas:  4 (con servicios, opciones y platos)`);
    console.log(`✅ Mensajes:    2 (chat en propuesta Telefónica)`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('🔐 CREDENCIALES DE ACCESO:');
    console.log('─────────────────────────────────────────────────────');
    console.log('Usuario 1 (Comercial):');
    console.log('  Email:    juan@micecatering.eu');
    console.log('  Password: password123');
    console.log('');
    console.log('Usuario 2 (Comercial):');
    console.log('  Email:    maria@micecatering.eu');
    console.log('  Password: password123');
    console.log('');
    console.log('Usuario 3 (Admin):');
    console.log('  Email:    admin@micecatering.eu');
    console.log('  Password: admin123');
    console.log('─────────────────────────────────────────────────────\n');

    console.log('🚀 ACCEDE A LA APLICACIÓN:');
    console.log('   → http://localhost:3000\n');

    console.log('📋 FUNCIONALIDADES DISPONIBLES:');
    console.log('   ✅ Dashboard con 4 propuestas (draft, sent, accepted)');
    console.log('   ✅ Editor con venues, servicios y platos');
    console.log('   ✅ Cálculo de precios con VAT');
    console.log('   ✅ Opciones multichoice (Opción A/B)');
    console.log('   ✅ Sistema de chat (2 mensajes en propuesta Telefónica)');
    console.log('   ✅ Magic links para acceso cliente');
    console.log('   ✅ 3 usuarios con diferentes roles\n');

  } catch (err) {
    console.error('\n❌ Error durante seed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
}

// ════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ════════════════════════════════════════════════════════════════

async function createSimpleProposal(conn, data) {
  const proposalId = uuid();
  const hash = uuid();
  
  await conn.query(
    `INSERT INTO proposals (id, user_id, unique_hash, client_name, event_date, pax, 
     brand_color, logo_url, status, is_editing, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, 0, NOW())`,
    [proposalId, data.user_id, hash, data.client_name, data.event_date, 
     data.pax, data.brand_color || '#000000', data.status]
  );

  // Agregar venues
  for (const venueId of data.venues || []) {
    await conn.query(
      `INSERT INTO proposal_venues (proposal_id, venue_id, is_selected)
       VALUES (?, ?, 1)`,
      [proposalId, venueId]
    );
  }

  return { id: proposalId, hash };
}

async function createCompleteProposal(conn, data) {
  const proposalId = uuid();
  const hash = uuid();
  
  // 1. Crear propuesta
  await conn.query(
    `INSERT INTO proposals (id, user_id, unique_hash, client_name, event_date, pax, 
     brand_color, logo_url, legal_conditions, status, is_editing, valid_until, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())`,
    [proposalId, data.user_id, hash, data.client_name, data.event_date, 
     data.pax, data.brand_color || '#000000', data.logo_url || null,
     data.legal_conditions || 'Condiciones estándar aplicables.', data.status]
  );

  // 2. Agregar venues
  for (const venueId of data.venues || []) {
    await conn.query(
      `INSERT INTO proposal_venues (proposal_id, venue_id, is_selected)
       VALUES (?, ?, 1)`,
      [proposalId, venueId]
    );
  }

  // 3. Agregar servicios con opciones y platos
  for (let i = 0; i < (data.services || []).length; i++) {
    const service = data.services[i];
    const serviceResult = await conn.query(
      `INSERT INTO proposal_services (proposal_id, title, type, start_time, end_time, 
       vat_rate, order_index, is_multichoice, selected_option_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [proposalId, service.title, service.type, service.start_time, service.end_time,
       service.vat_rate, i, service.is_multichoice ? 1 : 0]
    );
    const serviceId = serviceResult.insertId;

    // Agregar opciones del servicio
    for (const option of service.options || []) {
      const optionResult = await conn.query(
        `INSERT INTO service_options (service_id, name, price_pax, discount_pax)
         VALUES (?, ?, ?, 0.00)`,
        [serviceId, option.name, option.price_pax]
      );
      const optionId = optionResult.insertId;

      // Agregar platos a la opción
      for (const dishId of option.dishes || []) {
        const dish = await conn.query('SELECT * FROM dishes WHERE id = ?', [dishId]);
        if (dish.length > 0) {
          await conn.query(
            `INSERT INTO proposal_items (option_id, name, description, allergens, badges, image_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [optionId, dish[0].name, dish[0].description, dish[0].allergens, 
             dish[0].badges, dish[0].image_url]
          );
        }
      }
    }
  }

  return { id: proposalId, hash };
}

seedData();
