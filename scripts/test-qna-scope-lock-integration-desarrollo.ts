import assert from 'node:assert/strict';
import sql from 'mssql';
import { DATABASE_ENVIRONMENTS, assertDatabaseEnvironment } from '../src/config/databaseEnvironments.js';
import { acquireQnaScopeLock, QnaScopeLockError, type QnaLockScope } from '../src/db/qnaScopeLock.js';

const DEVELOPMENT = DATABASE_ENVIRONMENTS.DESARROLLO;
process.env.SQLSERVER_DB = DEVELOPMENT.sqlDatabase;
process.env.FIREBIRD_DATABASE = DEVELOPMENT.firebirdDatabase;
assertDatabaseEnvironment('DESARROLLO', process.env.SQLSERVER_DB, process.env.FIREBIRD_DATABASE);

const { connectDatabase, closeDatabaseConnection } = await import('../src/db/mssql.js');
const pool = await connectDatabase();
const first = new sql.Transaction(pool);
const second = new sql.Transaction(pool);
const scope: QnaLockScope = {
  entidadId: 1,
  anio: 2099,
  quincena: 24,
  organica0: '98',
  organica1: '98',
  organica2: '98',
  organica3: '98',
};

try {
  await first.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  await second.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  await acquireQnaScopeLock(first, scope, 1000);
  await acquireQnaScopeLock(second, { ...scope, organica3: '99' }, 1000);
  await assert.rejects(
    acquireQnaScopeLock(second, scope, 100),
    error => error instanceof QnaScopeLockError && error.code === 'QNA_SCOPE_BUSY'
  );
  console.log('QNA_SCOPE_LOCK_INTEGRATION_DESARROLLO_OK');
} finally {
  await first.rollback().catch(() => undefined);
  await second.rollback().catch(() => undefined);
  await closeDatabaseConnection();
}
