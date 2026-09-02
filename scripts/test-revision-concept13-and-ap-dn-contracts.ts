import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [repository, worker, migration, verification, firebirdService, applicationRepository, command] = await Promise.all([
  readFile(new URL('../src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/reportes/revision/application/RevisionWorker.ts', import.meta.url), 'utf8'),
  readFile(new URL('../database/migrations/20260827_18_consolidate_revision_retention_release.sql', import.meta.url), 'utf8'),
  readFile(new URL('../database/migrations/20260827_19_verify_revision_retention_release.sql', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/afiliado/infrastructure/services/AfiliadoBdiSspeaFirebirdService.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules/afiliado/application/commands/AplicarBDIssspeaQNACommand.ts', import.meta.url), 'utf8'),
]);

const concept13Method = repository.slice(
  repository.indexOf('async calcularLiberacionRetenciones'),
  repository.indexOf('async obtenerReporte')
);
assert.match(concept13Method, /TIPO_FONDO IN \('LFA', 'LFM', 'LFP'\)/);
assert.doesNotMatch(concept13Method.split('// LPF')[0], /LPF/);
assert.match(concept13Method, /SUM\(FAA\)[\s\S]*SUM\(FAE\)[\s\S]*AS FAT/);
assert.match(worker, /numeroConcepto: 13[\s\S]*calcularLiberacionRetenciones/);
assert.doesNotMatch(worker, /numeroConcepto: (15|16)/);
assert.match(migration, /numeroConcepto IN \(15, 16\)/);
assert.match(verification, /REVISION_RETENTION_RELEASE_VERIFY_OK/);

assert.match(firebirdService, /const params = \[periodo, org0, org1, org2, org3\]/);
assert.match(command, /decision\.nominaCargaId !== null[\s\S]*ejecutarAP_DN_APLICAR/);
assert.match(command, /else \{[\s\S]*AP_P_APLICAR_C[\s\S]*AP_P_APLICAR_F/);
assert.match(applicationRepository, /s\.NominaCargaId IS NULL AND NOT EXISTS/);
assert.match(applicationRepository, /v\.NominaCargaId IS NULL AND s\.NominaCargaId IS NULL/);
assert.doesNotMatch(command, /decision\.nominaCargaId === null[\s\S]*ejecutarAP_DN_APLICAR/);

console.log('REVISION_CONCEPT13_AP_DN_CONTRACTS_OK');
