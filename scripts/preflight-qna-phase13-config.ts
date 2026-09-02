import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';
import { resolveSqlDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

const environment = resolveSqlDatabaseEnvironment(env.sql.database);
assert.ok(environment, `SQLSERVER_DB_NO_REGISTRADA:${env.sql.database}`);
const allowDisabled = process.argv.includes('--allow-disabled');

console.log(JSON.stringify({
  check: 'QNA_PHASE13_DUAL_WRITE_CONFIG_PREFLIGHT',
  environment,
  sqlDatabase: env.sql.database,
  enabled: env.qna.legacyDualWriteEnabled,
  allowDisabled
}, null, 2));

if (!env.qna.legacyDualWriteEnabled && !allowDisabled) {
  throw new Error('QNA_LEGACY_DUAL_WRITE_DISABLED_NOT_ALLOWED_BY_PREFLIGHT');
}

console.log('QNA_PHASE13_DUAL_WRITE_CONFIG_PREFLIGHT_OK');
