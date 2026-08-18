import { readFile } from 'node:fs/promises';
import { assertDatabaseEnvironment, DATABASE_ENVIRONMENTS } from '../src/config/databaseEnvironments.js';

const EXECUTE = process.argv.includes('--execute');
const QUALITY_SQL_DATABASE = DATABASE_ENVIRONMENTS.CALIDAD.sqlDatabase;
const QUALITY_FIREBIRD_DATABASE = DATABASE_ENVIRONMENTS.CALIDAD.firebirdDatabase;
const ORG0 = '04';
const ORG1 = '24';
const PERIODO = '1426';
const EXPECTED = {
  registros: 169,
  CAIR: 27536.45,
  FRA: 61956.55,
  FRE: 318153.05,
  FH: 4818.87,
  FV: 19275.28,
  FAA: 68840.85,
  FAE: 34420.17,
  FAT: 103261.02,
  FAI: 16930.00
};

process.env.SQLSERVER_DB = QUALITY_SQL_DATABASE;
process.env.FIREBIRD_DATABASE = QUALITY_FIREBIRD_DATABASE;
process.env.FIREBIRD_READ_ONLY = 'true';
assertDatabaseEnvironment('CALIDAD', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main() {
  const [{ connectDatabase, closeDatabaseConnection, sql }, { executeSafeQuery, closeFirebirdPool, FIREBIRD_TIMEOUTS }] = await Promise.all([
    import('../src/db/mssql.js'),
    import('../src/db/firebird.js')
  ]);
  const pool = await connectDatabase();

  try {
    const databaseResult = await pool.request().query('SELECT DB_NAME() AS databaseName;');
    const databaseName = String(databaseResult.recordset[0]?.databaseName || '');
    if (databaseName !== QUALITY_SQL_DATABASE) {
      throw new Error(`DESTINO_SQL_NO_PERMITIDO: ${databaseName}`);
    }

    const rows = await executeSafeQuery(`
      SELECT COUNT(*) AS REGISTROS,
        COALESCE(SUM(SARE), 0) AS CAIR,
        COALESCE(SUM(FRA), 0) AS FRA,
        COALESCE(SUM(FRE), 0) AS FRE,
        COALESCE(SUM(FHE), 0) AS FH,
        COALESCE(SUM(FVE), 0) AS FV,
        COALESCE(SUM(FAA), 0) AS FAA,
        COALESCE(SUM(FAE), 0) AS FAE,
        COALESCE(SUM(FAT), 0) AS FAT,
        COALESCE(SUM(FAI), 0) AS FAI
      FROM AP_S_FONDOS(?, ?, ?)
    `, [ORG0, ORG1, PERIODO], FIREBIRD_TIMEOUTS.BATCH_OPERATION);
    const row = rows[0] || {};
    const snapshot = {
      registros: Number(row.REGISTROS || 0),
      CAIR: round(row.CAIR),
      FRA: round(row.FRA),
      FRE: round(row.FRE),
      FH: round(row.FH),
      FV: round(row.FV),
      FAA: round(row.FAA),
      FAE: round(row.FAE),
      FAT: round(row.FAT),
      FAI: round(row.FAI)
    };
    assertExpected(snapshot);

    const lineaResult = await pool.request()
      .input('org0', sql.Char(2), ORG0)
      .input('org1', sql.Char(2), ORG1)
      .input('periodo', sql.Char(4), PERIODO)
      .query(`
        SELECT TOP (1) LineaCapturaPeriodoId, UsuarioId, Estatus, Importe
        FROM pagos.LineaCapturaPeriodo
        WHERE Org0 = @org0 AND Org1 = @org1 AND Periodo = @periodo
        ORDER BY CreatedAt DESC, LineaCapturaPeriodoId DESC;
      `);
    const linea = lineaResult.recordset[0];
    if (!linea) throw new Error('LINEA_CAPTURA_1426_NO_ENCONTRADA');
    if (!linea.UsuarioId) throw new Error('LINEA_CAPTURA_1426_SIN_USUARIO');

    const usuarioResult = await pool.request()
      .input('lineaUsuarioId', sql.UniqueIdentifier, linea.UsuarioId)
      .input('org0', sql.NVarChar(2), ORG0)
      .input('org1', sql.NVarChar(2), ORG1)
      .query(`
        SELECT TOP (1) CONVERT(NVARCHAR(36), id) AS UsuarioId
        FROM (
          SELECT id, 0 AS prioridad FROM auth.[user] WHERE id = @lineaUsuarioId
          UNION ALL
          SELECT id, 1 AS prioridad FROM auth.[user]
          WHERE idOrganica0 = @org0 AND idOrganica1 = @org1
        ) usuarios
        ORDER BY prioridad, id;
      `);
    const usuarioId = String(usuarioResult.recordset[0]?.UsuarioId || '');
    if (!usuarioId) throw new Error('USUARIO_CALIDAD_04_24_NO_ENCONTRADO');

    const estadoResult = await pool.request()
      .input('org0', sql.Char(2), ORG0)
      .input('org1', sql.Char(2), ORG1)
      .input('periodo', sql.Char(4), PERIODO)
      .query(`
        SELECT
          OBJECT_ID('conciliacion.RevisionAplicacionHistorico', 'U') AS snapshotTableId,
          (SELECT COUNT(*) FROM conciliacion.RevisionTarea
            WHERE Organica0 = @org0 AND Organica1 = @org1
              AND Organica2 = '01' AND Organica3 = '01' AND Periodo = @periodo) AS tareas;
      `);

    console.log(JSON.stringify({
      mode: EXECUTE ? 'execute' : 'dry-run',
      target: {
        sqlDatabase: databaseName,
        firebirdDatabase: QUALITY_FIREBIRD_DATABASE,
        organica: `${ORG0}-${ORG1}-01-01`,
        periodo: PERIODO
      },
      snapshot,
      lineaCaptura: {
        id: Number(linea.LineaCapturaPeriodoId),
        estatus: String(linea.Estatus),
        importe: Number(linea.Importe),
        usuarioRecuperacion: usuarioId
      },
      current: estadoResult.recordset[0]
    }, null, 2));

    if (!EXECUTE) {
      console.log('DRY_RUN_OK: use --execute únicamente después de publicar el backend actualizado en Calidad.');
      return;
    }

    const migration = await readFile(
      new URL('../database/migrations/create_revision_aplicacion_historico.sql', import.meta.url),
      'utf8'
    );
    await pool.request().batch(migration);

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const request = new sql.Request(transaction)
        .input('org0', sql.Char(2), ORG0)
        .input('org1', sql.Char(2), ORG1)
        .input('periodo', sql.Char(4), PERIODO)
        .input('usuarioId', sql.UniqueIdentifier, usuarioId)
        .input('registros', sql.Int, snapshot.registros);
      for (const fondo of ['CAIR', 'FRA', 'FRE', 'FH', 'FV', 'FAA', 'FAE', 'FAT', 'FAI'] as const) {
        request.input(fondo, sql.Decimal(19, 2), snapshot[fondo]);
      }
      const result = await request.query(`
        UPDATE reportes.catalogoRevision
        SET activo = CASE WHEN numeroConcepto IN (7, 10) THEN 1 ELSE 0 END
        WHERE numeroConcepto IN (7, 10, 14);

        DECLARE @snapshotId BIGINT;
        SELECT @snapshotId = IdRevisionAplicacionHistorico
        FROM conciliacion.RevisionAplicacionHistorico WITH (UPDLOCK, HOLDLOCK)
        WHERE Organica0 = @org0 AND Organica1 = @org1
          AND Organica2 = '01' AND Organica3 = '01' AND Periodo = @periodo;

        IF @snapshotId IS NULL
        BEGIN
          INSERT INTO conciliacion.RevisionAplicacionHistorico (
            Organica0, Organica1, Organica2, Organica3, Periodo,
            CAIR, FRA, FRE, FH, FV, FAA, FAE, FAT, FAI,
            RegistrosOrigen, UsuarioId
          ) VALUES (
            @org0, @org1, '01', '01', @periodo,
            @CAIR, @FRA, @FRE, @FH, @FV, @FAA, @FAE, @FAT, @FAI,
            @registros, @usuarioId
          );
          SET @snapshotId = SCOPE_IDENTITY();
        END
        ELSE IF EXISTS (
          SELECT 1 FROM conciliacion.RevisionAplicacionHistorico
          WHERE IdRevisionAplicacionHistorico = @snapshotId
            AND (CAIR <> @CAIR OR FRA <> @FRA OR FRE <> @FRE OR FH <> @FH OR FV <> @FV
              OR FAA <> @FAA OR FAE <> @FAE OR FAT <> @FAT OR FAI <> @FAI
              OR RegistrosOrigen <> @registros)
        )
          THROW 50032, 'SNAPSHOT_1426_EXISTENTE_NO_COINCIDE', 1;

        DECLARE @tareaId BIGINT;
        SELECT @tareaId = IdRevisionTarea
        FROM conciliacion.RevisionTarea WITH (UPDLOCK, HOLDLOCK)
        WHERE Organica0 = @org0 AND Organica1 = @org1
          AND Organica2 = '01' AND Organica3 = '01' AND Periodo = @periodo;

        IF @tareaId IS NULL
        BEGIN
          INSERT INTO conciliacion.RevisionTarea (
            Organica0, Organica1, Organica2, Organica3, Periodo, UsuarioId
          ) VALUES (@org0, @org1, '01', '01', @periodo, @usuarioId);
          SET @tareaId = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
          UPDATE conciliacion.RevisionTarea
          SET Estatus = CASE WHEN Estatus IN ('ERROR', 'COMPLETADA') THEN 'PENDIENTE' ELSE Estatus END,
            Intentos = CASE WHEN Estatus IN ('ERROR', 'COMPLETADA') THEN 0 ELSE Intentos END,
            ProximoIntento = NULL, Error = NULL, UsuarioId = @usuarioId
          WHERE IdRevisionTarea = @tareaId;
        END;

        SELECT @snapshotId AS snapshotId, @tareaId AS tareaId;
      `);
      await transaction.commit();
      console.log(JSON.stringify({ recovery: result.recordset[0] }, null, 2));
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } finally {
    await closeFirebirdPool();
    await closeDatabaseConnection();
  }
}

function round(value: unknown): number {
  return Math.round(Number(value || 0) * 100) / 100;
}

function assertExpected(snapshot: typeof EXPECTED): void {
  for (const [key, expected] of Object.entries(EXPECTED)) {
    const actual = snapshot[key as keyof typeof snapshot];
    if (actual !== expected) {
      throw new Error(`SNAPSHOT_1426_NO_COINCIDE: ${key} esperado=${expected} actual=${actual}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
