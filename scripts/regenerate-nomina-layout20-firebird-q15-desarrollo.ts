import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { parseNominaAplicacionQnalTxt } from '../src/modules/nomina/application/NominaAplicacionQnalTxtParser.js';
import { NominaLayout20FirebirdSyncService } from '../src/modules/nomina/infrastructure/firebird/NominaLayout20FirebirdSyncService.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'false';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-development=SII-ISSSSPEA-DES');
if (execute && !confirmed) throw new Error('CONFIRMACION_DESARROLLO_REQUERIDA');
const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const firebird = await import('../src/db/firebird.js');
const pool = await connectDatabase();
const scope = { organica0: '04', organica1: '24', organica2: '01', organica3: '01' };
const fechaResumen = new Date(2026, 7, 12, 12, 5, 0);

try {
  const details = await pool.request().input('CargaId',sql.BigInt,20).query(`
    SELECT c.Anio,c.Quincena,c.Organica0,c.Organica1,c.Organica2,c.Organica3,d.LineaOriginal
    FROM dbo.NominaAplicacionQnalCarga c
    INNER JOIN dbo.NominaAplicacionQnalDetalle d ON d.CargaId=c.Id
    WHERE c.Id=@CargaId ORDER BY d.LineaNumero;`);
  assert.equal(details.recordset.length, 167, 'CARGA_20_DEBE_TENER_167_DETALLES');
  const first = details.recordset[0];
  assert.deepEqual([Number(first.Anio),Number(first.Quincena),first.Organica0,first.Organica1,first.Organica2,first.Organica3], [2026,15,'04','24','01','01']);
  const parsed = parseNominaAplicacionQnalTxt(Buffer.from(details.recordset.map((row) => String(row.LineaOriginal ?? '')).join('\n'), 'latin1'));
  assert.deepEqual(parsed.errores, [], 'CARGA_20_CONTIENE_LINEAS_INVALIDAS');
  assert.equal(parsed.registros.length, 167);
  const before = await firebird.executeSafeQuery(`SELECT COUNT(*) TOTAL,
    SUM(CASE WHEN STATUS='A' THEN 1 ELSE 0 END) TOTAL_A,
    SUM(CASE WHEN STATUS='P' THEN 1 ELSE 0 END) TOTAL_P
    FROM AP_D_ORIGEN_TODOS WHERE QNA=? AND ORG0=? AND ORG1=?`, ['1526','04','24'], undefined, { org0: scope.organica0, org1: scope.organica1 });
  const preflight = { environment: 'DESARROLLO', periodo: '1526', details: Number(before[0]?.TOTAL ?? 0), applied: Number(before[0]?.TOTAL_A ?? 0), pending: Number(before[0]?.TOTAL_P ?? 0) };
  console.log(JSON.stringify(preflight));
  assert.equal(preflight.applied, 0, 'Q15_TIENE_STATUS_A_NO_SE_PUEDE_RECARGAR');
  if (!execute) {
    console.log('NOMINA_FIREBIRD_Q15_PREFLIGHT_DESARROLLO_OK');
  } else {
    const result = await new NominaLayout20FirebirdSyncService().corregirPendientesEnSitio({ scope, registros: parsed.registros, fechaResumen });
    if (result.outcome !== 'COMMIT_CONFIRMADO' || !result.value) throw result.error ?? new Error(`FIREBIRD_${result.outcome}`);
    assert.deepEqual({ details: result.value.detallesP, summaries: result.value.resumenes }, { details: 167, summaries: 1 });
    console.log(JSON.stringify({ environment: 'DESARROLLO', committed: true, periodo: result.value.periodo, details: result.value.detallesP, summaries: result.value.resumenes }));
  }
} finally {
  await Promise.all([closeDatabaseConnection(), firebird.closeFirebirdPool()]);
}
