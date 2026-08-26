import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(new URL('../database/migrations/20260826_13_add_qna_phase8_legacy_dual_write.sql', import.meta.url), 'utf8');
const verifier = await readFile(new URL('../database/migrations/20260826_14_verify_qna_phase8_legacy_dual_write.sql', import.meta.url), 'utf8');
const integration = await readFile(new URL('./test-qna-phase8-legacy-integration-desarrollo.ts', import.meta.url), 'utf8');
const repository = await readFile(new URL('../src/modules/liquidacionQna/infrastructure/persistence/LiquidacionQnaRepository.ts', import.meta.url), 'utf8');
const legacyRepository = await readFile(new URL('../src/modules/aplicacionQuincenal/infrastructure/persistence/AplicacionQuincenalRepository.ts', import.meta.url), 'utf8');

const selected = [
  'IndividualesAhorroHistorico', 'IndividualesViviendaHistorico', 'IndividualesPrestacionesHistorico',
  'IndividualesCairHistorico', 'PensionNominaTransitorioHistorico', 'GuarderiasHistorico', 'AguinaldoHistorico',
  'PrestamosCortoPlazoHistorico', 'PrestamosMedianoPlazoHistorico', 'PrestamosHipotecariosHistorico',
  'ResumenHistorico', 'RevisionAplicacionHistorico'
];
for (const store of selected) {
  assert.match(migration, new RegExp(store), `Falta el store seleccionado ${store}`);
  assert.match(verifier, new RegExp(store), `Falta la firma verificada de ${store}`);
}
assert.doesNotMatch(migration, /INSERT\s+(?:INTO\s+)?aportaciones\.DetalleHistoricoAguinaldo/i);
assert.match(migration, /QNA-LEGACY-DUAL-WRITE-V1/);
assert.match(migration, /LEGACY-PROJECTION-v1/);
assert.match(migration, /SAVE TRANSACTION QnaLegacyP8/);
assert.match(migration, /XACT_STATE\(\)=-1/);
assert.match(migration, /LEGACY_SCOPE_COLLISION/);
assert.match(migration, /qna_legacy_repair_executor/);
assert.match(migration, /QnaLegacyProjectorCertificate/);
assert.match(migration, /QnaLegacyCapabilityLease/);
assert.match(migration, /Depth=Depth\+1/);
assert.match(migration, /DENY INSERT,UPDATE,DELETE ON OBJECT::liquidacion\.QnaLegacyCapabilityLease TO public/);
assert.doesNotMatch(migration, /IS_ROLEMEMBER\(N'qna_legacy_projector_executor'\)/i);
assert.match(verifier, /QnaPhase8VerifierLeastPrivilege/);
assert.match(verifier, /DB_OWNER_EXCEPTION_SQL_ISOLATION_NOT_ENFORCEABLE/);
assert.doesNotMatch(integration, /AplicacionQuincenalRepository|firebirdConnection/i);
assert.match(migration, /QNA_LEGACY_FAIL_AFTER_DETAILS/);
assert.doesNotMatch(migration, /EXEC(?:UTE)?\s+[^;]*(?:AP_S_FONDOS|AP_S_PCP|AP_S_VIV|AP_S_HIP_QNA|AP_S_COMP_QNA)/i);
assert.equal(repository.match(/await this\.projectV5Legacy\(transaction/g)?.length, 2, 'Ambas ramas de promocion deben proyectar legacy');
assert.match(legacyRepository, /assertNoOfficialV5LegacyScope/);

console.log('QNA_PHASE8_LEGACY_CONTRACTS_OK');
