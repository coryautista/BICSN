import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-development=SII-ISSSSPEA-DES');
const development = DATABASE_ENVIRONMENTS.DESARROLLO;

const ORG0 = '04';
const ORG1 = '24';
const PERIODO = '1526';
const DETALLE_ESPERADO = 167;
const FECHAMOV_LITERAL = "CAST('2026-08-15 00:00:00' AS TIMESTAMP)";
const SUMMARY_NULL_COLUMNS = ['FR_AFIL', 'PCP_N_NUEVOS', 'PCP_N_ALTAS', 'PCP_N_BAJAS', 'PCP_N_CANCELADO', 'PCP_N_DIRECTOS'];

if (execute && !confirmed) throw new Error('CONFIRMACION_REQUERIDA:--confirm-development=SII-ISSSSPEA-DES');

process.env.SQLSERVER_DB = development.sqlDatabase;
process.env.FIREBIRD_DATABASE = development.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const { executeInTransaction } = await import('../src/db/firebird.js');
await connectDatabase();

const scope = { org0: ORG0, org1: ORG1, rolContexto: 'OPERATIVO' as const };

try {
  const preflight = await executeInTransaction(async (tx: any) => {
    const detail = await tx.query(
      `SELECT COUNT(*) AS TOTAL,
         SUM(CASE WHEN STATUS='A' THEN 1 ELSE 0 END) AS APLICADOS,
         SUM(CASE WHEN STATUS='P' THEN 1 ELSE 0 END) AS PREPARADOS,
         MIN(FECHAMOV) AS MIN_F, MAX(FECHAMOV) AS MAX_F,
         COUNT(DISTINCT ORGANICA) AS D_ORG, COUNT(DISTINCT MOVIMIENTO) AS D_MOV
       FROM AP_D_ORIGEN_TODOS WHERE QNA=? AND ORG0=? AND ORG1=?`,
      [PERIODO, ORG0, ORG1]);
    const resumen = await tx.query(
      `SELECT COUNT(*) AS TOTAL FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO=? AND ORG0=? AND ORG1=? AND TIPO='AN'`,
      [PERIODO, ORG0, ORG1]);
    return { detail: detail[0], resumen: resumen[0] };
  }, scope);

  const total = Number(preflight.detail?.TOTAL ?? 0);
  const aplicados = Number(preflight.detail?.APLICADOS ?? 0);
  if (total !== DETALLE_ESPERADO) throw new Error(`SCOPE_INESPERADO:${total}`);
  if (aplicados !== 0) throw new Error('SCOPE_YA_APLICADO');
  if (Number(preflight.resumen?.TOTAL ?? 0) !== 1) throw new Error('RESUMEN_INESPERADO');

  console.log(JSON.stringify({
    check: 'CORRECT_NOMINA_LAYOUT20_1526_DESARROLLO',
    environment: 'DESARROLLO',
    sqlDatabase: development.sqlDatabase,
    firebirdDatabase: development.firebirdDatabase,
    execute,
    periodo: PERIODO,
    scope: `${ORG0}/${ORG1}`,
    preflight,
  }, null, 2));

  if (!execute) {
    console.log('CORRECT_NOMINA_LAYOUT20_1526_DESARROLLO_DRY_RUN_OK');
  } else {
    const applied = await executeInTransaction(async (tx: any) => {
      await tx.execute(
        `UPDATE AP_D_ORIGEN_TODOS SET FECHAMOV=${FECHAMOV_LITERAL}, ORGANICA=' ', MOVIMIENTO=' ' WHERE QNA=? AND ORG0=? AND ORG1=? AND STATUS='P'`,
        [PERIODO, ORG0, ORG1]);
      await tx.execute(
        `UPDATE AP_D_ORIGEN_RESUMEN SET ${SUMMARY_NULL_COLUMNS.map((column) => `${column}=NULL`).join(', ')} WHERE PERIODO=? AND ORG0=? AND ORG1=? AND TIPO='AN'`,
        [PERIODO, ORG0, ORG1]);
      const detail = await tx.query(
        `SELECT MIN(FECHAMOV) AS MIN_F, MAX(FECHAMOV) AS MAX_F, COUNT(DISTINCT ORGANICA) AS D_ORG, COUNT(DISTINCT MOVIMIENTO) AS D_MOV
         FROM AP_D_ORIGEN_TODOS WHERE QNA=? AND ORG0=? AND ORG1=?`,
        [PERIODO, ORG0, ORG1]);
      const resumen = await tx.query(
        `SELECT ${SUMMARY_NULL_COLUMNS.join(', ')} FROM AP_D_ORIGEN_RESUMEN WHERE PERIODO=? AND ORG0=? AND ORG1=? AND TIPO='AN'`,
        [PERIODO, ORG0, ORG1]);
      return { detail: detail[0], resumen: resumen[0] };
    }, scope);
    console.log(JSON.stringify({ applied }, null, 2));
    console.log('CORRECT_NOMINA_LAYOUT20_1526_DESARROLLO_OK');
  }
} finally {
  await closeDatabaseConnection();
}
