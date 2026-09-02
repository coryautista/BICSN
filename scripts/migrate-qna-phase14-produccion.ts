import { readFile } from 'node:fs/promises';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const execute = process.argv.includes('--execute');
const confirmed = process.argv.includes('--confirm-production=SII-ISSSSPEA-PROD');
const backupReference = process.argv.find((argument) => argument.startsWith('--backup-reference='))?.split('=', 2)[1]?.trim();
const production = DATABASE_ENVIRONMENTS.PRODUCCION;

if (execute && !confirmed) {
  throw new Error('CONFIRMACION_REQUERIDA:--confirm-production=SII-ISSSSPEA-PROD');
}
if (execute && !backupReference) {
  throw new Error('RESPALDO_REQUERIDO:--backup-reference=<referencia-verificable>');
}

process.env.SQLSERVER_DB = production.sqlDatabase;
process.env.FIREBIRD_DATABASE = production.firebirdDatabase;
assertDatabaseEnvironment('PRODUCCION', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const migrationSteps = [
  ['20260825_09_add_qna_official_snapshot_projections.sql', '20260825_10_verify_qna_official_snapshot_projections.sql', 'QNA_OFFICIAL_PROJECTIONS_SCHEMA_OK'],
  ['20260826_11_strengthen_retenciones_v3_projection.sql', '20260826_12_verify_retenciones_v3_projection.sql', 'RETENCIONES_V3_PROJECTION_SCHEMA_OK'],
  ['20260826_13_add_qna_phase8_legacy_dual_write.sql', '20260826_14_verify_qna_phase8_legacy_dual_write.sql', 'QNA_PHASE8_LEGACY_DUAL_WRITE_SCHEMA_OK'],
  ['20260826_15_add_qna_phase9_applied_read_index.sql', '20260826_16_verify_qna_phase9_applied_read_index.sql', 'QNA_PHASE9_APPLIED_READ_INDEX_OK'],
] as const;
const ledgerMigration = '20260826_17_create_qna_phase11_attempt_ledger.sql';

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();

try {
  const actualDatabase = String((await pool.request().query('SELECT DB_NAME() AS BaseDatos')).recordset[0].BaseDatos);
  if (actualDatabase !== production.sqlDatabase) throw new Error(`DESTINO_SQL_NO_PERMITIDO:${actualDatabase}`);

  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const lock = await new sql.Request(transaction).query(`
      DECLARE @Result INT;
      EXEC @Result=sys.sp_getapplock
        @Resource=N'BICSN_QNA_PHASE14_PRODUCCION_MIGRATIONS',
        @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=0;
      SELECT @Result AS LockResult;
    `);
    if (Number(lock.recordset[0]?.LockResult) < 0) throw new Error('QNA_PHASE14_MIGRATION_LOCK_UNAVAILABLE');

    const before = await businessCounts(transaction);
    const principal = await resolveApplicationPrincipal(transaction);
    const verifications: Array<{ migration: string; marker: string }> = [];

    for (const [migration, verification, marker] of migrationSteps) {
      await runSqlFile(transaction, migration);
      const rows = await runSqlFile(transaction, verification, verification.includes('_14_') ? principal : undefined);
      if (!rows.some((row) => row.Resultado === marker)) {
        throw new Error(`${verification}:VERIFICACION_SIN_MARCADOR:${marker}`);
      }
      verifications.push({ migration, marker });
    }

    await runSqlFile(transaction, ledgerMigration);
    await verifyPhase11Ledger(transaction);
    verifications.push({ migration: ledgerMigration, marker: 'QNA_PHASE11_ATTEMPT_LEDGER_SCHEMA_OK' });

    const after = await businessCounts(transaction);
    for (const [name, count] of Object.entries(before)) {
      if (after[name] !== count) throw new Error(`MIGRACION_MODIFICO_FILAS_EXISTENTES:${name}:${count}->${after[name]}`);
    }

    const evidence = {
      environment: 'PRODUCCION',
      sqlDatabase: production.sqlDatabase,
      firebirdDatabase: production.firebirdDatabase,
      firebirdModified: false,
      execute,
      backupReference: backupReference ?? null,
      applicationPrincipal: principal,
      deploymentRisk: principal === 'dbo' ? 'DB_OWNER_EXCEPTION_SQL_ISOLATION_NOT_ENFORCEABLE' : 'NONE',
      before,
      after,
      verifications,
    };

    if (execute) {
      await transaction.commit();
      console.log(JSON.stringify(evidence, null, 2));
      console.log('QNA_PHASE14_PRODUCCION_MIGRATIONS_OK');
    } else {
      await transaction.rollback();
      console.log(JSON.stringify(evidence, null, 2));
      console.log('QNA_PHASE14_PRODUCCION_MIGRATIONS_DRY_RUN_OK');
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

async function runSqlFile(transaction: sql.Transaction, file: string, applicationPrincipal?: string): Promise<any[]> {
  const source = await readFile(new URL(`../database/migrations/${file}`, import.meta.url), 'utf8');
  const rows: any[] = [];
  const batches = source.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean);
  for (const [index, batch] of batches.entries()) {
    try {
      const request = new sql.Request(transaction);
      if (applicationPrincipal) request.input('ApplicationPrincipal', sql.NVarChar(128), applicationPrincipal);
      rows.push(...((await request.batch(batch)).recordsets ?? []).flat());
    } catch (error) {
      const detail = error as { message?: string; lineNumber?: number; procName?: string };
      throw new Error(`${file}:BATCH_${index + 1}:LINE_${detail.lineNumber ?? 'UNKNOWN'}:PROC_${detail.procName ?? 'ADHOC'}:${detail.message ?? String(error)}`);
    }
  }
  return rows;
}

async function resolveApplicationPrincipal(transaction: sql.Transaction): Promise<string> {
  const result = await new sql.Request(transaction).query(`
    DECLARE @Principal SYSNAME=USER_NAME();
    IF @Principal IS NULL OR DATABASE_PRINCIPAL_ID(@Principal) IS NULL
      THROW 51770,'QNA_APPLICATION_DATABASE_PRINCIPAL_NOT_FOUND',1;
    IF @Principal<>N'dbo' AND IS_ROLEMEMBER(N'db_owner',@Principal)<>1
      AND IS_ROLEMEMBER(N'qna_legacy_projector_executor',@Principal)<>1
    BEGIN
      DECLARE @RoleSql NVARCHAR(1000)=N'ALTER ROLE qna_legacy_projector_executor ADD MEMBER '+QUOTENAME(@Principal);
      EXEC sys.sp_executesql @RoleSql;
    END;
    SELECT IIF(@Principal=N'dbo' OR IS_ROLEMEMBER(N'db_owner',@Principal)=1,N'dbo',@Principal) AS Principal;
  `);
  return String(result.recordset[0].Principal);
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
      (SELECT COUNT_BIG(*) FROM conciliacion.RevisionAplicacionHistorico) AS LegacyRevision;
  `);
  return Object.fromEntries(Object.entries(result.recordset[0]).map(([name, value]) => [name, String(value)]));
}

async function verifyPhase11Ledger(transaction: sql.Transaction): Promise<void> {
  const result = await new sql.Request(transaction).query(`
    SELECT
      (SELECT COUNT(*) FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
        WHERE s.name=N'liquidacion' AND t.name IN(N'QnaAplicacionIntento',N'QnaAplicacionIntentoEvento',N'QnaAplicacionResolucion')) AS Tablas,
      (SELECT COUNT(*) FROM sys.foreign_keys WHERE parent_object_id IN(
        OBJECT_ID(N'liquidacion.QnaAplicacionIntento'),OBJECT_ID(N'liquidacion.QnaAplicacionIntentoEvento'),OBJECT_ID(N'liquidacion.QnaAplicacionResolucion'))
        AND is_disabled=0 AND is_not_trusted=0) AS ForeignKeys,
      (SELECT COUNT(*) FROM sys.indexes WHERE name IN(N'UX_QnaAplicacionIntento_Activo',N'UX_QnaAplicacionIntento_Claim',N'IX_QnaAplicacionIntento_ProcesoFecha',N'IX_QnaAplicacionIntentoEvento_IntentoFecha') AND is_disabled=0) AS Indices,
      (SELECT COUNT(*) FROM sys.triggers WHERE name IN(N'TR_QnaAplicacionIntentoEvento_Inmutable',N'TR_QnaAplicacionResolucion_Inmutable') AND is_disabled=0) AS Triggers,
      (SELECT COUNT_BIG(*) FROM liquidacion.QnaAplicacionIntento WHERE NOT(
        (Estado='ACTIVO' AND Fase='FIREBIRD' AND Activo=1 AND ClaimToken IS NOT NULL AND ClaimTipo='FIREBIRD' AND LeaseExpiraEn IS NOT NULL) OR
        (Estado='INCIERTO' AND Fase='FIREBIRD' AND Activo=1 AND ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL) OR
        (Estado='REVERTIDO' AND Fase='FIREBIRD' AND Activo=0 AND ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL) OR
        (Estado='CONFIRMADO' AND Fase IN('LINEA','REVISA','BITACORA') AND Activo=1 AND ((ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL) OR (ClaimToken IS NOT NULL AND ClaimTipo='RECUPERACION' AND LeaseExpiraEn IS NOT NULL))) OR
        (Estado='TERMINADO' AND Fase='TERMINADO' AND Activo=0 AND ClaimToken IS NULL AND ClaimTipo IS NULL AND LeaseExpiraEn IS NULL))) AS Inconsistentes;
  `);
  const state = result.recordset[0];
  if (Number(state.Tablas) !== 3 || Number(state.ForeignKeys) !== 5 || Number(state.Indices) !== 4
      || Number(state.Triggers) !== 2 || Number(state.Inconsistentes) !== 0) {
    throw new Error(`QNA_PHASE11_ATTEMPT_LEDGER_SCHEMA_INVALID:${JSON.stringify(state)}`);
  }
}
