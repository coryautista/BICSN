import { readFile } from 'node:fs/promises';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-quality=SII-ISSSSPEA');
const backupReference = process.argv.find((argument) => argument.startsWith('--backup-reference='))?.split('=', 2)[1]?.trim();
const quality = DATABASE_ENVIRONMENTS.CALIDAD;

if (execute && !confirmed) {
  throw new Error('CONFIRMACION_REQUERIDA:--confirm-quality=SII-ISSSSPEA');
}
if (execute && !backupReference) {
  throw new Error('RESPALDO_REQUERIDO:--backup-reference=<referencia-verificable>');
}

process.env.SQLSERVER_DB = quality.sqlDatabase;
process.env.FIREBIRD_DATABASE = quality.firebirdDatabase;
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const migrationSteps = [
  ['20260827_18_consolidate_revision_retention_release.sql', '20260827_19_verify_revision_retention_release.sql', 'REVISION'],
  ['20260827_20_create_nomina_txt_sync_ledger_staging.sql', '20260827_21_verify_nomina_txt_sync_ledger_staging.sql', 'NOMINA_TXT'],
  ['20260901_22_add_nomina_staging_layout20_semantics.sql', '20260901_23_verify_nomina_staging_layout20_semantics.sql', 'NOMINA_LAYOUT20'],
] as const;

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const actualDatabase = String((await pool.request().query('SELECT DB_NAME() AS BaseDatos')).recordset[0].BaseDatos);
  if (actualDatabase !== quality.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${actualDatabase}`);

  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const lock = await new sql.Request(transaction).query(`
      DECLARE @Result INT;
      EXEC @Result=sys.sp_getapplock
        @Resource=N'BICSN_CALIDAD_18_23_MIGRATIONS',
        @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=0;
      SELECT @Result AS LockResult;
    `);
    if (Number(lock.recordset[0]?.LockResult) < 0) throw new Error('CALIDAD_18_23_MIGRATION_LOCK_UNAVAILABLE');

    const before = await businessCounts(transaction);
    const verifications: Array<{ migration: string; verify: string; group: string }> = [];

    for (const [migration, verification, group] of migrationSteps) {
      await runSqlFile(transaction, migration);
      await runSqlFile(transaction, verification);
      await assertGroupObjects(transaction, group);
      verifications.push({ migration, verify: verification, group });
    }

    const after = await businessCounts(transaction);
    for (const [name, count] of Object.entries(before)) {
      if (after[name] !== count) throw new Error(`MIGRACION_MODIFICO_FILAS_EXISTENTES:${name}:${count}->${after[name]}`);
    }

    const evidence = {
      environment: 'CALIDAD',
      sqlDatabase: quality.sqlDatabase,
      firebirdDatabase: quality.firebirdDatabase,
      firebirdModified: false,
      execute,
      backupReference: backupReference ?? null,
      before,
      after,
      verifications,
    };

    if (execute) {
      await transaction.commit();
      console.log(JSON.stringify(evidence, null, 2));
      console.log('CALIDAD_18_23_MIGRATIONS_OK');
    } else {
      await transaction.rollback();
      console.log(JSON.stringify(evidence, null, 2));
      console.log('CALIDAD_18_23_MIGRATIONS_DRY_RUN_OK');
    }
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closeDatabaseConnection();
}

async function runSqlFile(transaction: sql.Transaction, file: string): Promise<void> {
  const source = await readFile(new URL(`../database/migrations/${file}`, import.meta.url), 'utf8');
  const batches = source.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean);
  for (const [index, batch] of batches.entries()) {
    try {
      await new sql.Request(transaction).batch(batch);
    } catch (error) {
      const detail = error as { message?: string; lineNumber?: number };
      throw new Error(`${file}:BATCH_${index + 1}:LINE_${detail.lineNumber ?? 'UNKNOWN'}:${detail.message ?? String(error)}`);
    }
  }
}

async function assertGroupObjects(transaction: sql.Transaction, group: string): Promise<void> {
  const checks: Record<string, Array<[string, string]>> = {
    REVISION: [],
    NOMINA_TXT: [
      ['dbo.NominaAplicacionQnalSincronizacion', 'U'],
      ['dbo.NominaAplicacionQnalStagingCarga', 'U'],
      ['dbo.NominaAplicacionQnalStagingDetalle', 'U'],
    ],
    NOMINA_LAYOUT20: [],
  };
  for (const [object, type] of checks[group] ?? []) {
    const result = await new sql.Request(transaction).input('Objeto', sql.NVarChar(200), object)
      .input('Tipo', sql.Char(2), type)
      .query('SELECT CASE WHEN OBJECT_ID(@Objeto,@Tipo) IS NULL THEN 0 ELSE 1 END AS Existe');
    if (Number(result.recordset[0].Existe) !== 1) throw new Error(`OBJETO_FALTANTE:${group}:${object}`);
  }
  if (group === 'NOMINA_LAYOUT20') {
    const result = await new sql.Request(transaction).query(`
      SELECT CASE WHEN COL_LENGTH(N'dbo.NominaAplicacionQnalStagingDetalle',N'AyudasMensuales') IS NULL THEN 0 ELSE 1 END AS Ayudas,
        CASE WHEN COL_LENGTH(N'dbo.NominaAplicacionQnalStagingDetalle',N'QuinqueniosMensual') IS NULL THEN 0 ELSE 1 END AS Quinquenios;
    `);
    if (Number(result.recordset[0].Ayudas) !== 1 || Number(result.recordset[0].Quinquenios) !== 1) {
      throw new Error('COLUMNAS_STAGING_LAYOUT20_FALTANTES');
    }
  }
  if (group === 'REVISION') {
    const result = await new sql.Request(transaction).query(`
      SELECT SUM(CASE WHEN numeroConcepto=13 AND concepto=N'Liberación de retenciones con fondo de Ahorro' AND activo=1 THEN 1 ELSE 0 END) AS C13,
        SUM(CASE WHEN numeroConcepto IN (15,16) AND activo=1 THEN 1 ELSE 0 END) AS C1516
      FROM reportes.catalogoRevision;
    `);
    if (Number(result.recordset[0].C13) !== 1 || Number(result.recordset[0].C1516) !== 0) {
      throw new Error('CATALOGO_REVISION_INCONSISTENTE');
    }
  }
}

async function businessCounts(transaction: sql.Transaction): Promise<Record<string, string>> {
  const result = await new sql.Request(transaction).query(`
    SELECT
      (SELECT COUNT_BIG(*) FROM liquidacion.QnaSnapshot) AS QnaSnapshot,
      (SELECT COUNT_BIG(*) FROM liquidacion.QnaSnapshotDetalle) AS QnaSnapshotDetalle,
      (SELECT COUNT_BIG(*) FROM liquidacion.QnaSnapshotFuenteDetalle) AS QnaSnapshotFuenteDetalle,
      (SELECT COUNT_BIG(*) FROM liquidacion.QnaSnapshotTotal) AS QnaSnapshotTotal,
      (SELECT COUNT_BIG(*) FROM retenciones.RetencionPCPHistoricoV3) AS RetencionPCPV3,
      (SELECT COUNT_BIG(*) FROM retenciones.RetencionPMPHistoricoV3) AS RetencionPMPV3,
      (SELECT COUNT_BIG(*) FROM retenciones.RetencionHIPHistoricoV3) AS RetencionHIPV3,
      (SELECT COUNT_BIG(*) FROM aportaciones.IndividualesAhorroHistorico) AS LegacyAhorro,
      (SELECT COUNT_BIG(*) FROM aportaciones.IndividualesViviendaHistorico) AS LegacyVivienda,
      (SELECT COUNT_BIG(*) FROM aportaciones.IndividualesPrestacionesHistorico) AS LegacyPrestaciones,
      (SELECT COUNT_BIG(*) FROM aportaciones.IndividualesCairHistorico) AS LegacyCair,
      (SELECT COUNT_BIG(*) FROM aportaciones.PensionNominaTransitorioHistorico) AS LegacyTransitorio,
      (SELECT COUNT_BIG(*) FROM aportaciones.GuarderiasHistorico) AS LegacyGuarderias,
      (SELECT COUNT_BIG(*) FROM aportaciones.AguinaldoHistorico) AS LegacyAguinaldo,
      (SELECT COUNT_BIG(*) FROM retenciones.PrestamosCortoPlazoHistorico) AS LegacyPCP,
      (SELECT COUNT_BIG(*) FROM retenciones.PrestamosMedianoPlazoHistorico) AS LegacyPMP,
      (SELECT COUNT_BIG(*) FROM retenciones.PrestamosHipotecariosHistorico) AS LegacyHIP,
      (SELECT COUNT_BIG(*) FROM aportaciones.ResumenHistorico) AS LegacyResumen,
      (SELECT COUNT_BIG(*) FROM conciliacion.RevisionAplicacionHistorico) AS LegacyRevision,
      (SELECT COUNT_BIG(*) FROM reportes.catalogoRevision) AS CatalogoRevision;
  `);
  return Object.fromEntries(Object.entries(result.recordset[0]).map(([name, value]) => [name, String(value)]));
}
