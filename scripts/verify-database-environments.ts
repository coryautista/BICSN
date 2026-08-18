import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import 'dotenv/config';
import { DATABASE_ENVIRONMENTS, resolveDatabaseEnvironment } from '../src/config/databaseEnvironments.js';

async function main(): Promise<void> {
  const pairs = Object.values(DATABASE_ENVIRONMENTS);
  assert.equal(new Set(pairs.map((pair) => pair.sqlDatabase)).size, pairs.length);
  assert.equal(new Set(pairs.map((pair) => pair.firebirdDatabase)).size, pairs.length);

  const [environmentDocument, envExample, deployTemplate, deployGenerated] = await Promise.all([
    readFile(new URL('../DATABASE_ENVIRONMENTS.md', import.meta.url), 'utf8'),
    readFile(new URL('../.env.example', import.meta.url), 'utf8'),
    readFile(new URL('../deploy_bicsn.template.sh', import.meta.url), 'utf8'),
    readFile(new URL('../dist-deploy/deploy_bicsn.sh', import.meta.url), 'utf8')
  ]);

  assertEnvPair(envExample, DATABASE_ENVIRONMENTS.DESARROLLO);
  assertDeployPair(deployTemplate, DATABASE_ENVIRONMENTS.CALIDAD, 'DEV_DIR');
  assertDeployPair(deployTemplate, DATABASE_ENVIRONMENTS.PRODUCCION, 'PROD_DIR');
  assertDeployPair(deployGenerated, DATABASE_ENVIRONMENTS.CALIDAD, 'DEV_DIR');
  assertDeployPair(deployGenerated, DATABASE_ENVIRONMENTS.PRODUCCION, 'PROD_DIR');

  for (const [environment, pair] of Object.entries(DATABASE_ENVIRONMENTS)) {
    assert.ok(environmentDocument.includes(`| ${DISPLAY_NAMES[environment as keyof typeof DISPLAY_NAMES]} | \`${pair.sqlDatabase}\` | \`${pair.firebirdDatabase}\``));
  }
  assert.match(environmentDocument, /Desarrollo no participa en el script de despliegue/);

  const activeSql = process.env.SQLSERVER_DB;
  const activeFirebird = process.env.FIREBIRD_DATABASE;
  if (activeSql || activeFirebird) {
    assert.ok(activeSql && activeFirebird, 'El entorno activo debe definir SQLSERVER_DB y FIREBIRD_DATABASE');
    const activeEnvironment = resolveDatabaseEnvironment(activeSql, activeFirebird);
    assert.ok(activeEnvironment, `La pareja activa no pertenece a la matriz: SQL=${activeSql}, Firebird=${activeFirebird}`);
    console.log(`ACTIVE_DATABASE_ENVIRONMENT=${activeEnvironment}`);
  }

  console.log('DATABASE_ENVIRONMENTS_OK');
}

function assertEnvPair(content: string, pair: { sqlDatabase: string; firebirdDatabase: string }): void {
  assert.match(content, new RegExp(`^SQLSERVER_DB=${escapeRegex(pair.sqlDatabase)}$`, 'm'));
  assert.match(content, new RegExp(`^FIREBIRD_DATABASE=${escapeRegex(pair.firebirdDatabase)}$`, 'm'));
}

function assertDeployPair(
  content: string,
  pair: { sqlDatabase: string; firebirdDatabase: string },
  targetVariable: 'DEV_DIR' | 'PROD_DIR'
): void {
  assert.deepEqual(readDeployValues(content, 'SQLSERVER_DB', targetVariable), [pair.sqlDatabase]);
  assert.deepEqual(readDeployValues(content, 'FIREBIRD_DATABASE', targetVariable), [pair.firebirdDatabase]);
}

function readDeployValues(content: string, key: string, targetVariable: string): string[] {
  const pattern = new RegExp(
    `^set_env_value\\s+${escapeRegex(key)}\\s+(\\S+)\\s+"\\$${escapeRegex(targetVariable)}/\\.env"\\s*$`,
    'gm'
  );
  return [...content.matchAll(pattern)].map((match) => match[1]);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DISPLAY_NAMES = {
  DESARROLLO: 'Desarrollo',
  CALIDAD: 'Calidad',
  PRODUCCION: 'Producción'
} as const;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
