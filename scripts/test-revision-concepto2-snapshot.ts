import assert from 'node:assert/strict';
import {
  resolverConcepto2Snapshot,
  type RevisionQnaSnapshotRecord
} from '../src/modules/reportes/revision/domain/RevisionConcepto2Snapshot.js';
import type { RevisionTarea } from '../src/modules/reportes/revision/domain/Revision.types.js';
import { RevisionRepository } from '../src/modules/reportes/revision/infrastructure/persistence/RevisionRepository.js';

const tarea: RevisionTarea = {
  idRevisionTarea: 1,
  org0: '01',
  org1: '02',
  org2: '01',
  org3: '01',
  periodo: '1426',
  usuarioId: 'test',
  intentos: 1,
  claimToken: 'claim',
  liquidacionSnapshotId: '9007199254740993'
};

const snapshot: RevisionQnaSnapshotRecord = {
  liquidacionSnapshotId: '9007199254740993',
  estado: 'COMPLETO',
  esOficial: true,
  ultimaDecision: 'APROBADO',
  fuentes: 10,
  fuentesCompletas: 10,
  anio: 2026,
  quincena: 14,
  organica0: '01',
  organica1: '02',
  organica2: '01',
  organica3: '01',
  registros: 7,
  revision: 3,
  hashContenido: 'A'.repeat(64),
  precisionPolicy: 'MXN-DETAIL6-AGG2-TRUNC-v1',
  cairA2: '0.10',
  fraA2: '1.20',
  freA2: '2.30',
  prestacionesA2: '3.33',
  fhA2: '3.40',
  fvA2: '4.50',
  viviendaA2: '7.77',
  faaA2: '1.00',
  faeA2: '2.00',
  fatA2: '8.88',
  faiA2: '6.70'
};

const exacto = resolverConcepto2Snapshot(tarea, snapshot);
assert.deepEqual(exacto.importes, {
  CAIR: '0.10', FRA: '1.20', FRE: '2.30', PRESTACIONES: '3.33', FH: '3.40', FV: '4.50', VIVIENDA: '7.77',
  FAA: '1.00', FAE: '2.00', FAT: '8.88', FAI: '6.70'
});
assert.equal(exacto.importes.FAT, snapshot.fatA2);
assert.notEqual(exacto.importes.FAT, '3.00');
assert.deepEqual(exacto.liquidacionSnapshot, {
  liquidacionSnapshotId: snapshot.liquidacionSnapshotId,
  hashContenido: snapshot.hashContenido,
  revision: snapshot.revision,
  precisionPolicy: snapshot.precisionPolicy
});

assert.throws(
  () => resolverConcepto2Snapshot(tarea, null),
  /REVISION_QNA_SNAPSHOT_NO_ENCONTRADO/
);
assert.throws(
  () => resolverConcepto2Snapshot(tarea, { ...snapshot, esOficial: false }),
  /REVISION_QNA_SNAPSHOT_NO_OFICIAL/
);
assert.throws(
  () => resolverConcepto2Snapshot(tarea, { ...snapshot, estado: 'INCOMPLETO' }),
  /REVISION_QNA_SNAPSHOT_NO_COMPLETO/
);
assert.throws(
  () => resolverConcepto2Snapshot(tarea, { ...snapshot, organica3: '02' }),
  /REVISION_QNA_SNAPSHOT_SCOPE_MISMATCH/
);

let legacySql = '';
const legacyPool = {
  request() {
    return {
      input() { return this; },
      async query(query: string) {
        legacySql = query;
        return { recordset: [{
          CAIR: 1, FRA: 2, FRE: 3, FH: 4, FV: 5,
          FAA: 6, FAE: 7, FAT: 13, FAI: 8, RegistrosOrigen: 9
        }] };
      }
    };
  }
};
const legacy = await new RevisionRepository(legacyPool as never).calcularAplicacionQuincenal({
  ...tarea,
  liquidacionSnapshotId: null
});
assert.match(legacySql, /conciliacion\.RevisionAplicacionHistorico/);
assert.equal(legacy.importes.FAT, 13);
assert.equal(legacy.registros, 9);

console.log('REVISION_CONCEPTO2_SNAPSHOT_OK');
