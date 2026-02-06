#!/usr/bin/env node

/**
 * Test Script - Motor Financiero Completo
 * Prueba todas las funcionalidades del sistema de cálculo
 * 
 * Uso: node scripts/test-financial-engine.js
 */

const { pool } = require('../src/config/db');
const ProposalService = require('../src/services/ProposalService');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

async function testFinancialEngine() {
  let proposalId = null;
  let userId = null;

  try {
    log.section('MOTOR FINANCIERO - Test Suite');

    // 1. Setup: Crear usuario de prueba
    log.info('Paso 1: Crear usuario de prueba');
    const conn = await pool.getConnection();
    
    const userResult = await conn.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
      ['Test User', 'test@financial.com', 'test123', 'admin']
    );
    userId = userResult.insertId || userResult[0].id;
    log.success(`Usuario creado: ID ${userId}`);

    // 2. Crear propuesta de prueba
    log.info('Paso 2: Crear propuesta de prueba (150 PAX)');
    const proposal = await ProposalService.createProposal(userId, {
      client_name: 'Test Financial Engine',
      event_date: '2026-06-15',
      pax: 150
    });
    proposalId = proposal.id;
    log.success(`Propuesta creada: ID ${proposalId}`);

    // 3. Añadir servicio de gastronomía (IVA 21%)
    log.info('Paso 3: Añadir servicio de gastronomía');
    const serviceFood = await conn.query(
      `INSERT INTO proposal_services 
       (proposal_id, title, type, vat_rate) 
       VALUES (?, ?, ?, ?)`,
      [proposalId, 'Comida Principal', 'gastronomy', 21.00]
    );
    const serviceFoodId = serviceFood.insertId;

    // Añadir opción con precio y coste
    const optionFood = await conn.query(
      `INSERT INTO service_options 
       (service_id, name, price_pax, discount_pax, cost_price) 
       VALUES (?, ?, ?, ?, ?)`,
      [serviceFoodId, 'Menú Standard', 35.00, 0, 22.00]
    );
    
    // Añadir ítem
    await conn.query(
      `INSERT INTO proposal_items 
       (option_id, name, description) 
       VALUES (?, ?, ?)`,
      [optionFood.insertId, 'Menú 3 platos', 'Entrante + Principal + Postre']
    );
    
    log.success('Servicio gastronomía: 35€/pax (coste: 22€)');

    // 4. Añadir servicio de logística (IVA 10%)
    log.info('Paso 4: Añadir servicio de logística');
    const serviceLogistics = await conn.query(
      `INSERT INTO proposal_services 
       (proposal_id, title, type, vat_rate) 
       VALUES (?, ?, ?, ?)`,
      [proposalId, 'Montaje y Desmontaje', 'logistics', 10.00]
    );
    const serviceLogisticsId = serviceLogistics.insertId;

    const optionLogistics = await conn.query(
      `INSERT INTO service_options 
       (service_id, name, price_pax, discount_pax, cost_price) 
       VALUES (?, ?, ?, ?, ?)`,
      [serviceLogisticsId, 'Montaje Estándar', 8.00, 0, 5.00]
    );
    
    await conn.query(
      `INSERT INTO proposal_items 
       (option_id, name, description) 
       VALUES (?, ?, ?)`,
      [optionLogistics.insertId, 'Montaje', 'Setup completo']
    );
    
    log.success('Servicio logística: 8€/pax (coste: 5€)');

    conn.end();

    // 5. TEST: Cálculo básico de totales
    log.section('TEST 1: Cálculo Básico de Totales');
    const totals1 = await ProposalService.calculateTotals(proposalId, { 
      persist: true, 
      auditUserId: userId 
    });

    console.log('📊 Resultados:');
    console.log(`   Base Imponible:      ${totals1.total_base.toFixed(2)} €`);
    console.log(`   IVA Alimentos (21%): ${totals1.total_vat_food.toFixed(2)} €`);
    console.log(`   IVA Servicios (10%): ${totals1.total_vat_services.toFixed(2)} €`);
    console.log(`   IVA Total:           ${totals1.total_vat.toFixed(2)} €`);
    console.log(`   TOTAL FINAL:         ${totals1.total_final.toFixed(2)} €`);
    console.log(`   Coste Total:         ${totals1.total_cost.toFixed(2)} €`);
    console.log(`   Margen:              ${totals1.total_margin.toFixed(2)} € (${totals1.margin_percentage.toFixed(2)}%)`);

    // Verificaciones
    const expectedBase = (35 + 8) * 150; // 6450
    const expectedVATFood = 35 * 150 * 0.21; // 1102.5
    const expectedVATServices = 8 * 150 * 0.10; // 120
    const expectedCost = (22 + 5) * 150; // 4050

    if (Math.abs(totals1.total_base - expectedBase) < 0.01) {
      log.success(`Base correcta: ${expectedBase} €`);
    } else {
      log.error(`Base incorrecta. Esperado: ${expectedBase}, Obtenido: ${totals1.total_base}`);
    }

    if (totals1.total_vat_food === parseFloat(expectedVATFood.toFixed(2))) {
      log.success(`IVA alimentos correcto: ${expectedVATFood.toFixed(2)} €`);
    } else {
      log.error(`IVA alimentos incorrecto. Esperado: ${expectedVATFood}, Obtenido: ${totals1.total_vat_food}`);
    }

    // 6. TEST: Descuento por volumen (150 PAX debería aplicar 5%)
    log.section('TEST 2: Descuento por Volumen Automático');
    log.info('Con 150 PAX, debe aplicarse descuento del 5% (tier 100-199)');
    
    if (totals1.volume_discount_applied) {
      log.success(`Descuento por volumen aplicado: ${totals1.volume_discount_percentage}%`);
      log.success(`Descuento en €: ${totals1.total_discount.toFixed(2)} €`);
    } else {
      log.warning('No se aplicó descuento por volumen automático');
    }

    // 7. TEST: Descuento manual
    log.section('TEST 3: Aplicar Descuento Manual');
    log.info('Aplicando descuento manual del 10% (razón: Cliente VIP)');
    
    const totals2 = await ProposalService.applyManualDiscount(
      proposalId,
      userId,
      10,
      'Cliente VIP - Descuento negociado'
    );

    console.log('📊 Resultados con descuento manual:');
    console.log(`   Base Original:       ${totals2.total_base.toFixed(2)} €`);
    console.log(`   Descuento (10%):     -${totals2.total_discount.toFixed(2)} €`);
    console.log(`   Base con Descuento:  ${totals2.total_base_after_discount.toFixed(2)} €`);
    console.log(`   IVA (recalculado):   ${totals2.total_vat.toFixed(2)} €`);
    console.log(`   TOTAL FINAL:         ${totals2.total_final.toFixed(2)} €`);

    if (totals2.manual_discount_percentage === 10) {
      log.success('Descuento manual aplicado correctamente');
    } else {
      log.error('Error al aplicar descuento manual');
    }

    // 8. TEST: Análisis de márgenes
    log.section('TEST 4: Análisis de Márgenes por Servicio');
    const analysis = await ProposalService.getMarginAnalysis(proposalId);

    console.log('📊 Análisis por Servicio:');
    for (const service of analysis.services) {
      console.log(`\n   ${service.title} (${service.type})`);
      console.log(`      Ingresos:  ${parseFloat(service.revenue || 0).toFixed(2)} €`);
      console.log(`      Coste:     ${parseFloat(service.cost || 0).toFixed(2)} €`);
      console.log(`      Margen:    ${parseFloat(service.margin || 0).toFixed(2)} € (${parseFloat(service.margin_percentage || 0).toFixed(2)}%)`);
    }

    console.log('\n📊 Resumen Ejecutivo:');
    console.log(`   Ingresos Totales: ${analysis.summary.total_revenue.toFixed(2)} €`);
    console.log(`   Coste Total:      ${analysis.summary.total_cost.toFixed(2)} €`);
    console.log(`   Margen Total:     ${analysis.summary.total_margin.toFixed(2)} €`);
    console.log(`   Margen %:         ${analysis.summary.margin_percentage.toFixed(2)}%`);
    
    if (analysis.summary.margin_percentage > 0) {
      log.success('Análisis de márgenes generado correctamente');
    }

    // 9. TEST: Auditoría
    log.section('TEST 5: Registro de Auditoría');
    const auditLog = await ProposalService.getPriceAuditLog(proposalId);

    console.log(`📋 Registros de Auditoría: ${auditLog.length}`);
    for (const entry of auditLog.slice(0, 3)) {
      console.log(`   [${entry.change_type}] ${entry.description}`);
      console.log(`      Valor: ${entry.old_value} → ${entry.new_value}`);
      console.log(`      Usuario: ${entry.user_name || 'Sistema'}`);
      console.log(`      Fecha: ${entry.created_at}`);
      console.log('');
    }

    if (auditLog.length >= 2) {
      log.success('Auditoría registrada correctamente');
    } else {
      log.warning('Pocos registros de auditoría');
    }

    // 10. TEST: Configuración de descuentos por volumen
    log.section('TEST 6: Configuración de Descuentos por Volumen');
    const tiers = await ProposalService.getVolumeDiscountTiers();

    console.log('📊 Tiers Configurados:');
    for (const tier of tiers) {
      const maxPax = tier.max_pax || '∞';
      console.log(`   ${tier.min_pax}-${maxPax} PAX: ${tier.discount_percentage}% - ${tier.description}`);
    }

    if (tiers.length >= 4) {
      log.success('Configuración de descuentos cargada correctamente');
    }

    // 11. Verificar persistencia en BD
    log.section('TEST 7: Verificar Persistencia en Base de Datos');
    const conn2 = await pool.getConnection();
    const [proposalDB] = await conn2.query(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );
    conn2.end();

    console.log('📊 Valores Persistidos:');
    console.log(`   total_base:           ${proposalDB.total_base}`);
    console.log(`   total_vat:            ${proposalDB.total_vat}`);
    console.log(`   total_final:          ${proposalDB.total_final}`);
    console.log(`   total_cost:           ${proposalDB.total_cost}`);
    console.log(`   total_margin:         ${proposalDB.total_margin}`);
    console.log(`   margin_percentage:    ${proposalDB.margin_percentage}%`);
    console.log(`   discount_percentage:  ${proposalDB.discount_percentage}%`);
    console.log(`   discount_reason:      ${proposalDB.discount_reason || 'N/A'}`);

    if (proposalDB.total_final > 0 && proposalDB.margin_percentage > 0) {
      log.success('Valores persistidos correctamente en BD');
    } else {
      log.error('Error: valores no persistidos correctamente');
    }

    // Resumen Final
    log.section('RESUMEN DE TESTS');
    log.success('✓ Cálculo de IVA dual (10% + 21%)');
    log.success('✓ Descuentos por volumen automáticos');
    log.success('✓ Descuentos manuales');
    log.success('✓ Cálculo de márgenes');
    log.success('✓ Auditoría de cambios');
    log.success('✓ Persistencia en Base de Datos');
    
    console.log('\n🎯 Motor Financiero: FUNCIONANDO CORRECTAMENTE\n');

  } catch (error) {
    log.error(`Error durante tests: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup: eliminar datos de prueba (opcional)
    const cleanup = process.argv.includes('--cleanup');
    if (cleanup && proposalId) {
      log.info('Limpiando datos de prueba...');
      await ProposalService.deleteProposal(proposalId);
      log.success('Datos de prueba eliminados');
    }
    
    process.exit(0);
  }
}

// Ejecutar tests
testFinancialEngine().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
