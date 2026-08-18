import assert from 'node:assert/strict';
import sql, { type config as SqlConfig } from 'mssql';
import { env } from '../src/config/env.js';
import {
  FORMULA_CALCULO_CLAVE,
  FORMULA_PRECISION_POLICY
} from '../src/modules/aportacionesFondos/domain/entities/FormulaCalculo.js';
import { FormulaCalculoRepository } from '../src/modules/aportacionesFondos/infrastructure/persistence/FormulaCalculoRepository.js';
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
      const formula = await new FormulaCalculoRepository(pool).obtenerPorPeriodo(2026, 11);
      assert.equal(formula.claveFormula, FORMULA_CALCULO_CLAVE);
      assert.equal(formula.precisionPolicy, FORMULA_PRECISION_POLICY);
      assert.deepEqual([formula.anioVigencia, formula.numeroVersion], [2026, 1]);
      assert.equal(formula.detalleParametros.length, 15);
      assert.equal(formula.parametros.FRE_OTRAS, '0.267500000');
      console.log(`${database}: FORMULA_REPOSITORY_OK`);
    } finally {
      await pool.close();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
