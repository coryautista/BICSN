import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const EXECUTE = process.argv.includes('--execute');
const CONFIRMED = process.argv.includes('--confirm-development=SII-ISSSSPEA-DES');
const DEVELOPMENT = DATABASE_ENVIRONMENTS.DESARROLLO;

if (EXECUTE && !CONFIRMED) {
  throw new Error('CONFIRMACION_REQUERIDA:--confirm-development=SII-ISSSSPEA-DES');
}

process.env.SQLSERVER_DB = DEVELOPMENT.sqlDatabase;
process.env.FIREBIRD_DATABASE = DEVELOPMENT.firebirdDatabase;
assertDatabaseEnvironment(
  'DESARROLLO',
  process.env.SQLSERVER_DB,
  process.env.FIREBIRD_DATABASE
);

const migrationFiles = [
  '20260815_create_formula_calculo_version.sql',
  '20260815_verify_formula_calculo_version.sql',
  '20260816_add_nomina_carga_tipo_vigente.sql',
  '20260816_verify_nomina_carga_tipo_vigente.sql',
  '20260816_create_aportaciones_snapshot_v2.sql',
  '20260816_verify_aportaciones_snapshot_v2.sql',
  '20260817_create_snapshot_v2_decision.sql',
  '20260817_verify_snapshot_v2_decision.sql',
  '20260818_01_create_liquidacion_qna_snapshot.sql',
  '20260818_02_create_liquidacion_qna_workflow.sql',
  '20260818_03_create_retenciones_v3.sql',
  '20260818_04_add_liquidacion_snapshot_links.sql',
  '20260818_05_verify_liquidacion_v3.sql',
  '20260818_06_add_official_fund_totals.sql',
  '20260818_07_allow_qna_v3_decision_policy.sql',
  '20260819_08_add_snapshot_base_cotizacion_sueldo.sql'
] as const;

async function getSchemaState(pool: any): Promise<Record<string, unknown>> {
  const result = await pool.request().query(`
    SELECT
      DB_NAME() AS BaseDatos,
      (SELECT COUNT_BIG(1) FROM sys.tables) AS Tablas,
      OBJECT_ID(N'aportaciones.SnapshotCalculoV2', N'U') AS SnapshotCalculoV2,
      OBJECT_ID(N'liquidacion.QnaSnapshot', N'U') AS QnaSnapshot,
      OBJECT_ID(N'retenciones.RetencionPCPHistoricoV3', N'U') AS RetencionPCPV3,
      COL_LENGTH(N'aportaciones.SnapshotCalculoV2Detalle', N'BaseCotizacionSueldoD6') AS BaseCotizacionSueldoD6,
      COL_LENGTH(N'conciliacion.Revision', N'LiquidacionSnapshotId') AS RevisionLiquidacionSnapshotId,
      (
        SELECT COUNT_BIG(1)
        FROM aportaciones.FormulaCalculoVersion
        WHERE AnioVigencia = 2026
          AND PrecisionPolicy = 'MXN-BASE2-LEAF2-FUND2-APSFONDOS-v3'
          AND Estado = 'ACTIVA'
      ) AS FormulaV3Activa;
  `);
  return result.recordset[0];
}

async function isNominaCargaMigrationApplied(pool: any): Promise<boolean> {
  const result = await pool.request().query(`
    SELECT CASE WHEN
      COL_LENGTH(N'dbo.NominaAplicacionQnalCarga', N'TipoCarga') IS NOT NULL
      AND COL_LENGTH(N'dbo.NominaAplicacionQnalCarga', N'EsVigente') IS NOT NULL
      AND COL_LENGTH(N'dbo.NominaAplicacionQnalDetalle', N'RfcNormalizado') IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.NominaAplicacionQnalCarga')
          AND name = N'TipoCarga' AND is_nullable = 0
      )
      AND EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.NominaAplicacionQnalCarga')
          AND name = N'EsVigente' AND is_nullable = 0
      )
      AND OBJECT_ID(N'dbo.CK_NominaAplicacionQnalCarga_TipoCarga', N'C') IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.NominaAplicacionQnalCarga')
          AND name = N'UX_NominaAplicacionQnalCarga_TxtVigente'
      )
      AND EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.NominaAplicacionQnalCarga')
          AND name = N'IX_NominaAplicacionQnalCarga_Seleccion'
      )
      AND EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.NominaAplicacionQnalDetalle')
          AND name = N'UX_NominaAplicacionQnalDetalle_AmbitoRfc'
      )
    THEN 1 ELSE 0 END AS Aplicada;
  `);
  return Number(result.recordset[0]?.Aplicada ?? 0) === 1;
}

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();

  try {
    const databaseResult = await pool.request().query('SELECT DB_NAME() AS BaseDatos;');
    const databaseName = String(databaseResult.recordset[0]?.BaseDatos ?? '');
    if (databaseName !== DEVELOPMENT.sqlDatabase) {
      throw new Error(`DESTINO_SQL_NO_PERMITIDO:${databaseName}`);
    }

    const before = await getSchemaState(pool);
    if (!EXECUTE) {
      console.log(JSON.stringify({
        environment: 'DESARROLLO',
        sqlDatabase: DEVELOPMENT.sqlDatabase,
        firebirdDatabase: DEVELOPMENT.firebirdDatabase,
        execute: false,
        migrations: migrationFiles,
        before
      }, null, 2));
      console.log('QNA_V3_DESARROLLO_DRY_RUN_OK');
      return;
    }

    const nominaCargaMigrationApplied = await isNominaCargaMigrationApplied(pool);
    for (const file of migrationFiles) {
      if (file === '20260816_add_nomina_carga_tipo_vigente.sql' && nominaCargaMigrationApplied) {
        console.log(`MIGRATION_SKIPPED_ALREADY_APPLIED:${file}`);
        continue;
      }
      const source = await readFile(
        new URL(`../database/migrations/${file}`, import.meta.url),
        'utf8'
      );
      const batches = source
        .split(/^\s*GO\s*$/gim)
        .map((batch) => batch.trim())
        .filter(Boolean);

      for (const batch of batches) {
        await pool.request().batch(batch);
      }
      console.log(`MIGRATION_OK:${file}`);
    }

    const after = await getSchemaState(pool);
    if (Number(after.Tablas) !== 91) throw new Error(`CONTEO_TABLAS_INESPERADO:${after.Tablas}`);
    if (after.SnapshotCalculoV2 == null) throw new Error('SNAPSHOT_CALCULO_V2_NO_CREADO');
    if (after.QnaSnapshot == null) throw new Error('QNA_SNAPSHOT_NO_CREADO');
    if (after.RetencionPCPV3 == null) throw new Error('RETENCION_PCP_V3_NO_CREADA');
    if (after.BaseCotizacionSueldoD6 == null) throw new Error('BASE_COTIZACION_SUELDO_D6_NO_CREADA');
    if (after.RevisionLiquidacionSnapshotId == null) throw new Error('REVISION_SIN_LIQUIDACION_SNAPSHOT_ID');
    if (Number(after.FormulaV3Activa) !== 1) throw new Error(`FORMULA_V3_ACTIVA_INVALIDA:${after.FormulaV3Activa}`);

    console.log(JSON.stringify({
      environment: 'DESARROLLO',
      sqlDatabase: DEVELOPMENT.sqlDatabase,
      firebirdDatabase: DEVELOPMENT.firebirdDatabase,
      execute: true,
      before,
      after
    }, null, 2));
    console.log('QNA_V3_DESARROLLO_MIGRATION_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
