const {pool} = require('../src/config/db');
async function run() {
  const c = await pool.getConnection();
  try {
    const fullText = `NUESTRO PRESUPUESTO INCLUYE:
- Gastronomía y bebida de alta calidad.
- Todo el material necesario para la presentación del servicio (mantelería, menaje, etc).
- Servicios de café en materiales 100% sostenibles y biodegradables.
- Mobiliario: Una mesa de cocktail cada 25 personas / Una mesa de banquete cada 10.
- Montaje, desmontaje y recogida el mismo día del servicio.
- Transporte dentro de la Comunidad de Madrid.
- Personal de sala, cocina y logística uniformado.
- Decoración: Detalle en veladores y estaciones con producto fresco de temporada.

PAGOS Y CONTRATACIÓN:
- Anticipo: 50% al confirmar la reserva del servicio.
- Liquidación: 50% restante antes de 7 días hábiles del evento.
- Mínimos de facturación: Coffees 1.200€, Vino Español 1.800€, Otros 2.500€ (+ IVA).

SE FACTURARÁ ADICIONALMENTE:
- Variaciones en número de comensales o cambios de horario solicitado.
- Tiempos muertos entre servicios superiores a 2 horas.
- Cambio de material de café a cristal y loza (2,50€ + IVA / pax).
- Carpa de cocina exterior si fuera necesaria (desde 750€ + IVA).
- Picnic para staff de la organización (desde 20,00€ / pax).

RETRASOS EN EL HORARIO:
- MICE Catering admite, como cortesía, retrasar la hora hasta un máximo de 15 minutos.
- Transcurrido este tiempo, se facturará 35,50€ + IVA / personal / hora.

UBICACIÓN Y ASISTENTES:
- Ubicación: Suministros (luz/agua), permisos y almacenaje son responsabilidad del cliente.
- Asistentes Adicionales: Se facturará el 100% en banquetes y el 70% en el resto sobre el número contratado.

VARIOS E INTOLERANCIAS:
- Diciembre: Las cancelaciones con menos de 45 días supondrán una penalización del 50%.
- Alergias/Intolerancias: Solo atendemos intolerancias certificadas (GLUTEN, LÁCTEOS, MARISCOS, FRUTOS SECOS). No garantizamos ausencia total de trazas.`;

    await c.query('UPDATE proposals SET general_conditions = ? WHERE general_conditions IS NULL OR general_conditions = ""', [fullText]);
    console.log('Proposals updated');
  } finally {
    c.end();
  }
}
run().then(() => process.exit()).catch(e => { console.error(e); process.exit(1); });
