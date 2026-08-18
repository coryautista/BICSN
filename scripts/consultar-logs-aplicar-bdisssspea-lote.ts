/**
 * Script para consultar los últimos logs del movimiento "aplicar-bdisssspea-lote"
 * 
 * Uso:
 *   npx tsx scripts/consultar-logs-aplicar-bdisssspea-lote.ts [org0] [org1]
 * 
 * Ejemplos:
 *   npx tsx scripts/consultar-logs-aplicar-bdisssspea-lote.ts
 *   npx tsx scripts/consultar-logs-aplicar-bdisssspea-lote.ts 04 24
 */

import { connectDatabase, closeDatabaseConnection } from '../src/db/mssql.js';
import { getBitacoraAfectacion } from '../src/modules/afectacionOrg/afectacionOrg.repo.js';

async function consultarLogsAplicarBDIssspeaLote(org0?: string, org1?: string) {
  // Inicializar conexión a la base de datos
  try {
    console.log('⏳ Inicializando conexión a la base de datos...');
    await connectDatabase();
    console.log('✅ Conexión establecida\n');
  } catch (error: any) {
    console.error('❌ Error al conectar a la base de datos:');
    console.error(`   Mensaje: ${error.message}`);
    process.exit(1);
  }
  console.log('\n' + '='.repeat(80));
  console.log('📋 CONSULTANDO LOGS DE APLICAR-BDISSSPEA-LOTE');
  console.log('='.repeat(80));
  
  if (org0 && org1) {
    console.log(`   Orgánica: ${org0}/${org1}`);
  } else {
    console.log('   Consultando todas las orgánicas');
  }
  console.log(`   Timestamp: ${new Date().toISOString()}\n`);

  try {
    const filters: any = {
      entidad: 'AFILIADOS',
      accion: 'APLICAR',
      limit: 10,
      offset: 0
    };

    if (org0) filters.org0 = org0;
    if (org1) filters.org1 = org1;

    console.log('⏳ Consultando BitacoraAfectacionOrg...\n');
    const logs = await getBitacoraAfectacion(filters);

    if (logs.length === 0) {
      console.log('⚠️  No se encontraron registros de aplicar-bdisssspea-lote');
      if (org0 && org1) {
        console.log(`   Para la orgánica: ${org0}/${org1}`);
      }
      console.log('\n');
      return;
    }

    console.log(`✅ Se encontraron ${logs.length} registro(s)\n`);
    console.log('-'.repeat(80));

    logs.forEach((log, index) => {
      console.log(`\n📝 Registro ${index + 1}:`);
      console.log(`   ID: ${log.afectacionId}`);
      console.log(`   Orgánica: ${log.org0}/${log.org1}${log.org2 ? `/${log.org2}` : ''}${log.org3 ? `/${log.org3}` : ''}`);
      console.log(`   Año: ${log.anio}`);
      console.log(`   Quincena: ${log.quincena}`);
      console.log(`   Acción: ${log.accion}`);
      console.log(`   Resultado: ${log.resultado || 'N/A'}`);
      console.log(`   Mensaje: ${log.mensaje || 'N/A'}`);
      console.log(`   Usuario: ${log.usuario || 'N/A'}`);
      console.log(`   UserId: ${log.userId || 'N/A'}`);
      console.log(`   App: ${log.appName || 'N/A'}`);
      console.log(`   IP: ${log.ip || 'N/A'}`);
      console.log(`   User Agent: ${log.userAgent || 'N/A'}`);
      console.log(`   Request ID: ${log.requestId || 'N/A'}`);
      console.log(`   Creado: ${log.createdAt ? new Date(log.createdAt).toLocaleString('es-MX') : 'N/A'}`);
      console.log('-'.repeat(80));
    });

    // Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`   Total de registros: ${logs.length}`);
    
    const porOrganica = logs.reduce((acc: any, log) => {
      const key = `${log.org0}/${log.org1}`;
      if (!acc[key]) {
        acc[key] = { count: 0, ultimo: null };
      }
      acc[key].count++;
      if (!acc[key].ultimo || new Date(log.createdAt) > new Date(acc[key].ultimo.createdAt)) {
        acc[key].ultimo = log;
      }
      return acc;
    }, {});

    console.log(`   Por orgánica:`);
    Object.entries(porOrganica).forEach(([organica, data]: [string, any]) => {
      console.log(`      ${organica}: ${data.count} ejecución(es)`);
      if (data.ultimo) {
        console.log(`         Última: ${new Date(data.ultimo.createdAt).toLocaleString('es-MX')}`);
      }
    });

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error: any) {
    console.error('\n❌ Error al consultar logs:');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.log('\n');
    process.exit(1);
  } finally {
    // Cerrar conexión a la base de datos
    try {
      await closeDatabaseConnection();
      console.log('✅ Conexión cerrada');
    } catch (error: any) {
      console.error('⚠️  Error al cerrar conexión:', error.message);
    }
  }
}

// Ejecutar script
const org0 = process.argv[2];
const org1 = process.argv[3];

consultarLogsAplicarBDIssspeaLote(org0, org1)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });

