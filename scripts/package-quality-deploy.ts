import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { cwd } from 'node:process';
import * as tar from 'tar';

const root = cwd();
const outputDirectory = join(root, 'dist-deploy', 'quality');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const archiveName = `BICSN-calidad-${stamp}.tar.gz`;
const archivePath = join(outputDirectory, archiveName);
const manifestPath = join(outputDirectory, `${archiveName}.sha256`);
const stagingDirectory = join(outputDirectory, `.staging-${stamp}`);

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
  'database/migrations/20260825_09_add_qna_official_snapshot_projections.sql',
  'database/migrations/20260825_10_verify_qna_official_snapshot_projections.sql',
  'database/migrations/20260826_11_strengthen_retenciones_v3_projection.sql',
  'database/migrations/20260826_12_verify_retenciones_v3_projection.sql',
  'database/migrations/20260826_13_add_qna_phase8_legacy_dual_write.sql',
  'database/migrations/20260826_14_verify_qna_phase8_legacy_dual_write.sql',
  'database/migrations/20260826_15_add_qna_phase9_applied_read_index.sql',
  'database/migrations/20260826_16_verify_qna_phase9_applied_read_index.sql',
  'database/migrations/20260826_17_create_qna_phase11_attempt_ledger.sql',
  'database/migrations/20260827_18_consolidate_revision_retention_release.sql',
  'database/migrations/20260827_19_verify_revision_retention_release.sql',
  'database/migrations/20260827_20_create_nomina_txt_sync_ledger_staging.sql',
  'database/migrations/20260827_21_verify_nomina_txt_sync_ledger_staging.sql',
  'database/migrations/20260901_22_add_nomina_staging_layout20_semantics.sql',
  'database/migrations/20260901_23_verify_nomina_staging_layout20_semantics.sql',
  'Dockerfile',
  'package.json',
  'package-lock.json',
  'tsconfig.json'
];

await mkdir(outputDirectory, { recursive: true });
await rm(stagingDirectory, { recursive: true, force: true });
await mkdir(stagingDirectory, { recursive: true });

try {
  for (const file of files) {
    if (file === 'Dockerfile') continue;
    await stat(join(root, file));
    await mkdir(dirname(join(stagingDirectory, file)), { recursive: true });
    await cp(join(root, file), join(stagingDirectory, file), { recursive: true });
  }

  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const committedDockerfile = execFileSync('git', ['show', 'HEAD:Dockerfile'], { cwd: root, encoding: 'buffer' });
  await writeFile(join(stagingDirectory, 'Dockerfile'), committedDockerfile);
  await writeFile(join(stagingDirectory, 'RELEASE-MANIFEST.json'), JSON.stringify({
    environment: 'CALIDAD',
    sourceCommit,
    createdAt: new Date().toISOString(),
    dockerfileSource: 'HEAD:Dockerfile',
    migrations: files.filter((file) => file.startsWith('database/migrations/')),
  }, null, 2), 'utf8');

  await tar.create({ cwd: stagingDirectory, file: archivePath, gzip: true, portable: true }, [...files, 'RELEASE-MANIFEST.json']);
  const archive = await readFile(archivePath);
  const sha256 = createHash('sha256').update(archive).digest('hex').toUpperCase();
  await writeFile(manifestPath, `${sha256}  ${archiveName}\n`, 'ascii');

  console.log(JSON.stringify({ archivePath, bytes: archive.length, sha256, files: files.length + 1, sourceCommit, dockerfileSource: 'HEAD:Dockerfile' }, null, 2));
  console.log('QUALITY_DEPLOY_PACKAGE_OK');
} finally {
  await rm(stagingDirectory, { recursive: true, force: true });
}
