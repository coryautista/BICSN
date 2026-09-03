import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { parseNominaAplicacionQnalTxt } from '../src/modules/nomina/application/NominaAplicacionQnalTxtParser.js';
import { NominaLayout20FirebirdSyncService } from '../src/modules/nomina/infrastructure/firebird/NominaLayout20FirebirdSyncService.js';

const development = DATABASE_ENVIRONMENTS.DESARROLLO;
const expectedHash = '847A738EE4A8F1DFA66F5BF77CEA39DBD54952A2997A910249C4E6A9746AB8E9';
const fileUrl = new URL('../../../Documentacion/1526/15%20OC%20Y%20FG%202026.txt', import.meta.url);
const periodo = '0127';
const scope = { organica0: '04', organica1: '24', organica2: '01', organica3: '01' };
const rollbackSignal = new Error('NOMINA_FIREBIRD_ROLLBACK_ONLY');

process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
process.env.FIREBIRD_READ_ONLY = 'false';
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const mssql = await import('../src/db/mssql.js');
await mssql.connectDatabase();
const firebird = await import('../src/db/firebird.js');

try {
  const content = await readFile(fileUrl);
  assert.equal(createHash('sha256').update(content).digest('hex').toUpperCase(), expectedHash, 'TXT_1526_HASH_DIFIERE');
  const parsed = parseNominaAplicacionQnalTxt(content);
  assert.deepEqual(parsed.errores, [], 'TXT_1526_INVALIDO');
  assert.equal(parsed.registros.length, 167, 'TXT_1526_REGISTROS_DIFIERE');
  const registrosRollback = parsed.registros.map((registro) => ({ ...registro, lote: '0127001' }));
  await assertEmpty(firebird);

  const rollbackRunner = async <T>(fn: (tx: any) => Promise<T>, firebirdScope: { org0: string; org1: string }) => firebird.executeInTransactionWithOutcome(async (tx) => {
    await fn(tx);
    const [mapping, summary] = await Promise.all([tx.query(`
      SELECT COUNT(*) AS TOTAL,
        SUM(CASE WHEN TRIM(D.PLAZAORIGEN) = TRIM(P.NOEMPLEADO) THEN 1 ELSE 0 END) AS PLAZA_CORRECTA,
        SUM(CASE WHEN D.STATUS = 'P' THEN 1 ELSE 0 END) AS TOTAL_P
      FROM AP_D_ORIGEN_TODOS D
      INNER JOIN PERSONAL P ON P.INTERNO = D.INTERNO
      WHERE D.QNA = ? AND D.ORG0 = ? AND D.ORG1 = ?
    `, [periodo, scope.organica0, scope.organica1]), tx.query(`
      SELECT COUNT(*) AS TOTAL,
        SUM(CASE WHEN TIPO = 'AN' AND ORG2 = ? AND ORG3 = ? THEN 1 ELSE 0 END) AS SCOPE_EXACTO
      FROM AP_D_ORIGEN_RESUMEN
      WHERE PERIODO = ? AND ORG0 = ? AND ORG1 = ?
    `, [scope.organica2, scope.organica3, periodo, scope.organica0, scope.organica1])]);
    assert.equal(Number(mapping[0]?.TOTAL ?? 0), 167, 'NOMINA_FIREBIRD_DETALLE_1526_DIFIERE');
    assert.equal(Number(mapping[0]?.PLAZA_CORRECTA ?? 0), 167, 'NOMINA_FIREBIRD_PLAZAORIGEN_DIFIERE');
    assert.equal(Number(mapping[0]?.TOTAL_P ?? 0), 167, 'NOMINA_FIREBIRD_STATUS_P_DIFIERE');
    assert.equal(Number(summary[0]?.TOTAL ?? 0), 1, 'NOMINA_FIREBIRD_RESUMEN_1526_DIFIERE');
    assert.equal(Number(summary[0]?.SCOPE_EXACTO ?? 0), 1, 'NOMINA_FIREBIRD_RESUMEN_SCOPE_DIFIERE');
    throw rollbackSignal;
  }, firebirdScope);

  const outcome = await new NominaLayout20FirebirdSyncService(rollbackRunner).sincronizar({ scope, registros: registrosRollback });
  assert.equal(outcome.outcome, 'ROLLBACK_CONFIRMADO');
  await assertEmpty(firebird);
  if (outcome.error !== rollbackSignal) throw outcome.error;
  console.log('NOMINA_FIREBIRD_SYNC_1526_INTEGRATION_ROLLBACK_DESARROLLO_OK');
} catch (error) {
  await assertEmpty(firebird);
  const message = error instanceof Error ? error.message : String(error);
  console.error(`NOMINA_FIREBIRD_SYNC_INTEGRATION_BLOCKER: ${message}`);
  process.exitCode = 1;
} finally {
  await firebird.closeFirebirdPool();
  await mssql.closeDatabaseConnection();
}

async function assertEmpty(fb: typeof import('../src/db/firebird.js')) {
  const params = [periodo, scope.organica0, scope.organica1];
  const firebirdScope = { org0: scope.organica0, org1: scope.organica1 };
  const [details, summaries] = await Promise.all([
    fb.executeSafeQuery('SELECT COUNT(*) TOTAL FROM AP_D_ORIGEN_TODOS WHERE QNA = ? AND ORG0 = ? AND ORG1 = ?', params, undefined, firebirdScope),
    fb.executeSafeQuery('SELECT COUNT(*) TOTAL FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO = ? AND ORG0 = ? AND ORG1 = ?', params, undefined, firebirdScope),
  ]);
  assert.equal(Number(details[0]?.TOTAL ?? 0), 0, 'NOMINA_FIREBIRD_ROLLBACK_DEJO_DETALLES');
  assert.equal(Number(summaries[0]?.TOTAL ?? 0), 0, 'NOMINA_FIREBIRD_ROLLBACK_DEJO_RESUMEN');
}
