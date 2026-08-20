import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';
import * as tar from 'tar';

const root = cwd();
const outputDirectory = join(root, 'dist-deploy', 'quality');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const archiveName = `BICSN-calidad-${stamp}.tar.gz`;
const archivePath = join(outputDirectory, archiveName);
const manifestPath = join(outputDirectory, `${archiveName}.sha256`);

const files = [
  'src',
  'types',
  'database/migrations/20260815_create_formula_calculo_version.sql',
  'database/migrations/20260815_verify_formula_calculo_version.sql',
  'database/migrations/20260816_add_nomina_carga_tipo_vigente.sql',
  'database/migrations/20260816_verify_nomina_carga_tipo_vigente.sql',
  'database/migrations/20260816_create_aportaciones_snapshot_v2.sql',
  'database/migrations/20260816_verify_aportaciones_snapshot_v2.sql',
  'database/migrations/20260817_create_snapshot_v2_decision.sql',
  'database/migrations/20260817_verify_snapshot_v2_decision.sql',
  'database/migrations/20260818_01_create_liquidacion_qna_snapshot.sql',
  'database/migrations/20260818_02_create_liquidacion_qna_workflow.sql',
  'database/migrations/20260818_03_create_retenciones_v3.sql',
  'database/migrations/20260818_04_add_liquidacion_snapshot_links.sql',
  'database/migrations/20260818_05_verify_liquidacion_v3.sql',
  'database/migrations/20260818_06_add_official_fund_totals.sql',
  'database/migrations/20260818_07_allow_qna_v3_decision_policy.sql',
  'database/migrations/20260819_08_add_snapshot_base_cotizacion_sueldo.sql',
  'Dockerfile',
  'package.json',
  'package-lock.json',
  'tsconfig.json'
];

await mkdir(outputDirectory, { recursive: true });
await tar.create({ cwd: root, file: archivePath, gzip: true, portable: true }, files);
const archive = await readFile(archivePath);
const sha256 = createHash('sha256').update(archive).digest('hex').toUpperCase();
await writeFile(manifestPath, `${sha256}  ${archiveName}\n`, 'ascii');

console.log(JSON.stringify({ archivePath, bytes: archive.length, sha256, files: files.length }, null, 2));
console.log('QUALITY_DEPLOY_PACKAGE_OK');
