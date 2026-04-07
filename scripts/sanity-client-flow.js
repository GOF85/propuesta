#!/usr/bin/env node

/**
 * Sanity check del flujo cliente:
 * - /p/:hash responde correctamente
 * - /p/:hash/json responde y mantiene coherencia de progreso
 * - Ningún servicio sin selección aparece como completado
 *
 * Uso:
 *   node scripts/sanity-client-flow.js --hash=<HASH>
 *   node scripts/sanity-client-flow.js --hash=<HASH> --base=http://localhost:3000
 *   node scripts/sanity-client-flow.js --hashes=<HASH1,HASH2,...>
 *   node scripts/sanity-client-flow.js --hash-file=./hashes.txt
 */

const DEFAULT_BASE = 'http://localhost:3000';

const fs = require('fs');

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith('--')) continue;
    const [key, value] = raw.slice(2).split('=');
    args[key] = value ?? true;
  }
  return args;
}

function isServiceCompleted(service) {
  const idx = service?.selected_option_index;
  if (idx === null || idx === undefined || idx === '') return false;

  const numericIdx = Number(idx);
  if (Number.isNaN(numericIdx) || numericIdx < 0) return false;

  return service?.is_multichoice ? numericIdx >= 0 : numericIdx === 0;
}

function parseHashList(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(/[\n,]/g)
    .map(v => v.trim())
    .filter(Boolean);
}

function collectHashes(args) {
  const hashes = [];

  if (typeof args.hash === 'string') {
    hashes.push(args.hash.trim());
  }

  if (typeof args.hashes === 'string') {
    hashes.push(...parseHashList(args.hashes));
  }

  if (typeof args['hash-file'] === 'string') {
    const filePath = args['hash-file'];
    const fileContent = fs.readFileSync(filePath, 'utf8');
    hashes.push(...parseHashList(fileContent));
  }

  return Array.from(new Set(hashes.filter(Boolean)));
}

function printErrors(prefix, errors) {
  console.error(`\n❌ ${prefix}`);
  errors.forEach((err, i) => {
    console.error(`  ${i + 1}. ${err}`);
  });
}

async function runHashCheck({ hash, base }) {
  const errors = [];

  console.log(`\n🔎 Ejecutando sanity check para hash: ${hash}`);

  const clientViewUrl = `${base}/p/${encodeURIComponent(hash)}`;
  const clientJsonUrl = `${base}/p/${encodeURIComponent(hash)}/json`;

  console.log(`   View: ${clientViewUrl}`);
  console.log(`   JSON: ${clientJsonUrl}`);

  const viewRes = await fetch(clientViewUrl, { redirect: 'manual' });
  if (viewRes.status < 200 || viewRes.status >= 400) {
    errors.push(`La vista cliente devolvió HTTP ${viewRes.status}`);
  }

  const jsonRes = await fetch(clientJsonUrl);
  if (!jsonRes.ok) {
    errors.push(`El endpoint JSON devolvió HTTP ${jsonRes.status}`);
    return { ok: false, hash, errors };
  }

  const payload = await jsonRes.json();
  if (!payload || payload.success !== true) {
    errors.push('El payload JSON no trae success=true');
  }

  const proposal = payload?.proposal || {};
  const services = Array.isArray(proposal.services) ? proposal.services : [];
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const stats = payload?.stats || {};

  const serviceChoices = new Map(
    choices
      .filter(c => typeof c?.id === 'string' && c.id.startsWith('service_'))
      .map(c => [c.id, Boolean(c.is_completed)])
  );

  let expectedCompletedServiceChoices = 0;

  services
    .filter(s => Array.isArray(s.options) && s.options.length > 0)
    .forEach(service => {
      const expectedCompleted = isServiceCompleted(service);
      if (expectedCompleted) expectedCompletedServiceChoices += 1;

      const choiceId = `service_${service.id}`;
      const reportedCompleted = serviceChoices.get(choiceId);

      if (reportedCompleted === undefined) {
        errors.push(`No existe choice para ${choiceId}`);
        return;
      }

      if (reportedCompleted !== expectedCompleted) {
        errors.push(
          `Inconsistencia en ${choiceId}: expected=${expectedCompleted}, reported=${reportedCompleted}, selected_option_index=${String(service.selected_option_index)}, is_multichoice=${String(service.is_multichoice)}`
        );
      }

      if (
        (service.selected_option_index === null || service.selected_option_index === undefined || service.selected_option_index === '') &&
        reportedCompleted
      ) {
        errors.push(
          `Servicio ${service.id} aparece completado con selected_option_index vacío`
        );
      }
    });

  const reportedCompletedCount = Number(stats.completed_choices ?? NaN);
  const recalculatedCompletedCount = choices.filter(c => c.is_completed).length;

  if (!Number.isFinite(reportedCompletedCount)) {
    errors.push('stats.completed_choices no es numérico');
  } else if (reportedCompletedCount !== recalculatedCompletedCount) {
    errors.push(
      `stats.completed_choices=${reportedCompletedCount} no coincide con choices completadas=${recalculatedCompletedCount}`
    );
  }

  const reportedTotalChoices = Number(stats.total_choices ?? NaN);
  if (!Number.isFinite(reportedTotalChoices)) {
    errors.push('stats.total_choices no es numérico');
  } else if (reportedTotalChoices !== choices.length) {
    errors.push(
      `stats.total_choices=${reportedTotalChoices} no coincide con choices.length=${choices.length}`
    );
  }

  if (errors.length > 0) {
    return { ok: false, hash, errors };
  }

  console.log('✅ SANITY CHECK OK');
  console.log(`   Proposal ID: ${proposal.id}`);
  console.log(`   Services with options: ${services.filter(s => Array.isArray(s.options) && s.options.length > 0).length}`);
  console.log(`   Completed choices: ${recalculatedCompletedCount}/${choices.length}`);
  console.log(`   Completed services (expected): ${expectedCompletedServiceChoices}`);

  return { ok: true, hash, errors: [] };
}

async function run() {
  const args = parseArgs(process.argv);
  const base = args.base || DEFAULT_BASE;

  const hashes = collectHashes(args);

  if (hashes.length === 0) {
    console.error('Uso: node scripts/sanity-client-flow.js --hash=<HASH> [--base=http://localhost:3000]');
    console.error('     node scripts/sanity-client-flow.js --hashes=<HASH1,HASH2,...> [--base=http://localhost:3000]');
    console.error('     node scripts/sanity-client-flow.js --hash-file=./hashes.txt [--base=http://localhost:3000]');
    process.exit(1);
  }

  const results = [];
  for (const hash of hashes) {
    const result = await runHashCheck({ hash, base });
    results.push(result);
  }

  const failed = results.filter(r => !r.ok);
  const passed = results.filter(r => r.ok);

  if (results.length > 1) {
    console.log('\n📊 RESUMEN BATCH');
    console.log(`   Total: ${results.length}`);
    console.log(`   OK: ${passed.length}`);
    console.log(`   FAIL: ${failed.length}`);
  }

  if (failed.length > 0) {
    for (const result of failed) {
      printErrors(`SANITY CHECK FALLÓ (${result.hash})`, result.errors);
    }
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('\n❌ Error ejecutando sanity check:', err.message);
  process.exit(1);
});
