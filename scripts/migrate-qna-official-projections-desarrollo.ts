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
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

type SchemaState = {
  BaseDatos: string;
  QnaSnapshotDetalle: number | null;
  QnaSnapshotFuenteDetalle: number | null;
  SnapshotCalculoV2Detalle: number | null;
  Detalles: string | number;
  FuentesDetalle: string | number;
  ColumnasV5: number;
  UnicidadClaveLegacy: number;
  HashesFuenteInvalidos: string | number;
};

async function inspect(pool: any): Promise<SchemaState> {
  const result = await pool.request().query(`
    SELECT DB_NAME() AS BaseDatos,
      OBJECT_ID(N'liquidacion.QnaSnapshotDetalle', N'U') AS QnaSnapshotDetalle,
      OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle', N'U') AS QnaSnapshotFuenteDetalle,
      OBJECT_ID(N'aportaciones.SnapshotCalculoV2Detalle', N'U') AS SnapshotCalculoV2Detalle,
      (SELECT COUNT_BIG(1) FROM liquidacion.QnaSnapshotDetalle) AS Detalles,
      (SELECT COUNT_BIG(1) FROM liquidacion.QnaSnapshotFuenteDetalle) AS FuentesDetalle,
      (SELECT COUNT(1) FROM sys.columns
        WHERE object_id IN (OBJECT_ID(N'liquidacion.QnaSnapshotDetalle'),OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle'))
          AND name IN (N'SnapshotCalculoV2DetalleId',N'EmpleadoClaveHash',N'Interno',N'Nombre',N'DiasLaborados',
            N'DiasOrigen',N'SueldoMensualD6',N'BaseCotizacionSueldoD6',N'QuinqueniosMensualD6',
            N'BaseCotizacionQuinqueniosD6',N'CAIRFondoD6',N'PrestacionesD6',N'ViviendaD6',N'GuarderiasD6',
            N'TransitorioD6',N'AguinaldoD6',N'HashFila',N'EmpleadoClave',N'Rfc',N'PayloadVersion')) AS ColumnasV5,
      (SELECT COUNT(1) FROM sys.indexes
        WHERE object_id=OBJECT_ID(N'liquidacion.QnaSnapshotFuenteDetalle')
          AND name=N'UQ_QnaSnapshotFuenteDetalle_Clave' AND is_unique=1) AS UnicidadClaveLegacy,
      (SELECT COUNT_BIG(1) FROM liquidacion.QnaSnapshotFuenteDetalle
        WHERE LEN(ClaveFilaHash)<>64 OR ClaveFilaHash COLLATE Latin1_General_100_BIN2 LIKE '%[^0-9A-F]%'
          OR LEN(HashFila)<>64 OR HashFila COLLATE Latin1_General_100_BIN2 LIKE '%[^0-9A-F]%') AS HashesFuenteInvalidos;
  `);
  return result.recordset[0] as SchemaState;
}

function batches(source: string): string[] {
  return source.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean);
}

async function executeSqlFile(pool: any, file: string): Promise<any[]> {
  const source = await readFile(new URL(`../database/migrations/${file}`, import.meta.url), 'utf8');
  const recordsets: any[] = [];
  for (const batch of batches(source)) {
    const result = await pool.request().batch(batch);
    recordsets.push(...(result.recordsets ?? []));
  }
  return recordsets;
}

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();

  try {
    const before = await inspect(pool);
    if (String(before.BaseDatos) !== DEVELOPMENT.sqlDatabase) {
      throw new Error(`DESTINO_SQL_NO_PERMITIDO:${before.BaseDatos}`);
    }
    if (before.QnaSnapshotDetalle == null || before.QnaSnapshotFuenteDetalle == null
        || before.SnapshotCalculoV2Detalle == null) {
      throw new Error('TABLAS_REQUERIDAS_INEXISTENTES');
    }
    if (Number(before.HashesFuenteInvalidos) !== 0) {
      throw new Error(`HASHES_FUENTE_INVALIDOS:${before.HashesFuenteInvalidos}`);
    }

    if (!EXECUTE) {
      console.log(JSON.stringify({
        environment: 'DESARROLLO',
        sqlDatabase: DEVELOPMENT.sqlDatabase,
        firebirdDatabase: DEVELOPMENT.firebirdDatabase,
        execute: false,
        migration: '20260825_09_add_qna_official_snapshot_projections.sql',
        verification: '20260825_10_verify_qna_official_snapshot_projections.sql',
        before
      }, null, 2));
      console.log('QNA_OFFICIAL_PROJECTIONS_DESARROLLO_DRY_RUN_OK');
      return;
    }

    await executeSqlFile(pool, '20260825_09_add_qna_official_snapshot_projections.sql');
    const verification = await executeSqlFile(pool, '20260825_10_verify_qna_official_snapshot_projections.sql');
    const after = await inspect(pool);

    if (String(after.Detalles) !== String(before.Detalles)
        || String(after.FuentesDetalle) !== String(before.FuentesDetalle)) {
      throw new Error('MIGRACION_MODIFICO_FILAS_EXISTENTES');
    }
    const verified = verification.flat().some((row) =>
      row.Resultado === 'QNA_OFFICIAL_PROJECTIONS_SCHEMA_OK'
    );
    if (!verified) throw new Error('VERIFICACION_POST_MIGRACION_SIN_MARCADOR_OK');

    console.log(JSON.stringify({
      environment: 'DESARROLLO',
      sqlDatabase: DEVELOPMENT.sqlDatabase,
      firebirdDatabase: DEVELOPMENT.firebirdDatabase,
      execute: true,
      before,
      after
    }, null, 2));
    console.log('QNA_OFFICIAL_PROJECTIONS_DESARROLLO_MIGRATION_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
