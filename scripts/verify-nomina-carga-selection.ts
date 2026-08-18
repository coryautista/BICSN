import assert from 'node:assert/strict';
import sql, { type config as SqlConfig } from 'mssql';
import { env } from '../src/config/env.js';
import { NominaAplicacionQnalTxtRepository } from '../src/modules/nomina/infrastructure/persistence/NominaAplicacionQnalTxtRepository.js';
import { DATABASE_ENVIRONMENTS } from '../src/config/databaseEnvironments.js';

const databases = Object.values(DATABASE_ENVIRONMENTS).map((config) => config.sqlDatabase);

async function main(): Promise<void> {
  for (const database of databases) {
    const config: SqlConfig = {
      server: env.sql.server,
      database,
      user: env.sql.user,
      password: env.sql.password,
      port: env.sql.port,
      options: env.sql.options,
      pool: { max: 1, min: 0, idleTimeoutMillis: 5000 }
    };
    const pool = await new sql.ConnectionPool(config).connect();
    try {
      const scopes = await pool.request().query(`
        SELECT EntidadId, Anio, Quincena, Organica0, Organica1, Organica2, Organica3
        FROM dbo.NominaAplicacionQnalCarga
        WHERE TipoCarga = 'TXT' AND EsVigente = 1 AND Estatus = 'APLICADA'
        ORDER BY Anio, Quincena, Organica0, Organica1, Organica2, Organica3
      `);
      const repository = new NominaAplicacionQnalTxtRepository(pool);
      for (const row of scopes.recordset) {
        const result = await repository.consultarCargaVigente({
          entidadId: Number(row.EntidadId),
          anio: Number(row.Anio),
          quincena: Number(row.Quincena),
          organica0: String(row.Organica0).trim(),
          organica1: String(row.Organica1).trim(),
          organica2: String(row.Organica2).trim(),
          organica3: String(row.Organica3).trim()
        });
        assert.ok(result);
        assert.equal(result.tipoCarga, 'TXT');
        assert.equal(result.estatus, 'APLICADA');
        assert.equal(result.esVigente, true);
        assert.equal(result.rfcDuplicados, 0);
      }
      console.log(`${database}: NOMINA_SELECTION_OK scopes=${scopes.recordset.length}`);
    } finally {
      await pool.close();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
