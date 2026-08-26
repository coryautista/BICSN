import { readFile } from 'node:fs/promises';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const DEVELOPMENT = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = DEVELOPMENT.sqlDatabase;
process.env.FIREBIRD_DATABASE = DEVELOPMENT.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

async function main(): Promise<void> {
  const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
  const pool = await connectDatabase();

  try {
    const database = await pool.request().query('SELECT DB_NAME() AS BaseDatos;');
    const databaseName = String(database.recordset[0]?.BaseDatos ?? '');
    if (databaseName !== DEVELOPMENT.sqlDatabase) {
      throw new Error(`DESTINO_SQL_NO_PERMITIDO:${databaseName}`);
    }

    const source = await readFile(
      new URL('../database/migrations/20260825_10_verify_qna_official_snapshot_projections.sql', import.meta.url),
      'utf8'
    );
    const sqlBatches = source.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean);
    const rows: any[] = [];
    for (const batch of sqlBatches) {
      const result = await pool.request().batch(batch);
      rows.push(...(result.recordsets ?? []).flat());
    }
    const evidence = rows.find((row) => row.Resultado === 'QNA_OFFICIAL_PROJECTIONS_SCHEMA_OK');
    if (!evidence) throw new Error('VERIFICACION_SIN_MARCADOR_OK');

    console.log(JSON.stringify({
      environment: 'DESARROLLO',
      sqlDatabase: databaseName,
      firebirdDatabase: DEVELOPMENT.firebirdDatabase,
      evidence
    }, null, 2));
    console.log('QNA_OFFICIAL_PROJECTIONS_DESARROLLO_VERIFY_OK');
  } finally {
    await closeDatabaseConnection();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
